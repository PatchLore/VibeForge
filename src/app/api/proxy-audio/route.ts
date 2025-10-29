import { NextRequest, NextResponse } from 'next/server';
import { verifyAndUpscaleTo2K } from '@/lib/kie';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Audio proxy endpoint to handle CORS and caching for external audio files
 * Usage: /api/proxy-audio?url=https://musicfile.kie.ai/...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const audioUrl = searchParams.get('url');

    if (!audioUrl) {
      console.error('❌ [AUDIO PROXY] Missing url parameter');
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // Validate URL
    if (!audioUrl.startsWith('http://') && !audioUrl.startsWith('https://')) {
      console.error('❌ [AUDIO PROXY] Invalid URL:', audioUrl);
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    console.log('🎵 [AUDIO PROXY] Fetching audio from:', audioUrl.substring(0, 100) + '...');

    // Fetch the audio file
    const audioResponse = await fetch(audioUrl, {
      method: 'GET',
      headers: {
        'Accept': 'audio/mpeg, audio/*',
      },
    });

    if (!audioResponse.ok) {
      console.error('❌ [AUDIO PROXY] Failed to fetch audio:', audioResponse.status, audioResponse.statusText);
      return NextResponse.json({ 
        error: 'Failed to fetch audio', 
        details: `${audioResponse.status} ${audioResponse.statusText}` 
      }, { status: audioResponse.status });
    }

    // Get the audio/image data
    const audioBuffer = await audioResponse.arrayBuffer();
    const contentType = audioResponse.headers.get('content-type') || 'audio/mpeg';

    // Optional diagnostics for images: log dimensions via verifier
    if (contentType.startsWith('image/')) {
      try {
        const check = await verifyAndUpscaleTo2K(audioUrl, { width: 2048, height: 1152 });
        console.log(`[Proxy] ${audioUrl} — ${check.width}x${check.height}`);
      } catch (e: any) {
        console.warn('[Proxy] Dimension check failed:', e?.message || e);
      }
    }

    console.log('✅ [AUDIO PROXY] Successfully fetched audio, size:', audioBuffer.byteLength, 'bytes');

    // Return audio with proper headers
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error: any) {
    console.error('❌ [AUDIO PROXY] Error proxying audio:', error.message);
    return NextResponse.json({ 
      error: 'Failed to proxy audio', 
      details: error.message 
    }, { status: 500 });
  }
}

