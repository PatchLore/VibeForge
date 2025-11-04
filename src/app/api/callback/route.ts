import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { CREDITS_PER_GENERATION } from '@/lib/config';
import { generateImage } from '@/lib/kie';
import { buildImagePrompt } from '@/lib/enrichPrompt';
import { generateTrackTitle } from '@/lib/generateTrackTitle';

export const dynamic = "force-dynamic";

// Allow this endpoint to be public (no auth required)
export const runtime = "nodejs";

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
    let topLevelImage = payload?.image_url ?? raw?.image_url;
    
    // Extract image URL from resultJson.resultUrls if available (new API structure)
    if (!topLevelImage && payload?.resultJson) {
      try {
        const resultJson = typeof payload.resultJson === 'string' 
          ? JSON.parse(payload.resultJson) 
          : payload.resultJson;
        if (resultJson?.resultUrls && Array.isArray(resultJson.resultUrls) && resultJson.resultUrls.length > 0) {
          topLevelImage = resultJson.resultUrls[0];
          console.log('🖼️ [CALLBACK] Extracted image URL from resultJson.resultUrls:', topLevelImage);
        }
      } catch (e) {
        console.warn('⚠️ [CALLBACK] Failed to parse resultJson:', e);
      }
    }

    // Prefer explicit audio/image on the top level; else look in songs[]
    const completed =
      (topLevelAudio ? { audio_url: topLevelAudio, image_url: topLevelImage, title: payload?.title, duration: payload?.duration, prompt: payload?.prompt } : null) ||
      candidateSongs.find((s: any) => s?.audio_url) ||
      null;

    console.log('📌 taskId:', taskId, 'status:', status, 'completed?', !!completed);

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
      .select('id, user_id, status, prompt, extended_prompt, image_url')
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
      return NextResponse.json({ ok: true, message: 'processing' }, { status: 200 });
    }

    // --- Update track with results ---
    const safeTitle =
      completed.title ||
      generateTrackTitle(pending.prompt) ||
      `Soundswoop ${new Date().toISOString().slice(0, 10)}`;
    const safePrompt =
      completed.prompt || payload?.prompt || 'Generated Vibe';

    console.log("🎵 [TITLE AUTO] Generated unique title:", safeTitle);

    const updateFields: any = {
      title: safeTitle,
      prompt: safePrompt,
      audio_url: completed.audio_url,
      image_url: completed.image_url ?? pending.image_url, // ✅ preserve the image from initial insert
      resolution: "2048x1152", // Default to 2K resolution
      duration: completed.duration ?? null,
      status: 'completed',
      updated_at: new Date().toISOString(),
    };

    console.log('💾 [CALLBACK] Updating track:', updateFields);

    const { error: updateErr } = await supabaseServer
      .from('tracks')
      .update(updateFields)
      .eq('task_id', taskId);

    if (updateErr) {
      console.error('❌ [CALLBACK] track update error:', updateErr);
      return NextResponse.json({ ok: false, error: 'track update failed' }, { status: 500 });
    }

    console.log('✅ [CALLBACK] Track updated →', taskId);

    // ✅ Verify image_url was not overwritten or left empty
    const { data: verify } = await supabaseServer
      .from('tracks')
      .select('image_url, prompt')
      .eq('task_id', taskId)
      .maybeSingle();

    if (!verify?.image_url && verify?.prompt) {
      console.warn('⚠️ [CALLBACK] image_url missing after update, regenerating fallback image...');
      try {
        const fallbackPrompt = buildImagePrompt(verify.prompt);
        const regenerated = await generateImage(fallbackPrompt);
        if (regenerated) {
          await supabaseServer
            .from('tracks')
            .update({ image_url: regenerated, resolution: "2048x1152" })
            .eq('task_id', taskId);
          console.log('✅ [CALLBACK] Fallback image regenerated and saved.');
        }
      } catch (err) {
        console.error('❌ [CALLBACK] Failed to regenerate fallback image:', err);
      }
    }

    // --- Generate image using enriched prompt if no image was provided ---
    let generatedImageUrl = completed.image_url;
    if (!generatedImageUrl && pending.prompt) {
      try {
        console.log('🎨 [IMAGE CALLBACK] Generating image for track:', taskId);
        
        // Use literal image prompt based on user's theme
        const imagePrompt = buildImagePrompt(pending.prompt);
        
        // Add explicit guards
        if (!imagePrompt || imagePrompt.length < 12) {
          console.error("❌ [IMAGE PROMPT MISSING]", { prompt: pending.prompt, imagePrompt });
        }
        
        console.log('🎨 [IMAGE CALLBACK] Model: bytedance/seedream-v4-text-to-image');
        console.log('🎨 [IMAGE CALLBACK] Resolution: 2048x1152 (2K 16:9)');
        console.log('🎨 [IMAGE CALLBACK] Literal image prompt:', imagePrompt);
        console.log('🔍 [DEBUG] Image prompt length:', imagePrompt.length);
        console.log("[IMAGE PROMPT SENT]", imagePrompt);
        
        // Generate image (returns taskId with new API structure)
        const imageTaskId = await generateImage(imagePrompt);
        
        if (imageTaskId) {
          console.log('🎨 [IMAGE CALLBACK] Image generation task created:', imageTaskId);
          console.log('🎨 [IMAGE CALLBACK] Image will be delivered via callback');
          console.log('🎨 [IMAGE CALLBACK] Expected resolution: 2K with landscape_16_9 = 2048x1152px');
          
          // Store image taskId - the actual URL will come via callback in resultJson.resultUrls[0]
          // For now, we'll wait for the image callback to update the track
          // The image callback will extract the URL from resultJson.resultUrls[0]
        }
      } catch (imageErr) {
        console.error('❌ [CALLBACK] Image generation failed:', imageErr);
        // Continue without image - don't fail the whole callback
      }
    }

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

