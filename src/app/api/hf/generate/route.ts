import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { modelId, prompt } = await request.json();

    if (!modelId || !prompt) {
      return NextResponse.json(
        { error: 'Missing modelId or prompt' },
        { status: 400 }
      );
    }

    // Use server-only env var (NOT NEXT_PUBLIC_)
    const API_KEY = process.env.HF_API_KEY || '';
    const BASE_URL = process.env.HF_BASE_URL || 'https://api-inference.huggingface.co/models';

    if (!API_KEY) {
      console.error('[HF API] Missing HF_API_KEY environment variable');
      return NextResponse.json(
        { error: 'Server configuration error: HF_API_KEY not set' },
        { status: 500 }
      );
    }

    // Build the fetch URL
    const finalURL = `${BASE_URL}/${modelId}`;

    // Build the payload - EXACTLY { "inputs": prompt }
    const payload = { inputs: prompt };

    // Debugging logs
    console.log('[HF API] Model:', modelId);
    console.log('[HF API] Prompt length:', prompt.length);
    console.log('[HF API] URL:', finalURL);

    // Call HuggingFace API
    const res = await fetch(finalURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[HF API] Error:', res.status, errorText);
      return NextResponse.json(
        { error: `HuggingFace API error: ${res.status} ${errorText}` },
        { status: res.status }
      );
    }

    console.log('[HF API] Response received, status:', res.status);

    // HF can return either:
    // 1. Binary blob (image data)
    // 2. JSON array with base64 data
    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      // JSON response with base64 data
      const json = await res.json();
      console.log('[HF API] JSON response type');

      // HF sometimes returns array: [{ generated_image: "base64..." }]
      // Or direct object with base64 field
      let base64Image: string;

      if (Array.isArray(json) && json.length > 0) {
        base64Image = json[0].generated_image || json[0].image || json[0].base64 || '';
      } else if (json.generated_image) {
        base64Image = json.generated_image;
      } else if (json.image) {
        base64Image = json.image;
      } else if (json.base64) {
        base64Image = json.base64;
      } else {
        // Try to find any base64 field
        const base64Field = Object.values(json).find((v: any) => 
          typeof v === 'string' && v.length > 100 && (v.startsWith('data:image') || v.startsWith('iVBORw0KG'))
        ) as string | undefined;
        base64Image = base64Field || '';
      }

      if (!base64Image) {
        console.error('[HF API] No base64 image found in JSON response:', JSON.stringify(json).substring(0, 200));
        return NextResponse.json(
          { error: 'Invalid response format from HuggingFace API' },
          { status: 500 }
        );
      }

      // Ensure data URI format
      const imageData = base64Image.startsWith('data:image')
        ? base64Image
        : `data:image/png;base64,${base64Image}`;

      console.log('[HF API] Image converted, length:', imageData.length);
      return NextResponse.json({ image: imageData });
    } else {
      // Binary blob response (most common)
      console.log('[HF API] Binary response type');
      const arrayBuffer = await res.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      console.log('[HF API] Response size:', arrayBuffer.byteLength, 'bytes');

      // Convert to base64
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }

      const base64 = Buffer.from(binary, 'binary').toString('base64');
      const imageData = `data:image/png;base64,${base64}`;

      console.log('[HF API] Image converted to base64, length:', imageData.length);
      return NextResponse.json({ image: imageData });
    }
  } catch (error: any) {
    console.error('[HF API] Exception:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

