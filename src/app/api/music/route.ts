import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateMusic, checkMusicStatus, generateImage } from "@/lib/kie";
import { buildMusicPrompt, buildImagePrompt } from "@/lib/enrichPrompt";
import { generateTrackTitle, generateCreativeTitleTwoWords, detectVibe, generateSummary } from "@/lib/generateTrackTitle";
import { CREDITS_PER_GENERATION, STARTING_CREDITS } from "@/lib/config";

// Fallback polling mechanism for slow Kie.ai completions
async function startFallbackPolling(taskId: string) {
  console.log("🔄 [FALLBACK POLLING] Starting background polling for task:", taskId);
  
  const maxRetries = 30; // 30 x 10s = 5 minutes
  let pollData: any = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const pollRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/status?taskId=${taskId}`);
      pollData = await pollRes.json();

      if (pollData.status === "SUCCESS" && pollData.track?.audioUrl) {
        console.log("✅ [POLL SUCCESS] Audio ready from /api/status");
        if (supabaseAdmin) {
          await supabaseAdmin
            .from("tracks")
            .update({
              audio_url: pollData.track.audioUrl,
              image_url: pollData.track.imageUrl || null,
              status: "completed",
              updated_at: new Date().toISOString(),
            })
            .eq("task_id", taskId);
          console.log("✅ [FALLBACK POLLING] Track completed successfully");
          return;
        }
      }

      console.log("⏳ [POLL] Still waiting for Kie.ai completion...", i + 1);
      await new Promise(r => setTimeout(r, 10000)); // 10s wait
    } catch (error) {
      console.error("❌ [POLL ERROR]", error);
      await new Promise(r => setTimeout(r, 10000)); // Continue polling even on error
    }
  }

  // If still not completed after retries, do a direct API check
  if (!pollData?.track?.audioUrl) {
    console.log("⚠️ [POLL FALLBACK] Checking Kie.ai directly...");
    try {
      const check = await fetch(`https://api.kie.ai/api/v1/generate/record-info?taskId=${taskId}`, {
        headers: { Authorization: `Bearer ${process.env.VIBEFORGE_API_KEY}` },
      });
      const checkData = await check.json();

      if (checkData?.data?.response?.sunoData?.[0]?.audio_url) {
        console.log("✅ [POLL FALLBACK SUCCESS] Retrieved final audio_url directly.");
        if (supabaseAdmin) {
          await supabaseAdmin
            .from("tracks")
            .update({
              audio_url: checkData.data.response.sunoData[0].audio_url,
              image_url: checkData.data.response.sunoData[0].image_url || null,
              status: "completed",
              updated_at: new Date().toISOString(),
            })
            .eq("task_id", taskId);
          console.log("✅ [FALLBACK POLLING] Track completed via direct API check");
        }
      } else {
        console.warn("❌ [POLL FALLBACK] Still no result after direct check.");
      }
    } catch (error) {
      console.error("❌ [POLL FALLBACK ERROR]", error);
    }
  }
}

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

    // Create creative, narrative-style display prompts (never allowed to throw)
    let displayMusicPrompt = null;
    let displayImagePrompt = null;

    try {
      // Use the creative music and image prompts directly for display
      // They're already enriched with narrative descriptions
      displayMusicPrompt = musicPrompt;
      displayImagePrompt = imagePrompt;
    } catch (e) {
      console.warn("⚠️ Non-blocking display prompt error:", e);
      // Fallback to basic prompts
      displayMusicPrompt = musicPrompt || `Creating music inspired by "${userVibe}"`;
      displayImagePrompt = imagePrompt || `Visualizing "${userVibe}"`;
    }
    
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
    taskId = await generateMusic(cleanedMusicPrompt);
    
    console.log("🎵 [GENERATION START] task_id:", taskId, "model: V5");

    // DON'T deduct credits yet - wait for callback confirmation
    // Credits will be deducted in the callback route when generation succeeds
    
    // Generate enforced two-word TitleCase title, vibe and summary
    const generatedTitle = generateCreativeTitleTwoWords(userVibe);
    const generatedVibe = detectVibe(userVibe);
    const generatedSummary = generateSummary(userVibe);
    console.log("🎵 [MUSIC API] Generated creative title for pending track:", generatedTitle);
    
    // Store pending generation in tracks table for tracking
    try {
      await supabaseAdmin
        .from('tracks')
        .insert({
          task_id: taskId,
          user_id: user.id,
          title: generatedTitle,
          prompt: userVibe,
          vibe: generatedVibe,
          summary: generatedSummary,
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

    // Response structure with expandedPrompts for frontend display
    const payload: any = { 
      success: true, 
      provider: "suno-api",
      taskId: taskId,
      message: "🎶 Composing your SoundPainting… this usually takes about 1–2 minutes.",
      prompt: userVibe,
      title: generatedTitle, // Include the generated track title
      remainingCredits: remainingCredits,
      expandedPrompts: {
        music: displayMusicPrompt || cleanedMusicPrompt || "",
        image: displayImagePrompt || imagePrompt || "",
        title: generatedTitle // Include title in expandedPrompts for frontend visibility
      }
    };

    // Log expanded prompts to console for verification
    console.log("🎨 [EXPANDED PROMPTS] Music:", payload.expandedPrompts.music);
    console.log("🎨 [EXPANDED PROMPTS] Image:", payload.expandedPrompts.image);
    console.log("🎨 [EXPANDED PROMPTS] Title:", payload.expandedPrompts.title);

    // Add diagnostic logging
    console.log("🎨 [EXPANDED PROMPTS SENT]", payload.expandedPrompts);

    // Start fallback polling mechanism in background (non-blocking)
    if (taskId) {
      startFallbackPolling(taskId);
    }

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