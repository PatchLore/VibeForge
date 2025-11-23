import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('[HF Router] API route HIT');
  
  let modelId = 'unknown';
  let prompt = '';
  
  try {
    const body = await request.json();
    modelId = body.modelId || 'unknown';
    prompt = body.prompt || '';

    if (!modelId || !prompt) {
      return NextResponse.json(
        { error: 'Missing modelId or prompt' },
        { status: 400 }
      );
    }

    // Use server-only env var (NOT NEXT_PUBLIC_)
    const API_KEY = process.env.HF_API_KEY || '';
    const BASE_URL = process.env.HF_BASE_URL || 'https://router.huggingface.co';

    if (!API_KEY) {
      console.error('[HF Router] Missing HF_API_KEY environment variable');
      return NextResponse.json(
        { error: 'Server configuration error: HF_API_KEY not set' },
        { status: 500 }
      );
    }

    // Build the payload - EXACTLY { "inputs": prompt }
    const payload = { inputs: prompt };

    // Build the fetch URL using HF Router API
    const url = `${BASE_URL}/${modelId}`;

    // Full debug logs BEFORE fetch()
    console.log('[HF Router] Model ID:', modelId);
    console.log('[HF Router] Base URL:', process.env.HF_BASE_URL || 'https://router.huggingface.co (default)');
    console.log('[HF Router] Final URL:', url);
    console.log('[HF Router] Payload:', JSON.stringify(payload, null, 2));
    console.log('[HF Router] Prompt length:', prompt.length);

    // Call HuggingFace Router API
    console.log('[HF Router] Making fetch request...');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    console.log('[HF Router] Fetch response status:', res.status);
    console.log('[HF Router] Fetch response headers:', Object.fromEntries(res.headers.entries()));

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[HF Router] Error:', res.status, errorText);
      return NextResponse.json(
        { error: `HuggingFace Router API error: ${res.status} ${errorText}` },
        { status: res.status }
      );
    }

    console.log('[HF Router] Response received, status:', res.status);

    // HF can return either:
    // 1. Binary blob (image data)
    // 2. JSON array with base64 data
    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      // JSON response with base64 data
      const json = await res.json();
      console.log('[HF Router] JSON response type');

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
        console.error('[HF Router] No base64 image found in JSON response:', JSON.stringify(json).substring(0, 200));
        return NextResponse.json(
          { error: 'Invalid response format from HuggingFace Router API' },
          { status: 500 }
        );
      }

      // Ensure data URI format
      const imageData = base64Image.startsWith('data:image')
        ? base64Image
        : `data:image/png;base64,${base64Image}`;

      console.log('[HF Router] Image converted, length:', imageData.length);
      return NextResponse.json({ image: imageData });
    } else {
      // Binary blob response (most common)
      console.log('[HF Router] Binary response type');
      const arrayBuffer = await res.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      console.log('[HF Router] Response size:', arrayBuffer.byteLength, 'bytes');

      // Convert to base64
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }

      const base64 = Buffer.from(binary, 'binary').toString('base64');
      const imageData = `data:image/png;base64,${base64}`;

      console.log('[HF Router] Image converted to base64, length:', imageData.length);
      return NextResponse.json({ image: imageData });
    }
  } catch (error: any) {
    const BASE_URL = process.env.HF_BASE_URL || 'https://router.huggingface.co';
    const failedURL = `${BASE_URL}/${modelId}`;
    
    console.error('[HF Router] FAILED URL:', failedURL);
    console.error('[HF Router] Model ID:', modelId);
    console.error('[HF Router] Base URL:', BASE_URL);
    console.error('[HF Router] Error Details:', error);
    console.error('[HF Router] Error Message:', error.message);
    console.error('[HF Router] Error Stack:', error.stack);
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

