import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateMusic } from "@/lib/kie";
import { buildMusicPrompt, buildImagePrompt, generateEnrichedPrompts } from "@/lib/enrichPrompt";
import { generateTrackTitle, detectVibe, generateSummary } from "@/lib/generateTrackTitle";
import { CREDITS_PER_GENERATION, STARTING_CREDITS } from "@/lib/config";
import { generateImageDirect } from "@/lib/generateImage";

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
      // Use centralized enrichment function
      console.log("🔍 [API] Calling generateEnrichedPrompts with:", userVibe);
      const expandedPrompts = generateEnrichedPrompts(userVibe);
      displayMusicPrompt = expandedPrompts.music;
      displayImagePrompt = expandedPrompts.image;
      console.log("✅ [API] Enriched prompts generated successfully");
      console.log("✅ [API] Music prompt:", displayMusicPrompt);
      console.log("✅ [API] Image prompt:", displayImagePrompt);
    } catch (e) {
      console.error("❌ [API] Enrichment error:", e);
      console.warn("⚠️ Non-blocking display prompt error:", e);
      // Fallback to technical prompts if emotion mapping fails
      displayMusicPrompt = cleanedMusicPrompt;
      displayImagePrompt = imagePrompt;
      console.log("⚠️ [API] Using fallback prompts");
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

    // Generate music and image concurrently using new API structure
    console.log("🚀 [GENERATION START] Starting concurrent music + image generation");
    
    // Generate music via Kie.ai (async, will callback)
    console.log("🎵 [GENERATION START] BEFORE generateMusic() call");
    const musicResponse = await generateMusic(cleanedMusicPrompt);
    
    // --- TASK-ID INSERTION FIX ---
    // Handle both string (legacy) and object (new) return types
    const extractedTaskId = typeof musicResponse === 'string' 
      ? musicResponse 
      : (musicResponse?.taskId || null);
    
    if (!extractedTaskId) {
      console.error("[CREATE TRACK] ERROR: generateMusic() returned NULL taskId");
      return NextResponse.json(
        { error: "Music API failed to return task ID" },
        { status: 500 }
      );
    }

    taskId = extractedTaskId;
    console.log("[CREATE TRACK] Task ID returned from Kie:", taskId);

    // Insert the track BEFORE any image generation happens
    const vibe = detectVibe(userVibe);
    const summary = generateSummary(userVibe);
    const generatedTitle = generateTrackTitle(userVibe);
    const extendedPrompt = `${userVibe} | Music: ${cleanedMusicPrompt} | Visual: ${imagePrompt}`;

    // Ensure task_id is unique before insert
    const { data: existing, error: existingErr } = await supabaseAdmin
      .from('tracks')
      .select('id')
      .eq('task_id', taskId)
      .maybeSingle();

    if (existingErr) {
      console.warn('⚠️ [CREATE TRACK] task check error:', existingErr.message);
    }

    if (existing?.id) {
      console.warn(`⚠️ [CREATE TRACK] Duplicate task_id skipped: ${taskId}`);
      return NextResponse.json({ error: 'Duplicate task_id detected', taskId }, { status: 409 });
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("tracks")
      .insert({
        task_id: taskId,       // <-- CRITICAL FIELD
        user_id: user.id,
        title: generatedTitle,
        prompt: userVibe,
        extended_prompt: extendedPrompt,
        status: "processing",
        image_url: null,
        audio_url: null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error("[CREATE TRACK] FAILED TO INSERT TRACK:", insertError);
      return NextResponse.json(
        { error: "Database insert error", details: insertError },
        { status: 500 }
      );
    }

    console.log("[CREATE TRACK] Track inserted with taskId:", inserted.task_id);
    const trackId = inserted.id;
    console.log("🎵 [GENERATION START] music task_id:", taskId, "model: V5");
    
    // Generate image directly (no HTTP call needed) - synchronous
    let generatedImageUrl: string | null = null;
    try {
      console.log("🖼️ [GENERATION START] BEFORE generateImageDirect() call");
      console.log("🖼️ [GENERATION START] Image prompt:", imagePrompt.substring(0, 100) + "...");
      generatedImageUrl = await generateImageDirect({
        prompt: imagePrompt,
        width: 1344,
        height: 768,
      });
      console.log("🖼️ [GENERATION START] AFTER generateImageDirect() returned");
      console.log("🖼️ [GENERATION START] Image generated successfully:", generatedImageUrl ? "yes" : "no");
      if (generatedImageUrl) {
        console.log("🖼️ [GENERATION START] Image data URI length:", generatedImageUrl.length);
        console.log("🖼️ [GENERATION START] Image starts with data:image:", generatedImageUrl.startsWith("data:image"));
      }
    } catch (e: any) {
      console.error("❌ [GENERATION START] Image generation EXCEPTION:", e?.message || e);
      console.error("❌ [GENERATION START] Image generation STACK:", e?.stack);
      console.warn("⚠️ [GENERATION START] Continuing without image - music generation will proceed");
    }
    
    console.log("🖼️ [GENERATION START] image status:", generatedImageUrl ? "generated" : "none");

    // Update the track with image URL if generated
    if (generatedImageUrl && inserted?.id) {
      try {
        await supabaseAdmin
          .from('tracks')
          .update({
            image_url: generatedImageUrl,
            resolution: '1344x768',
            updated_at: new Date().toISOString()
          })
          .eq('id', inserted.id);
        console.log("📝 [GENERATION START] Image URL updated for track:", inserted.id);
      } catch (e) {
        console.warn("⚠️ [GENERATION START] Failed to update image URL:", e);
      }
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