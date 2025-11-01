import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { CREDITS_PER_GENERATION } from '@/lib/config';
import { generateImage, verifyAndUpscaleTo2K } from '@/lib/kie';
import { buildImagePrompt } from '@/lib/enrichPrompt';
import { generateTrackTitle } from '@/lib/generateTrackTitle';

export const dynamic = "force-dynamic";

// Allow this endpoint to be public (no auth required)
export const runtime = "nodejs";

/**
 * Unified webhook/callback handler for Kie.ai asynchronous generation callbacks
 * Handles both audio (Suno) and image (Seedream) generation completions
 * Reduces need for polling and eliminates rate limiting issues
 */

export async function GET() {
  return NextResponse.json({ 
    message: 'Callback endpoint is active and ready to receive API callbacks',
    endpoint: '/api/callback',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 [CALLBACK] Received @', new Date().toISOString());

    const raw = await request.json();
    console.log('🛰️ [CALLBACK RAW]', JSON.stringify(raw));

    // --- normalize payload from various possible shapes ---
    const payload = raw?.data ?? raw;
    const taskId =
      payload?.task_id ??
      payload?.taskId ??
      raw?.task_id ??
      raw?.taskId;
    if (taskId) {
      console.log('[CALLBACK RECEIVED]', taskId, new Date().toISOString());
    }

    const status =
      payload?.status ??
      payload?.callbackType ??
      raw?.status;

    // Try to extract result fields from common shapes
    const candidateSongs =
      payload?.songs ??
      payload?.data ??
      payload?.result?.songs ??
      [];

    const topLevelAudio = payload?.audio_url ?? raw?.audio_url;
    const topLevelImage = payload?.image_url ?? raw?.image_url;
    
    // Check if this is an image-only callback (Seedream)
    const isImageOnly = topLevelImage && !topLevelAudio;
    const hasResultUrl = payload?.result_urls || payload?.info?.result_urls;

    // Prefer explicit audio/image on the top level; else look in songs[]
    const completed =
      (topLevelAudio ? { audio_url: topLevelAudio, image_url: topLevelImage, title: payload?.title, duration: payload?.duration, prompt: payload?.prompt } : null) ||
      (isImageOnly ? { image_url: topLevelImage, audio_url: null, title: payload?.title, duration: payload?.duration, prompt: payload?.prompt } : null) ||
      candidateSongs.find((s: any) => s?.audio_url) ||
      null;

    console.log('📌 taskId:', taskId, 'status:', status, 'completed?', !!completed);
    if (isImageOnly) {
      console.log('🖼️ [CALLBACK] Image-only callback detected (Seedream)');
      console.log('[IMAGE] Callback received for image generation');
    }

    if (!taskId) {
      console.error('❌ [CALLBACK] Missing task_id');
      return NextResponse.json({ ok: false, error: 'missing task_id' }, { status: 400 });
    }

    if (!supabaseServer) {
      console.error('❌ [CALLBACK] Supabase not initialized');
      return NextResponse.json({ ok: false, error: 'database unavailable' }, { status: 500 });
    }

    // Load the pending track with extended prompt
    const { data: pending, error: fetchErr } = await supabaseServer
      .from('tracks')
      .select('id, user_id, status, prompt, extended_prompt, extended_prompt_image, vibe')
      .eq('task_id', taskId)
      .maybeSingle();

    if (fetchErr) {
      console.error('❌ [CALLBACK] Track fetch error:', fetchErr);
      return NextResponse.json({ ok: false, error: 'track fetch failed' }, { status: 500 });
    }
    if (!pending) {
      console.error('❌ [CALLBACK] No track found for task_id:', taskId);
      return NextResponse.json({ ok: false, error: 'track not found' }, { status: 404 });
    }

    // If we already completed, be idempotent: do nothing, return ok
    if (pending.status === 'completed') {
      console.log('ℹ️ [CALLBACK] Track already completed. Ignoring duplicate.');
      return NextResponse.json({ ok: true, message: 'already completed' });
    }

    // Handle failure
    if (status === 'failed' && !completed) {
      const { error: updErr } = await supabaseServer
        .from('tracks')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('task_id', taskId);
      if (updErr) console.error('❌ [CALLBACK] fail->update error:', updErr);

      return NextResponse.json({ ok: false, message: 'generation failed' }, { status: 200 });
    }

    // If not failed and not completed yet, acknowledge but don't update
    if (!completed) {
      console.log('⏳ [CALLBACK] Not ready yet, no audio_url in payload.');
      
      // Schedule a retry after 20 seconds
      setTimeout(async () => {
        try {
          console.log("⏳ [CALLBACK RETRY] Audio not ready, retrying in 20s...");
          const retryRes = await fetch(`https://api.kie.ai/api/v1/generate/record-info?taskId=${taskId}`, {
            headers: { Authorization: `Bearer ${process.env.VIBEFORGE_API_KEY}` },
          });
          const retryData = await retryRes.json();

          if (retryData?.data?.response?.sunoData?.[0]?.audio_url) {
            console.log("✅ [CALLBACK RETRY SUCCESS] Audio ready, updating DB.");
            if (supabaseServer) {
              // Check if track already has image_url before overwriting
              const { data: existing } = await supabaseServer
                .from("tracks")
                .select("image_url")
                .eq("task_id", taskId)
                .maybeSingle();
              
              const updateData: any = {
                audio_url: retryData.data.response.sunoData[0].audio_url,
                status: "completed",
                updated_at: new Date().toISOString(),
              };
              
              // Only set image_url if track doesn't already have one
              if (!existing?.image_url && retryData.data.response.sunoData[0].image_url) {
                updateData.image_url = retryData.data.response.sunoData[0].image_url;
                console.log("📸 [CALLBACK RETRY] Setting Suno image_url (no existing image)");
              } else {
                console.log("🖼️ [CALLBACK RETRY] Preserving existing image_url");
              }
              
              await supabaseServer
                .from("tracks")
                .update(updateData)
                .eq("task_id", taskId);
              console.log("✅ [CALLBACK RETRY] Track completed successfully");
            }
          } else {
            console.warn("❌ [CALLBACK RETRY] Still no audio_url after 20s.");
          }
        } catch (e) {
          console.error("❌ [CALLBACK RETRY ERROR]", e);
        }
      }, 20000);
      
      return NextResponse.json({ ok: true, message: 'processing' }, { status: 200 });
    }

    // --- Resolve final image (verify/upscale/regenerate) BEFORE updating track ---
    const TARGET = { width: 2048, height: 1152 };
    let finalImageUrl: string | null = null;
    let finalResolution: string | null = null;

    const sourceImageUrl: string | null = (completed?.image_url as string) || null;
    
    // Helper function to attempt regeneration and verification
    const attemptImageRegeneration = async (prompt: string): Promise<{ url: string | null, resolution: string | null }> => {
      try {
        console.log('🎨 [CALLBACK] Regenerating 2K image');
        const gen = await generateImage(prompt);
        
        if (!gen.imageUrl) {
          console.warn('[IMAGE] ❌ Generation returned no URL');
          return { url: null, resolution: null };
        }
        
        const verified = await verifyAndUpscaleTo2K(gen.imageUrl, TARGET);
        if (verified.width >= TARGET.width && verified.height >= TARGET.height) {
          console.log(`[IMAGE] ✅ Verified and saved: ${verified.width}x${verified.height}`);
          return { url: verified.url, resolution: `${verified.width}x${verified.height}` };
        }
        
        console.warn(`[IMAGE] ❌ Regenerated image too small: ${verified.width}x${verified.height}`);
        return { url: null, resolution: null };
      } catch (e) {
        console.error('❌ [CALLBACK] Regeneration failed:', e);
        return { url: null, resolution: null };
      }
    };

    // Handle empty or undefined image URL
    if (!sourceImageUrl || typeof sourceImageUrl !== 'string' || sourceImageUrl.trim() === '') {
      console.warn('[🖼️] No image provided in callback');
      if (pending?.extended_prompt_image) {
        const result = await attemptImageRegeneration(pending.extended_prompt_image);
        finalImageUrl = result.url;
        finalResolution = result.resolution;
      }
    } 
    // Verify existing image URL
    else {
      try {
        const checked = await verifyAndUpscaleTo2K(sourceImageUrl, TARGET);
        
        if (checked.width >= TARGET.width && checked.height >= TARGET.height) {
          finalImageUrl = checked.url;
          finalResolution = `${checked.width}x${checked.height}`;
          console.log(`[IMAGE] ✅ Verified: ${finalResolution}`);
        } else if (pending?.extended_prompt_image) {
          console.warn(`[IMAGE] ⚠️ Too small (${checked.width}x${checked.height}), regenerating`);
          const result = await attemptImageRegeneration(pending.extended_prompt_image);
          finalImageUrl = result.url;
          finalResolution = result.resolution;
        } else {
          console.warn(`[IMAGE] ⚠️ Too small (${checked.width}x${checked.height}) and no prompt available`);
        }
      } catch (e) {
        console.error('❌ [CALLBACK] Verification failed:', e);
        // Attempt regeneration as fallback
        if (pending?.extended_prompt_image) {
          const result = await attemptImageRegeneration(pending.extended_prompt_image);
          finalImageUrl = result.url;
          finalResolution = result.resolution;
        }
      }
    }

    // --- Update track with results ---
    const safeTitle =
      completed.title ||
      generateTrackTitle(pending.prompt) ||
      `Soundswoop ${new Date().toISOString().slice(0, 10)}`;
    const safePrompt =
      completed.prompt || payload?.prompt || 'Generated Vibe';

    console.log("🎵 [TITLE AUTO] Generated unique title:", safeTitle);

    // Handle mood metadata - always set a default value
    const safeMood = pending?.vibe || 'Unknown Mood';

    const updateFields: any = {
      title: safeTitle,
      prompt: safePrompt,
      vibe: safeMood,
      audio_url: completed.audio_url,
      image_url: finalImageUrl ?? null,
      resolution: finalResolution ?? null,
      duration: completed.duration ?? null,
      status: 'completed',
      updated_at: new Date().toISOString(),
    };

    const { error: updateErr } = await supabaseServer
      .from('tracks')
      .update(updateFields)
      .eq('task_id', taskId);

    if (updateErr) {
      console.error('❌ [CALLBACK] track update error:', updateErr);
      return NextResponse.json({ ok: false, error: 'track update failed' }, { status: 500 });
    }

    console.log(`✅ [CALLBACK] Track updated for task_id: ${taskId}`);

    // --- Deduct credits atomically via RPC (idempotent with status check above) ---
    const { data: deducted, error: rpcErr } = await supabaseServer.rpc(
      'deduct_credits',
      { p_user_id: pending.user_id, p_amount: CREDITS_PER_GENERATION }
    );

    if (rpcErr) {
      console.error('⚠️ [CALLBACK] Credit RPC error:', rpcErr);
    } else if (!deducted) {
      console.warn('⚠️ [CALLBACK] Not enough credits to deduct (user may be at 0).');
    } else {
      console.log('💎 [CALLBACK] Credits deducted via RPC.');
    }

    return NextResponse.json({ ok: true, taskId });
  } catch (e: any) {
    console.error('🔥 [CALLBACK] Exception:', e?.message || e);
    return NextResponse.json({ ok: false, error: 'callback exception' }, { status: 500 });
  }
}

