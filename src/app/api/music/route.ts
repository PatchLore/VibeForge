import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateMusic, checkMusicStatus, generateImage } from "@/lib/kie";
import { buildMusicPrompt, buildImagePrompt } from "@/lib/enrichPrompt";
import { generateTrackTitle } from "@/lib/generateTrackTitle";
import { CREDITS_PER_GENERATION, STARTING_CREDITS } from "@/lib/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  console.log("🎵 GET /api/music endpoint reached");
  return NextResponse.json({
    message: "GET works",
    endpoint: "/api/music",
    methods: ["GET", "POST"],
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt } = body;
    
    // Extract user from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization token'
      }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    if (!supabaseAdmin) {
      console.error('❌ Supabase admin client not initialized');
      return NextResponse.json({
        success: false,
        error: 'SUPABASE_NOT_INITIALIZED',
        message: 'Database connection not available'
      }, { status: 500 });
    }
    
    // Get user from token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json({
        success: false,
        error: 'AUTH_FAILED',
        message: 'Failed to authenticate user'
      }, { status: 401 });
    }
    
    console.log("[/api/music] user id:", user.id);

    const userVibe = prompt || "calm";
    let remainingCredits = 0;
    
    // Check and deduct credits using server client
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('user_id', user.id)
      .maybeSingle();
    
    console.log("[/api/music] credits row:", profile, profileErr);
    
    // If no profile, create one with starting credits
    let currentCredits = profile?.credits;
    if (!profile) {
      console.log("Creating profile with starting credits:", STARTING_CREDITS);
      const { error: createErr } = await supabaseAdmin
        .from('profiles')
        .insert({ user_id: user.id, credits: STARTING_CREDITS });
      
      if (createErr) {
        console.error('❌ Failed to create profile:', createErr);
        return NextResponse.json({
          success: false,
          error: 'PROFILE_CREATION_FAILED',
          message: 'Failed to create user profile'
        }, { status: 500 });
      }
      
      // Refetch the created profile
      const { data: newProfile, error: refetchErr } = await supabaseAdmin
        .from('profiles')
        .select('credits')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (refetchErr || !newProfile) {
        console.error('❌ Failed to refetch profile:', refetchErr);
        return NextResponse.json({
          success: false,
          error: 'PROFILE_REFETCH_FAILED',
          message: 'Failed to retrieve user profile'
        }, { status: 500 });
      }
      
      currentCredits = newProfile.credits;
    }
    
    // Check if we have enough credits
    if (currentCredits < CREDITS_PER_GENERATION) {
      console.warn('⚠️ Insufficient credits:', currentCredits);
      return NextResponse.json({
        success: false,
        error: 'INSUFFICIENT_CREDITS',
        message: `Not enough credits. You need ${CREDITS_PER_GENERATION} credits to generate music. You have ${currentCredits} credits.`,
        credits: currentCredits
      }, { status: 403 });
    }
    
    // Build structured prompts without ambient bias
    const musicPrompt = buildMusicPrompt(userVibe);
    const imagePrompt = buildImagePrompt(userVibe);
    
    // Add explicit guards
    if (!musicPrompt || musicPrompt.length < 12) {
      console.error("❌ [MUSIC PROMPT MISSING]", { userVibe, musicPrompt });
    }

    if (!imagePrompt || imagePrompt.length < 12) {
      console.error("❌ [IMAGE PROMPT MISSING]", { userVibe, imagePrompt });
    }

    // Detect style for user-friendly descriptions
    const lowerVibe = userVibe.toLowerCase();
    let detectedStyle = 'emotion and mood';
    let styleDescriptor = 'color and motion';
    
    if (lowerVibe.includes('game') || lowerVibe.includes('gaming') || lowerVibe.includes('roblox')) {
      detectedStyle = 'energetic gaming vibes';
      styleDescriptor = 'neon-lit digital worlds';
    } else if (lowerVibe.includes('lofi') || lowerVibe.includes('chill') || lowerVibe.includes('study')) {
      detectedStyle = 'chill, relaxed vibes';
      styleDescriptor = 'soft, nostalgic atmospheres';
    } else if (lowerVibe.includes('cinematic') || lowerVibe.includes('epic') || lowerVibe.includes('orchestral')) {
      detectedStyle = 'cinematic grandeur';
      styleDescriptor = 'dramatic, sweeping visuals';
    } else if (lowerVibe.includes('trap') || lowerVibe.includes('hip-hop') || lowerVibe.includes('urban')) {
      detectedStyle = 'urban, rhythmic beats';
      styleDescriptor = 'street art and city vibes';
    } else if (lowerVibe.includes('rock') || lowerVibe.includes('metal') || lowerVibe.includes('electric')) {
      detectedStyle = 'powerful, energetic rock';
      styleDescriptor = 'bold, dynamic imagery';
    } else if (lowerVibe.includes('pop') || lowerVibe.includes('upbeat') || lowerVibe.includes('bright')) {
      detectedStyle = 'catchy, upbeat pop';
      styleDescriptor = 'vibrant, colorful aesthetics';
    } else if (lowerVibe.includes('ambient') || lowerVibe.includes('dream') || lowerVibe.includes('ethereal')) {
      detectedStyle = 'dreamy, ambient soundscapes';
      styleDescriptor = 'ethereal, floating visuals';
    }

    // Create user-friendly display prompts
    const displayMusicPrompt = `Creating music inspired by "${userVibe}" — focusing on ${detectedStyle}.`;
    const displayImagePrompt = `Visualizing the feeling of "${userVibe}" through ${styleDescriptor}.`;
    
    // Clean music prompt to remove any remaining bias phrases
    const cleanedMusicPrompt = musicPrompt
      .replace(/ambient generative soundscape/gi, "")
      .replace(/focus and relaxation/gi, "")
      .trim();

    console.log("🎵 Generating:", cleanedMusicPrompt);
    console.log("🎨 Creating:", imagePrompt);
    console.log("🎵 [DISPLAY] User-friendly:", displayMusicPrompt);
    console.log("🎨 [DISPLAY] User-friendly:", displayImagePrompt);
    console.log("🔍 [DEBUG] Music prompt length:", cleanedMusicPrompt.length);
    console.log("🔍 [DEBUG] Image prompt length:", imagePrompt.length);
    console.log("🎵 [GENERATION START] user:", user.id, "prompt:", userVibe);
    console.log("🎯 [GENERATION START] detected intent:", "structured");
    console.log("🎵 [GENERATION START] structured music prompt:", cleanedMusicPrompt);
    console.log("🖼️ [GENERATION START] literal image prompt:", imagePrompt);
    console.log("[PROMPT FIXED]", { musicPrompt: cleanedMusicPrompt, imagePrompt });

    // Generate music using the cleaned prompt
    const taskId = await generateMusic(cleanedMusicPrompt);
    
    console.log("🎵 [GENERATION START] task_id:", taskId, "model: V5");

    // DON'T deduct credits yet - wait for callback confirmation
    // Credits will be deducted in the callback route when generation succeeds
    
    // Store pending generation in tracks table for tracking
    try {
      const generatedTitle = generateTrackTitle(userVibe);
      console.log("🎵 [MUSIC API] Generated title for pending track:", generatedTitle);
      
      await supabaseAdmin
        .from('tracks')
        .insert({
          task_id: taskId,
          user_id: user.id,
          title: generatedTitle,
          prompt: userVibe,
          extended_prompt: `${userVibe} | Music: ${cleanedMusicPrompt} | Visual: ${imagePrompt}`,
          audio_url: null,
          image_url: null,
          status: 'pending',
          created_at: new Date().toISOString()
        });
      console.log("📝 [GENERATION START] Pending track stored with extended prompt and generated title");
    } catch (trackErr) {
      console.error("⚠️ [GENERATION START] Failed to store pending track:", trackErr);
      // Continue anyway - callback will create the final track
    }
    
    remainingCredits = currentCredits; // Return current credits, not deducted yet

    // Add safety logging for display prompts
    console.log("🎨 [RETURNING DISPLAY PROMPTS]", { 
      music: displayMusicPrompt, 
      image: displayImagePrompt 
    });

    // Return immediately with task ID - Vercel has 5-minute timeout limit
    // The generation happens in the background via the API's callback system
    return NextResponse.json({
      success: true,
      provider: "suno-api",
      taskId: taskId,
      message: "🎶 Composing your SoundPainting… this usually takes about 1–2 minutes.",
      prompt: userVibe,
      remainingCredits: remainingCredits,
      musicPrompt: displayMusicPrompt,
      imagePrompt: displayImagePrompt,
      expandedPrompts: {
        music: displayMusicPrompt,
        image: displayImagePrompt,
        combined: `${userVibe} | Music: ${displayMusicPrompt} | Visual: ${displayImagePrompt}`,
        intent: detectedStyle
      }
    });

  } catch (err: unknown) {
    console.error("SoundPainting error:", err);

    // Return professional error message instead of fallback audio
    return NextResponse.json({
      success: false,
      message: "🎵 SoundPainting generation is temporarily unavailable. Please try again in a few moments.",
    }, { status: 503 });
  }
}