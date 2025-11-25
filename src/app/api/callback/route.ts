import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { CREDITS_PER_GENERATION } from '@/lib/config';
import { getImageDimensions, getImageDimensionsFromBuffer } from '@/lib/kie';
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
    console.log('🛰️ [CALLBACK RAW]', JSON.stringify(raw, null, 2));

    // --- Normalize payload from various possible shapes ---
    // "data" is the envelope (e.g. { callbackType, data: [...], task_id })
    const data = raw?.data ?? raw;

    // "payload" was previously used inconsistently; here we treat it as the inner data field
    // BUT if it's an array, that means it's the list of result items (Kie.ai style)
    const payload = data?.data ?? data;

    // If payload is an array (Kie.ai: data.data = [ {audio_url, image_url, ...}, ... ]),
    // we treat the first item as the "primary" item for audio/image/title/etc.
    const itemsArray = Array.isArray(payload) ? payload : (Array.isArray(data?.data) ? data.data : null);
    const primaryItem = itemsArray?.[0] ?? null;

    // Extract taskId from multiple possible locations (envelope-first)
    const taskId =
      data?.task_id ??
      data?.taskId ??
      raw?.task_id ??
      raw?.taskId ??
      primaryItem?.task_id ??
      primaryItem?.taskId;

    // Status / callback type: Kie.ai uses callbackType: "complete"
    const status =
      data?.status ??
      raw?.status ??
      (typeof data?.callbackType === 'string' ? data.callbackType : undefined) ??
      (typeof raw?.callbackType === 'string' ? raw.callbackType : undefined);

    // Basic debug log
    console.log('📌 Normalized callback:', {
      taskId,
      status,
      hasPrimaryItem: !!primaryItem,
      isArray: Array.isArray(payload),
    });

    // 🔒 Never accept image URLs from Kie.ai
    // All image generation is done BEFORE callback via /api/music -> generateImageDirect()
    const allowImageUpdate = false;

    // --- Image URL extraction REMOVED ---
    // All image generation happens synchronously in /api/music before callback
    // Callback should NEVER update image_url to prevent overwriting HD base64 images
    // const imageUrl = ... (REMOVED)

    // --- Parse audio URL from multiple possible locations ---
    // Priority 1: Kie.ai style: data.data[0].audio_url (primaryItem)
    const audioUrl =
      primaryItem?.audio_url ||
      primaryItem?.stream_audio_url ||
      primaryItem?.source_audio_url ||
      (data?.result?.audios?.[0]?.url ||
        data?.output?.audio_url ||
        payload?.result?.audios?.[0]?.url ||
        payload?.output?.audio_url) ||
      (payload?.audio_url ??
        data?.audio_url ??
        raw?.audio_url);

    // Extract other metadata (prefer primaryItem, then envelope)
    const title =
      primaryItem?.title ??
      payload?.title ??
      data?.title ??
      raw?.title;

    const duration =
      primaryItem?.duration ??
      payload?.duration ??
      data?.duration ??
      raw?.duration;

    const prompt =
      primaryItem?.prompt ??
      payload?.prompt ??
      data?.prompt ??
      raw?.prompt;

    // Log what we received (audio only - image is never processed from callback)
    const hasAudio = !!audioUrl;
    
    if (hasAudio) {
      console.log('🎵 [CALLBACK] Received audio payload');
    } else {
      console.log('⏳ [CALLBACK] Received payload: no audio yet');
    }

    console.log('📌 taskId:', taskId, 'status:', status, 'hasAudio:', hasAudio);

    if (!taskId) {
      console.error('❌ [CALLBACK] Missing task_id');
      return NextResponse.json({ ok: false, error: 'missing task_id' }, { status: 400 });
    }

    if (!supabaseServer) {
      console.error('❌ [CALLBACK] Supabase not initialized');
      return NextResponse.json({ ok: false, error: 'database unavailable' }, { status: 500 });
    }

    // Load the pending track - check both task_id and image_task_id
    let track = null;
    
    // First, try to find by task_id (for music callbacks)
    const { data: trackByTaskId } = await supabaseServer
      .from('tracks')
      .select('id, user_id, status, prompt, extended_prompt, image_url, audio_url, task_id')
      .eq('task_id', taskId)
      .maybeSingle();
    
    if (trackByTaskId) {
      track = trackByTaskId;
    } else {
      // If not found, might be an image callback - try to find by image_task_id in extended_prompt
      const { data: trackByImageTask } = await supabaseServer
        .from('tracks')
        .select('id, user_id, status, prompt, extended_prompt, image_url, audio_url, task_id')
        .like('extended_prompt', `%image_task_id: ${taskId}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (trackByImageTask) {
        track = trackByImageTask;
        console.log('🖼️ [CALLBACK] Found track by image taskId:', taskId);
      }
    }

    if (!track) {
      console.error('❌ [DEBUG] No track found in any lookup for taskId:', taskId);

      // Avoid inserting invalid UUID like "system_recover" into user_id column.
      // For now, just log and return ok:true so the callback doesn't keep retrying.
      // If you want to persist orphaned callbacks, you can:
      // - make user_id nullable in the DB
      // - or add a dedicated "system" UUID.
      try {
        const { error: insertErr } = await supabaseServer
          .from('tracks')
          .insert({
            user_id: null,
            task_id: taskId,
            status: 'callback_inserted',
            image_url: null, // Never set image_url from callback
            resolution: null,
            created_at: new Date().toISOString(),
          });

        if (insertErr) {
          console.error('🔥 [DEBUG ERROR] Recovery insert error:', insertErr);
        } else {
          console.log('🧩 [DEBUG] Recovery record inserted with null user_id');
        }
      } catch (e) {
        console.error('🔥 [DEBUG ERROR] Recovery insert exception:', e);
      }

      return NextResponse.json({ ok: true, message: 'callback processed with recovery insert' });
    }

    console.log('🧩 [DEBUG] Incoming taskId:', taskId);
    console.log('🧩 [DEBUG] Track matched:', {
      id: track.id,
      user_id: track.user_id,
      task_id: track.task_id,
      has_image_url: !!track.image_url,
      status: track.status,
      matchedBy: track.task_id === taskId ? 'task_id' : 'extended_prompt:image_task_id'
    });
    
    // If already completed, be idempotent
    if (track.status === 'completed') {
      console.log('ℹ️ [CALLBACK] Track already completed. Ignoring duplicate.');
      return NextResponse.json({ ok: true, message: 'already completed' });
    }

    // Handle failure
    if (status === 'failed') {
      const { error: updErr } = await supabaseServer
        .from('tracks')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('task_id', track.task_id);
      if (updErr) console.error('❌ [CALLBACK] fail->update error:', updErr);
      return NextResponse.json({ ok: false, message: 'generation failed' }, { status: 200 });
    }

    // --- Image URL handling REMOVED ---
    // Callback NEVER updates image_url
    // All images are generated synchronously in /api/music before callback
    // This prevents Kie.ai thumbnails from overwriting HD base64 images
    if (!allowImageUpdate) {
      console.log('🔒 [CALLBACK] Image updates disabled - image_url will not be modified');
    }

    // --- Handle Audio Callback Separately ---
    if (audioUrl && !track.audio_url) {
      console.log('🎵 [CALLBACK] Audio URL received.');
      
      await supabaseServer
        .from('tracks')
        .update({
          audio_url: audioUrl,
          duration: duration ?? null,
          updated_at: new Date().toISOString()
        })
        .eq('id', track.id);
      
      console.log('✅ [CALLBACK] Audio saved to database');
    }

    // Update title and prompt if provided
    if (title || prompt) {
      const safeTitle = title || generateTrackTitle(track.prompt) || `Soundswoop ${new Date().toISOString().slice(0, 10)}`;
      const safePrompt = prompt || track.prompt || 'Generated Vibe';
      
      await supabaseServer
        .from('tracks')
        .update({
          title: safeTitle,
          prompt: safePrompt,
          updated_at: new Date().toISOString()
        })
        .eq('id', track.id);
      
      console.log("🎵 [TITLE AUTO] Generated unique title:", safeTitle);
    }

    // --- Final Check: Mark complete and deduct credits when audio exists ---
    // Image is NOT required for completion (image generation happens before callback)
    let finalTrack: { audio_url: string | null; user_id: string | null; status: string | null } | null = null;
    try {
      const finalSel = await supabaseServer
        .from('tracks')
        .select('audio_url, user_id, status')
        .eq('id', track.id)
        .single();
      if (finalSel.error) {
        console.error('🔥 [DEBUG ERROR] Final select failed:', finalSel.error);
      }
      finalTrack = finalSel.data as any;
      console.log('🔍 [DEBUG] Final select state:', finalSel);
    } catch (err) {
      console.error('🔥 [DEBUG ERROR] Final select exception:', err);
    }

    if (!finalTrack) {
      console.error('❌ [CALLBACK] Failed to fetch final track state');
      return NextResponse.json({ ok: false, error: 'track fetch failed' }, { status: 500 });
    }

    // Mark as completed if audio exists (image_url is set by /api/music, not callback)
    if (finalTrack.audio_url && finalTrack.status !== 'completed') {
      console.log('✅ [CALLBACK] Audio present, marking as completed');
      
      try {
        console.log('🔍 [DEBUG] Marking completed for id:', track.id);
        const doneRes = await supabaseServer
          .from('tracks')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', track.id)
          .select();
        console.log('🔍 [DEBUG] Completed update result:', doneRes);
      } catch (err) {
        console.error('🔥 [DEBUG ERROR] Completed update failed:', err);
      }

      // Deduct credits atomically via RPC
      const { data: deducted, error: rpcErr } = await supabaseServer.rpc(
        'deduct_credits',
        { p_user_id: finalTrack.user_id, p_amount: CREDITS_PER_GENERATION }
      );

      if (rpcErr) {
        console.error('⚠️ [CALLBACK] Credit RPC error:', rpcErr);
      } else if (!deducted) {
        console.warn('⚠️ [CALLBACK] Not enough credits to deduct (user may be at 0).');
      } else {
        console.log('💎 [CALLBACK] Credits deducted via RPC.');
      }
    } else {
      console.log('⏳ [CALLBACK] Waiting for audio. Current state:', {
        hasAudio: !!finalTrack.audio_url,
        status: finalTrack.status
      });
    }

    // 🧩 Final debug summary
    console.log('🧩 [DEBUG SUMMARY]', {
      taskId,
      hasAudio: !!finalTrack?.audio_url,
      status: finalTrack?.status,
    });

    return NextResponse.json({ ok: true, taskId });
  } catch (e: any) {
    console.error('🔥 [CALLBACK] Exception:', e?.message || e);
    return NextResponse.json({ ok: false, error: 'callback exception' }, { status: 500 });
  }
}

