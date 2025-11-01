import { NextRequest, NextResponse } from 'next/server';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Image proxy endpoint for full-quality 2K image delivery
 * Preserves image sharpness by streaming raw image data without compression
 * Usage: /api/proxy-image?url=https://image.cdn.example.com/...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      console.error('❌ [IMAGE PROXY] Missing url parameter');
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // Validate URL
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      console.error('❌ [IMAGE PROXY] Invalid URL:', imageUrl);
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    console.log('🖼️ [IMAGE PROXY] Fetching image from:', imageUrl.substring(0, 100) + '...');

    // Fetch the image file with full quality
    const imageResponse = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/png, image/jpeg, image/webp, image/*',
      },
    });

    if (!imageResponse.ok) {
      console.error('❌ [IMAGE PROXY] Failed to fetch image:', imageResponse.status, imageResponse.statusText);
      return NextResponse.json({ 
        error: 'Failed to fetch image', 
        details: `${imageResponse.status} ${imageResponse.statusText}` 
      }, { status: imageResponse.status });
    }

    // Get the image data as array buffer (full quality, no compression)
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/png';

    console.log('✅ [IMAGE PROXY] Successfully fetched image, size:', imageBuffer.byteLength, 'bytes');

    // Return image with proper headers for full-quality delivery
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        // Disable compression to preserve quality
        'Content-Encoding': 'identity',
      },
    });
  } catch (error: any) {
    console.error('❌ [IMAGE PROXY] Error proxying image:', error.message);
    return NextResponse.json({ 
      error: 'Failed to proxy image', 
      details: error.message 
    }, { status: 500 });
  }
}



