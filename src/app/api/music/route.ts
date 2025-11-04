import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateMusic, checkMusicStatus, generateImage } from "@/lib/kie";
import { buildMusicPrompt, buildImagePrompt, mapEmotionToStyle } from "@/lib/enrichPrompt";
import { generateTrackTitle, detectVibe, generateSummary } from "@/lib/generateTrackTitle";
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
  let taskId: string | undefined;
  
  try {
    // Robust input guards
    const body = await req.json().catch(() => ({}));
    const userVibeRaw = (body?.prompt ?? "").toString();
    const userVibe = userVibeRaw.trim();
    
    if (!userVibe) {
      return NextResponse.json({ success: false, error: "Empty prompt" }, { status: 400 });
    }
    
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
    
    // Build technical prompts (the ones the model needs)
    const musicPrompt = buildMusicPrompt(userVibe);
    const imagePrompt = buildImagePrompt(userVibe);
    
    // Add explicit guards
    if (!musicPrompt || musicPrompt.length < 12) {
      console.error("❌ [MUSIC PROMPT MISSING]", { userVibe, musicPrompt });
    }

    if (!imagePrompt || imagePrompt.length < 12) {
      console.error("❌ [IMAGE PROMPT MISSING]", { userVibe, imagePrompt });
    }

    // Clean music prompt to remove any remaining bias phrases
    const cleanedMusicPrompt = musicPrompt
      .replace(/ambient generative soundscape/gi, "")
      .replace(/focus and relaxation/gi, "")
      .trim();

    // Non-blocking display prompt creation (never allowed to throw)
    // Use emotion mapping for consistent interpretation
    let displayMusicPrompt = null;
    let displayImagePrompt = null;

    try {
      const style = mapEmotionToStyle(userVibe);
      
      // Create enriched prompts using emotion mapping (consistent with buildMusicPrompt/buildImagePrompt)
      displayMusicPrompt = `Create a ${style.music} that captures the feeling of "${userVibe}". Include emotional depth and dynamic structure.`;
      displayImagePrompt = `A ${style.image} representing "${userVibe}", with cinematic lighting, high detail, and professional composition.`;
      
      console.log("🎭 [EMOTION MAP] Style detected:", style);
      console.log("🎵 [ENRICHMENT TEST] Music:", displayMusicPrompt);
      console.log("🎨 [ENRICHMENT TEST] Image:", displayImagePrompt);
    } catch (e) {
      console.warn("⚠️ Non-blocking display prompt error:", e);
      // Fallback to technical prompts if emotion mapping fails
      displayMusicPrompt = cleanedMusicPrompt;
      displayImagePrompt = imagePrompt;
    }

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

    // Generate music task and insert pending record immediately for callback linkage
    taskId = await generateMusic(cleanedMusicPrompt);
    console.log("🎵 [GENERATION START] task_id:", taskId, "model: V5");

    if (!taskId) {
      throw new Error("Missing taskId from music generation");
    }

    const vibe = detectVibe(userVibe);
    const summary = generateSummary(userVibe);
    const generatedTitle = generateTrackTitle(userVibe);

    try {
      // Ensure task_id is unique before insert
      const { data: existing, error: existingErr } = await supabaseAdmin
        .from('tracks')
        .select('id')
        .eq('task_id', taskId)
        .maybeSingle();

      if (existingErr) {
        console.warn('⚠️ [GENERATION START] task check error:', existingErr.message);
      }

      if (existing?.id) {
        console.warn(`⚠️ Duplicate task_id skipped: ${taskId}`);
        return NextResponse.json({ error: 'Duplicate task_id detected', taskId }, { status: 409 });
      }

      await supabaseAdmin
        .from('tracks')
        .insert({
          task_id: taskId,
          user_id: user.id,
          title: generatedTitle,
          prompt: userVibe,
          extended_prompt: `${userVibe} | Music: ${cleanedMusicPrompt} | Visual: ${imagePrompt}`,
          status: 'processing',
          created_at: new Date().toISOString()
        });
      console.log("📝 [GENERATION START] Pending track inserted for task linkage");
    } catch (e) {
      console.warn("⚠️ [GENERATION START] Failed to insert pending track:", e);
    }

    remainingCredits = currentCredits;

    const payload: any = { 
      success: true,
      provider: "suno-api",
      taskId: taskId,
      message: "🎶 Composing your SoundPainting… this usually takes about 1–2 minutes.",
      prompt: userVibe,
      title: generatedTitle,
      remainingCredits: remainingCredits,
      expandedPrompts: {
        music: displayMusicPrompt || cleanedMusicPrompt || "",
        image: displayImagePrompt || imagePrompt || "",
        title: generatedTitle
      }
    };

    console.log("🎨 [EXPANDED PROMPTS SENT]", payload.expandedPrompts);
    return NextResponse.json(payload, { status: 200 });

  } catch (err: any) {
    console.error("❌ /api/music error:", err?.message || err);
    
    // If we have already created a taskId/pending record, never 503 the user
    if (typeof taskId === "string" && taskId.length > 0) {
      return NextResponse.json({ 
        success: true, 
        taskId, 
        warning: "Queued with limited metadata" 
      }, { status: 200 });
    }
    
    // Otherwise, return a 500 with a clear message
    return NextResponse.json({ 
      success: false, 
      error: "Failed to start generation" 
    }, { status: 500 });
  }
}