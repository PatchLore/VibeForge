import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { CREDITS_PER_GENERATION } from '@/lib/config';
import { getImageDimensions, getImageDimensionsFromBuffer } from '@/lib/kie';
import { generateTrackTitle } from '@/lib/generateTrackTitle';

export const dynamic = "force-dynamic";

// Allow this endpoint to be public (no auth required)
export const runtime = "nodejs";

// Normalizer for Kie.ai callbacks
type NormalizedCallback = {
  taskId: string | null;
  status: string | null; // 'text' | 'complete' | other
  primaryItem: any | null;
  isArray: boolean;
};

function normalizeKieCallback(raw: any): NormalizedCallback {
  const data = raw?.data ?? raw;
  const inner = data?.data ?? data;

  const taskId =
    data?.task_id ??
    raw?.task_id ??
    null;

  const isArray = Array.isArray(inner);
  const primaryItem = isArray ? inner[0] : inner ?? null;

  // Kie.ai uses callbackType for phase: "text" or "complete"
  const status =
    data?.callbackType ??
    raw?.callbackType ??
    null;

  return {
    taskId,
    status,
    primaryItem,
    isArray,
  };
}

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

    // Normalize callback using helper
    const normalized = normalizeKieCallback(raw);
    const { taskId, status, primaryItem, isArray } = normalized;

    console.log('📌 Normalized callback:', {
      taskId,
      status,
      hasPrimaryItem: !!primaryItem,
      isArray,
    });

    if (!taskId) {
      console.error('❌ [CALLBACK] Missing task_id');
      return NextResponse.json({ ok: false, error: 'missing task_id' }, { status: 400 });
    }

    if (!supabaseServer) {
      console.error('❌ [CALLBACK] Supabase not initialized');
      return NextResponse.json({ ok: false, error: 'database unavailable' }, { status: 500 });
    }

    // Handle text-phase callback
    if (status === 'text') {
      console.log('📝 [CALLBACK] Text-phase callback received for taskId:', taskId);

      // Try to find track by task_id only (no more recovery insert)
      console.log("[CALLBACK] Searching DB for taskId:", taskId);
      const { data: track, error: trackErr } = await supabaseServer
        .from('tracks')
        .select('id, user_id, title, prompt, status')
        .eq('task_id', taskId)
        .maybeSingle();

      if (trackErr) {
        console.error('❌ [CALLBACK] DB error on text-phase lookup:', trackErr);
        return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 });
      }

      if (!track) {
        console.warn('⚠️ [CALLBACK] Text-phase: no track found for taskId:', taskId);
        console.warn("[CALLBACK] No track found with taskId:", taskId);
        console.warn("[CALLBACK] This means taskId was NOT saved correctly during /api/music");
        return NextResponse.json({ ok: true, message: 'text callback ignored (no track yet)' });
      }

      console.log("[CALLBACK] FOUND TRACK:", track.id);

      // Extract metadata from primaryItem
      const textTitle = primaryItem?.title || null;
      const textPrompt = primaryItem?.prompt || null;
      const tags = primaryItem?.tags || null;

      const safeTitle = textTitle || track.title || generateTrackTitle(track.prompt || textPrompt || 'Generated Vibe');
      const safePrompt = textPrompt || track.prompt;

      const { error: updateErr } = await supabaseServer
        .from('tracks')
        .update({
          title: safeTitle,
          prompt: safePrompt,
          // Optionally store tags in extended_prompt if you want:
          extended_prompt: tags
            ? (track as any).extended_prompt
              ? `${(track as any).extended_prompt}\n[tags]: ${tags}`
              : `[tags]: ${tags}`
            : (track as any).extended_prompt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', track.id);

      if (updateErr) {
        console.error('❌ [CALLBACK] Failed to update track on text-phase:', updateErr);
      } else {
        console.log('✅ [CALLBACK] Text-phase metadata saved for track:', track.id);
      }

      // IMPORTANT: do NOT mark as completed here
      return NextResponse.json({ ok: true, phase: 'text', taskId });
    }

    // Handle complete-phase callback (with audio)
    if (status === 'complete') {
      console.log('🎵 [CALLBACK] Complete-phase callback received for taskId:', taskId);

      // Extract audio info from primary item first
      const audioUrl: string | null =
        primaryItem?.audio_url ||
        primaryItem?.stream_audio_url ||
        null;

      const duration = primaryItem?.duration ?? null;
      const title = primaryItem?.title ?? null;
      const prompt = primaryItem?.prompt ?? null;

      if (!audioUrl) {
        console.warn('⚠️ [CALLBACK] Complete-phase but no audio_url present for taskId:', taskId);
        return NextResponse.json({ ok: false, error: 'no_audio_in_complete' }, { status: 200 });
      }

      // Look up track by task_id
      console.log("[CALLBACK] Searching DB for taskId:", taskId);
      const { data: track, error: trackErr } = await supabaseServer
        .from('tracks')
        .select('id, user_id, status, prompt, title, audio_url')
        .eq('task_id', taskId)
        .maybeSingle();

      if (trackErr) {
        console.error('❌ [CALLBACK] DB error on complete-phase lookup:', trackErr);
        return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 });
      }

      if (!track) {
        console.error('❌ [CALLBACK] Complete-phase: no track found for taskId:', taskId);
        console.warn("[CALLBACK] No track found with taskId:", taskId);
        console.warn("[CALLBACK] This means taskId was NOT saved correctly during /api/music");
        return NextResponse.json({ ok: false, error: 'track_not_found' }, { status: 404 });
      }

      console.log("[CALLBACK] FOUND TRACK:", track.id);

      // If already completed, be idempotent
      if (track.status === 'completed' && track.audio_url) {
        console.log('ℹ️ [CALLBACK] Track already completed; ignoring duplicate complete callback for', taskId);
        return NextResponse.json({ ok: true, message: 'already_completed' });
      }

      const safeTitle = title || track.title || generateTrackTitle(track.prompt || prompt || 'Generated Vibe');
      const safePrompt = prompt || track.prompt;

      // Update track with audio URL and mark completed
      const { error: updateErr } = await supabaseServer
        .from('tracks')
        .update({
          audio_url: audioUrl,
          duration,
          title: safeTitle,
          prompt: safePrompt,
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', track.id);

      if (updateErr) {
        console.error('❌ [CALLBACK] Failed to update track on complete-phase:', updateErr);
      } else {
        console.log('✅ [CALLBACK] Track completed via callback for taskId:', taskId);
      }

      // Deduct credits once on complete
      try {
        const { data: deducted, error: rpcErr } = await supabaseServer.rpc(
          'deduct_credits',
          { p_user_id: track.user_id, p_amount: CREDITS_PER_GENERATION }
        );
        if (rpcErr) {
          console.error('⚠️ [CALLBACK] Credit RPC error on complete-phase:', rpcErr);
        } else if (!deducted) {
          console.warn('⚠️ [CALLBACK] Not enough credits to deduct on complete-phase.');
        } else {
          console.log('💎 [CALLBACK] Credits deducted via RPC on complete-phase.');
        }
      } catch (e) {
        console.error('🔥 [CALLBACK] Exception while deducting credits:', e);
      }

      return NextResponse.json({ ok: true, phase: 'complete', taskId });
    }

    // Unknown/unsupported callbackType
    console.warn('⚠️ [CALLBACK] Unknown or unsupported callbackType:', status, 'for taskId:', taskId);
    return NextResponse.json({ ok: true, message: 'ignored_unknown_phase' });
  } catch (e: any) {
    console.error('🔥 [CALLBACK] Exception:', e?.message || e);
    return NextResponse.json({ ok: false, error: 'callback exception' }, { status: 500 });
  }
}

