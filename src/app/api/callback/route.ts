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

    // --- REQUIRED RESET: Only process audio from Kie.ai ---
    // CRITICAL FIX: Check primaryItem FIRST (Kie.ai array format)
    const audioUrl =
      primaryItem?.audio_url ??
      primaryItem?.stream_audio_url ??
      primaryItem?.source_audio_url ??
      payload?.audio_url ??
      data?.audio_url ??
      raw?.audio_url ??
      payload?.result?.audios?.[0]?.url ??
      data?.result?.audios?.[0]?.url;

    const imageUrl = null; // 🔥 NEVER use Kie.ai images again

    // Extract metadata (prefer primaryItem for Kie.ai array format)
    const duration =
      primaryItem?.duration ??
      payload?.duration ??
      data?.duration ??
      raw?.duration;

    const title =
      primaryItem?.title ??
      payload?.title ??
      data?.title ??
      raw?.title;

    const prompt =
      primaryItem?.prompt ??
      primaryItem?.tags ??
      payload?.prompt ??
      data?.prompt ??
      raw?.prompt;

    // Log what we received (audio only)
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

    // Extract task IDs for matching
    // Use taskId (already extracted from multiple locations including primaryItem)
    const outerTaskId = taskId; // Use the normalized taskId we already extracted
    
    // NEW: extract inner audio IDs (Kie array callback)
    const innerTrackIds = Array.isArray(payload?.data)
      ? payload.data
          .map((item: any) => item?.id)
          .filter(Boolean)
      : [];

    console.log("🧩 [DEBUG] Using normalized taskId for lookup:", outerTaskId);
    console.log("🧩 [DEBUG] Inner trackIds from payload.data:", innerTrackIds);
    console.log("🧩 [DEBUG] PrimaryItem has audio_url:", !!primaryItem?.audio_url);
    console.log("🧩 [DEBUG] PrimaryItem has stream_audio_url:", !!primaryItem?.stream_audio_url);

    // TRY 1: find track by normalized taskId (most reliable)
    let trackResponse = await supabaseServer
      .from("tracks")
      .select("*")
      .eq("task_id", outerTaskId)
      .maybeSingle();

    console.log("🔍 [CALLBACK] TRY 1 - Lookup by taskId:", outerTaskId, "Found:", !!trackResponse.data);

    // TRY 2: if not found, try inner ID
    if (!trackResponse.data && innerTrackIds.length > 0) {
      console.log("🔍 [CALLBACK] TRY 2 - Searching by inner IDs:", innerTrackIds);
      trackResponse = await supabaseServer
        .from("tracks")
        .select("*")
        .in("task_id", innerTrackIds)
        .maybeSingle();
      console.log("🔍 [CALLBACK] TRY 2 - Found:", !!trackResponse.data);
    }

    if (!trackResponse.data) {
      console.error("❌ [CALLBACK] No track found for ANY id. Ignoring callback.");
      return NextResponse.json({ ok: false, message: "no matching track" });
    }

    const track = trackResponse.data;

    const matchedBy = track.task_id === outerTaskId ? 'outerTaskId' : 
                     (innerTrackIds.includes(track.task_id) ? 'innerTrackId' : 'unknown');

    console.log('🧩 [DEBUG] Incoming taskId:', taskId);
    console.log('🧩 [DEBUG] Track matched:', {
      id: track.id,
      user_id: track.user_id,
      task_id: track.task_id,
      has_image_url: !!track.image_url,
      has_audio_url: !!track.audio_url,
      status: track.status,
      matchedBy: matchedBy
    });
    console.log('🧩 [DEBUG] Audio URL extracted:', audioUrl ? "yes" : "no", audioUrl ? audioUrl.substring(0, 100) : "");
    
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

    // --- REQUIRED RESET: Never update image_url from callback ---
    // Only update audio_url when available
    if (audioUrl && !track.audio_url) {
      console.log('🎵 [CALLBACK] Audio URL received, updating database...');
      console.log('🎵 [CALLBACK] Audio URL length:', audioUrl.length);
      console.log('🎵 [CALLBACK] Duration:', duration);
      
      const { data: updateData, error: updateError } = await supabaseServer
        .from('tracks')
        .update({
          audio_url: audioUrl,
          duration: duration ?? null,
          updated_at: new Date().toISOString()
        })
        .eq('id', track.id)
        .select();
      
      if (updateError) {
        console.error('❌ [CALLBACK] Failed to update audio_url:', updateError);
      } else {
        console.log('✅ [CALLBACK] Audio saved to database, updated row:', updateData?.[0]?.id);
      }
    } else if (audioUrl && track.audio_url) {
      console.log('ℹ️ [CALLBACK] Audio URL already exists in database, skipping update');
    } else if (!audioUrl) {
      console.log('⏳ [CALLBACK] No audio URL in callback payload yet');
    }

    // Ensure track completes when audio arrives
    if (audioUrl && track.status !== 'completed') {
      console.log('✅ [CALLBACK] Marking track as completed (audio received)');
      const { data: completeData, error: completeError } = await supabaseServer
        .from('tracks')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', track.id)
        .select();
      
      if (completeError) {
        console.error('❌ [CALLBACK] Failed to mark as completed:', completeError);
      } else {
        console.log('✅ [CALLBACK] Track marked as completed, updated row:', completeData?.[0]?.id);
      }
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

    // --- Final Check: Deduct credits when audio exists ---
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
    } catch (err) {
      console.error('🔥 [DEBUG ERROR] Final select exception:', err);
    }

    if (!finalTrack) {
      console.error('❌ [CALLBACK] Failed to fetch final track state');
      return NextResponse.json({ ok: false, error: 'track fetch failed' }, { status: 500 });
    }

    // Deduct credits when audio is present and track is completed
    if (finalTrack.audio_url && finalTrack.status === 'completed') {
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
    }

    return NextResponse.json({ ok: true, taskId });
  } catch (e: any) {
    console.error('🔥 [CALLBACK] Exception:', e?.message || e);
    return NextResponse.json({ ok: false, error: 'callback exception' }, { status: 500 });
  }
}

