import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateMusic, checkMusicStatus, generateImage } from "@/lib/kie";
import { generateExpandedPrompt } from "@/lib/promptExpansion";
import { CREDITS_PER_GENERATION, STARTING_CREDITS } from "@/lib/config";

export const dynamic = "force-dynamic";

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
    
    // Expand the user's vibe into detailed prompts
    const { musicPrompt, artPrompt } = generateExpandedPrompt(userVibe);

    console.log("🎵 [GENERATION START] user:", user.id, "prompt:", userVibe);

    // Generate music using the expanded prompt
    const taskId = await generateMusic(musicPrompt);
    
    console.log("🎵 [GENERATION START] task_id:", taskId, "model: V5");

    // DON'T deduct credits yet - wait for callback confirmation
    // Credits will be deducted in the callback route when generation succeeds
    
    // Store pending generation in tracks table for tracking
    try {
      await supabaseAdmin
        .from('tracks')
        .insert({
          task_id: taskId,
          user_id: user.id,
          title: 'Generating...',
          prompt: userVibe,
          audio_url: null,
          image_url: null,
          status: 'pending',
          created_at: new Date().toISOString()
        });
      console.log("📝 [GENERATION START] Pending track stored");
    } catch (trackErr) {
      console.error("⚠️ [GENERATION START] Failed to store pending track:", trackErr);
      // Continue anyway - callback will create the final track
    }
    
    remainingCredits = currentCredits; // Return current credits, not deducted yet

    // Return immediately with task ID - Vercel has 5-minute timeout limit
    // The generation happens in the background via the API's callback system
    return NextResponse.json({
      success: true,
      provider: "suno-api",
      taskId: taskId,
      message: "🎶 Composing your SoundPainting… this usually takes about 1–2 minutes.",
      prompt: userVibe,
      remainingCredits: remainingCredits,
      expandedPrompts: {
        music: musicPrompt,
        art: artPrompt
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