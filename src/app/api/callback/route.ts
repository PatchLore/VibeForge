import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { CREDITS_PER_GENERATION } from '@/lib/config';
import { generateImage, getImageDimensions, getImageDimensionsFromBuffer } from '@/lib/kie';
import { buildImagePrompt } from '@/lib/enrichPrompt';
import { generateTrackTitle } from '@/lib/generateTrackTitle';

export const dynamic = "force-dynamic";

// Allow this endpoint to be public (no auth required)
export const runtime = "nodejs";

// Helper function to retry image generation with different resolution
async function retryWithResolution(
  resolution: "4K",
  taskId: string,
  userId: string,
  prompt: string,
  extendedPrompt: string | null
): Promise<string | null> {
  try {
    const imagePrompt = buildImagePrompt(prompt);
    const retryTaskId = await generateImage(imagePrompt, "", resolution);
    
    if (retryTaskId) {
      if (!supabaseServer) {
        console.error('❌ [CALLBACK] Supabase not initialized during retryWithResolution');
        return null;
      }
      await supabaseServer
        .from('tracks')
        .update({ 
          extended_prompt: `${extendedPrompt || prompt} | image_task_id: ${retryTaskId} | retry_${resolution.toLowerCase()}: true`,
          updated_at: new Date().toISOString()
        })
        .eq('task_id', taskId);
      console.log(`🔄 [CALLBACK] ${resolution} retry task created:`, retryTaskId);
      return retryTaskId;
    }
  } catch (error) {
    console.error(`❌ [CALLBACK] Failed to retry with ${resolution}:`, error);
  }
  return null;
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
    console.log('🛰️ [CALLBACK RAW]', JSON.stringify(raw));

    // --- Normalize payload from various possible shapes ---
    const data = raw?.data ?? raw;
    const payload = data?.data ?? data;
    
    // Extract taskId from multiple locations
    const taskId =
      payload?.task_id ??
      payload?.taskId ??
      data?.task_id ??
      data?.taskId ??
      raw?.task_id ??
      raw?.taskId;

    const status =
      payload?.status ??
      data?.status ??
      raw?.status ??
      payload?.callbackType ??
      data?.callbackType;

    // --- Parse image URL from multiple possible locations ---
    let imageUrl =
      (data?.result?.images?.[0]?.url ||
      data?.output?.image_url_full ||
      data?.output?.image_url ||
      payload?.result?.images?.[0]?.url ||
      payload?.output?.image_url_full ||
      payload?.output?.image_url) ||
      (payload?.image_url ??
      data?.image_url ??
      raw?.image_url);

    // Also check resultJson.resultUrls (new API structure)
    const resultJsonString = payload?.resultJson ?? data?.resultJson ?? raw?.resultJson ?? raw?.data?.resultJson;
    if (!imageUrl && resultJsonString) {
      try {
        const resultJson = typeof resultJsonString === 'string' 
          ? JSON.parse(resultJsonString) 
          : resultJsonString;
        if (resultJson?.resultUrls && Array.isArray(resultJson.resultUrls) && resultJson.resultUrls.length > 0) {
          imageUrl = resultJson.resultUrls[0];
          console.log('✅ [CALLBACK] Extracted image URL from resultJson.resultUrls:', imageUrl);
        }
      } catch (e) {
        console.error('❌ [CALLBACK] Failed to parse resultJson:', e);
      }
    }

    // --- Parse audio URL from multiple possible locations ---
    const audioUrl =
      (data?.result?.audios?.[0]?.url ||
      data?.output?.audio_url ||
      payload?.result?.audios?.[0]?.url ||
      payload?.output?.audio_url) ||
      (payload?.audio_url ??
      data?.audio_url ??
      raw?.audio_url);

    // Extract other metadata
    const title = payload?.title ?? data?.title;
    const duration = payload?.duration ?? data?.duration;
    const prompt = payload?.prompt ?? data?.prompt;

    // Log what we received
    const hasImage = !!imageUrl;
    const hasAudio = !!audioUrl;
    
    if (hasImage && !hasAudio) {
      console.log('🖼️ [CALLBACK] Received partial payload: image only');
    } else if (hasAudio && !hasImage) {
      console.log('🎵 [CALLBACK] Received partial payload: audio only');
    } else if (hasImage && hasAudio) {
      console.log('✅ [CALLBACK] Received complete payload: image + audio');
    } else {
      console.log('⏳ [CALLBACK] Received partial payload: no image or audio yet');
    }

    console.log('📌 taskId:', taskId, 'status:', status, 'hasImage:', hasImage, 'hasAudio:', hasAudio);

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
      console.error('❌ [CALLBACK] No track found for task_id:', taskId);
      return NextResponse.json({ ok: false, error: 'track not found' }, { status: 404 });
    }

    // Check if this is an image callback (taskId matches image_task_id stored in extended_prompt)
    const isImageCallback = track.extended_prompt?.includes(`image_task_id: ${taskId}`);
    
    // If already completed, be idempotent (allow image updates if image is missing)
    if (track.status === 'completed' && !(isImageCallback && !track.image_url)) {
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

    // --- Handle Image Callback Separately ---
    if (imageUrl && (isImageCallback || !track.image_url)) {
      console.log('🖼️ [CALLBACK] Image URL received.');

      // 1) Request presigned full-size download URL from Kie.ai
      try {
        const dlRes = await fetch("https://api.kie.ai/api/v1/gpt4o-image/download-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId: taskId, url: imageUrl })
        });

        const dlJson = await dlRes.json();
        const presignedUrl = dlJson?.data;
        if (!dlRes.ok || !presignedUrl) {
          console.error('❌ [CALLBACK] Failed to get presigned download URL:', dlJson);
          return NextResponse.json({ ok: false, error: 'presigned url fetch failed' }, { status: 500 });
        }
        console.log('🔍 [DEBUG] Presigned URL received:', presignedUrl);

        // --- Get final full-size URL with polling ---
        let finalUrl: string | null = null;
        for (let i = 1; i <= 5; i++) {
          const dlRes = await fetch("https://api.kie.ai/api/v1/gpt4o-image/download-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskId, url: imageUrl, resolution: "2K" }),
          });

          const dlJson = await dlRes.json();
          const candidate: string | undefined = dlJson?.data;
          if (!candidate) {
            console.log(`⏳ [CALLBACK] Attempt ${i}: no download-url yet`);
            await new Promise(r => setTimeout(r, 3000));
            continue;
          }

          const check = await getImageDimensions(candidate);
          console.log('🔍 [DEBUG] Verification result:', check);
          console.log(`🖼️ [IMAGE DIM] Attempt ${i}: ${check?.width || "?"}x${check?.height || "?"}`);
          if (check && check.width >= 2048) {
            finalUrl = candidate;
            console.log(`✅ [IMAGE GEN] Verified full-res on attempt ${i}: ${check.width}x${check.height}`);
            try {
              console.log('🔍 [DEBUG] Updating track with taskId:', taskId);
              const updateRes = await supabaseServer
                .from("tracks")
                .update({
                  image_url: finalUrl,
                  resolution: `${check.width}x${check.height}`,
                  updated_at: new Date().toISOString(),
                })
                .eq("task_id", taskId)
                .select();
              console.log('🔍 [DEBUG] Update result:', updateRes);
            } catch (err) {
              console.error('🔥 [DEBUG ERROR] Supabase update failed:', err);
            }

            try {
              const { data: postCheck, error: postErr } = await supabaseServer
                .from('tracks')
                .select('id, image_url, resolution, status, task_id, created_at')
                .eq('task_id', taskId)
                .maybeSingle();
              if (postErr) console.error('🔥 [DEBUG ERROR] Post-update DB check failed:', postErr);
              console.log('🔍 [DEBUG] Post-update DB check:', postCheck);
            } catch (err) {
              console.error('🔥 [DEBUG ERROR] Supabase select failed:', err);
            }
            break;
          }

          await new Promise(r => setTimeout(r, 3000));
        }

        if (!finalUrl) {
          console.warn("⚠️ [CALLBACK] Could not verify 2K image after polling — saving latest candidate to avoid nulls.");
          try {
            console.log('🔍 [DEBUG] Fallback update for taskId (avoid nulls):', taskId, 'imageUrl:', imageUrl);
            const fbRes = await supabaseServer
              .from("tracks")
              .update({
                image_url: imageUrl || null,
                resolution: "unknown",
                updated_at: new Date().toISOString(),
              })
              .eq("task_id", taskId)
              .select();
            console.log('🔍 [DEBUG] Fallback update result:', fbRes);
          } catch (err) {
            console.error('🔥 [DEBUG ERROR] Fallback update failed:', err);
          }
        }
      } catch (err) {
        console.error('❌ [CALLBACK] Presigned download flow failed:', err);
        return NextResponse.json({ ok: false, error: 'presigned download flow failed' }, { status: 500 });
      }
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

    // --- Final Check: Only mark complete and deduct credits when both audio and image exist ---
    let finalTrack: { audio_url: string | null; image_url: string | null; user_id: string | null; status: string | null } | null = null;
    try {
      const finalSel = await supabaseServer
        .from('tracks')
        .select('audio_url, image_url, user_id, status')
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

    // Only mark as completed if both audio and image exist
    if (finalTrack.audio_url && finalTrack.image_url && finalTrack.status !== 'completed') {
      console.log('✅ [CALLBACK] Both audio and image present, marking as completed');
      
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

      // Deduct credits atomically via RPC (only once when both are ready)
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
      console.log('⏳ [CALLBACK] Waiting for both audio and image. Current state:', {
        hasAudio: !!finalTrack.audio_url,
        hasImage: !!finalTrack.image_url,
        status: finalTrack.status
      });
    }

    // 🧩 Final debug summary
    console.log('🧩 [DEBUG SUMMARY]', {
      taskId,
      finalImage: finalTrack?.image_url,
      finalResolution: undefined, // resolution included in earlier logs; DB schema available above
      hasAudio: !!finalTrack?.audio_url,
      status: finalTrack?.status,
    });

    return NextResponse.json({ ok: true, taskId });
  } catch (e: any) {
    console.error('🔥 [CALLBACK] Exception:', e?.message || e);
    return NextResponse.json({ ok: false, error: 'callback exception' }, { status: 500 });
  }
}

