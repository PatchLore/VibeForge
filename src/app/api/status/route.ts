import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { checkMusicStatus } from '@/lib/kie';
import { CREDITS_PER_GENERATION } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');

  if (!taskId) {
    return NextResponse.json(
      { status: 'error', error: 'Missing taskId' },
      { status: 400 }
    );
  }

  if (!supabaseServer) {
    console.error('❌ [STATUS] Supabase not initialized');
    return NextResponse.json(
      { status: 'error', error: 'database_unavailable' },
      { status: 500 }
    );
  }

  // 1) Look up track in DB by task_id
  const { data: track, error: trackErr } = await supabaseServer
    .from('tracks')
    .select('id, user_id, status, audio_url, image_url, created_at, duration, title, prompt')
    .eq('task_id', taskId)
    .maybeSingle();

  if (trackErr) {
    console.error('❌ [STATUS] DB error:', trackErr);
    return NextResponse.json(
      { status: 'error', error: 'db_error' },
      { status: 500 }
    );
  }

  if (!track) {
    console.warn('⚠️ [STATUS] No track found for taskId:', taskId);
    return NextResponse.json(
      { status: 'not_found', taskId },
      { status: 404 }
    );
  }

  // 2) If already completed, return immediately
  if (track.status === 'completed' && track.audio_url) {
    console.log('✅ [STATUS] Track already completed for taskId:', taskId);
    return NextResponse.json(
      { status: 'completed', taskId, track },
      { status: 200 }
    );
  }

  // 3) If still processing, try polling Kie.ai once via checkMusicStatus()
  console.log('⏳ [STATUS] Still processing locally; polling provider for taskId:', taskId);

  let remoteState: 'pending' | 'completed' | 'failed' = 'pending';
  let remoteAudioUrl: string | null = null;
  let remoteDuration: number | null = null;
  let remoteTitle: string | null = null;
  let remotePrompt: string | null = null;

  try {
    const result = await checkMusicStatus(taskId);
    // Expectation: checkMusicStatus returns { state, audioUrl?, duration?, title?, prompt? }
    remoteState = result?.state ?? 'pending';
    remoteAudioUrl = result?.audioUrl ?? null;
    remoteDuration = result?.duration ?? null;
    remoteTitle = result?.title ?? null;
    remotePrompt = result?.prompt ?? null;

    console.log('[STATUS] Provider state:', remoteState, 'taskId:', taskId);
  } catch (e: any) {
    console.error('❌ [STATUS] checkMusicStatus error:', e?.message || e);
  }

  // 4) If provider reports completed AND has audio, update track and mark completed
  if (remoteState === 'completed' && remoteAudioUrl) {
    console.log('✅ [STATUS] Completing track via polling for taskId:', taskId);

    const safeTitle = remoteTitle || track.title;
    const safePrompt = remotePrompt || track.prompt;

    const { error: updateErr } = await supabaseServer
      .from('tracks')
      .update({
        audio_url: remoteAudioUrl,
        duration: remoteDuration ?? track.duration,
        title: safeTitle,
        prompt: safePrompt,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', track.id);

    if (updateErr) {
      console.error('❌ [STATUS] Failed to update track from polling:', updateErr);
    } else {
      console.log('✅ [STATUS] Track updated & completed via polling for taskId:', taskId);
    }

    // Deduct credits if not already deducted (safe to try once here)
    try {
      const { data: deducted, error: rpcErr } = await supabaseServer.rpc(
        'deduct_credits',
        { p_user_id: track.user_id, p_amount: CREDITS_PER_GENERATION }
      );
      if (rpcErr) {
        console.error('⚠️ [STATUS] Credit RPC error on polling:', rpcErr);
      } else if (!deducted) {
        console.warn('⚠️ [STATUS] Not enough credits to deduct on polling.');
      } else {
        console.log('💎 [STATUS] Credits deducted via RPC on polling.');
      }
    } catch (e) {
      console.error('🔥 [STATUS] Exception while deducting credits on polling:', e);
    }

    // Re-fetch updated track for response
    const { data: finalTrack } = await supabaseServer
      .from('tracks')
      .select('id, user_id, status, audio_url, image_url, created_at, duration, title, prompt')
      .eq('id', track.id)
      .maybeSingle();

    return NextResponse.json(
      { status: 'completed', taskId, track: finalTrack || track },
      { status: 200 }
    );
  }

  // 5) If provider says failed or a timeout window has passed, mark as failed
  const createdAt = track.created_at ? new Date(track.created_at).getTime() : Date.now();
  const ageMs = Date.now() - createdAt;

  if (remoteState === 'failed' || ageMs > MAX_AGE_MS) {
    console.warn('⚠️ [STATUS] Marking track as failed (state:', remoteState, ', ageMs:', ageMs, ')');

    const { error: failErr } = await supabaseServer
      .from('tracks')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', track.id);

    if (failErr) {
      console.error('❌ [STATUS] Failed to mark track as failed:', failErr);
    }

    return NextResponse.json(
      { status: 'failed', taskId },
      { status: 200 }
    );
  }

  // 6) Still pending
  return NextResponse.json(
    { status: 'processing', taskId },
    { status: 200 }
  );
}
