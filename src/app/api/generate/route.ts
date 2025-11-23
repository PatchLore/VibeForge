import { NextRequest, NextResponse } from 'next/server';
import { ALL_MODELS } from '@/data/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface GenerateRequest {
  prompt: string;
  model: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
}

async function tryRunware(
  prompt: string,
  width?: number,
  height?: number,
  steps?: number,
  seed?: number
): Promise<string | null> {
  const API_KEY = process.env.RUNWARE_API_KEY;
  
  if (!API_KEY) {
    console.log('[GEN] Runware: API key not configured, skipping');
    return null;
  }

  const url = 'https://api.runware.ai/v1/schnell';
  const payload: any = { prompt };
  
  if (width) payload.width = width;
  if (height) payload.height = height;
  if (steps) payload.steps = steps;
  if (seed) payload.seed = seed;

  console.log('[GEN] Provider: Runware');
  console.log('[GEN] Calling URL:', url);
  console.log('[GEN] Model: FLUX.1 Schnell');
  console.log('[GEN] Payload:', JSON.stringify(payload, null, 2));

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('[GEN] Status Code:', res.status);
    console.log('[GEN] Model: FLUX.1 Schnell');

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[GEN] Runware Error:', res.status, errorText);
      return null;
    }

    // Runware returns binary image data
    const arrayBuffer = await res.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    console.log('[GEN] Runware Response Size:', arrayBuffer.byteLength, 'bytes');

    // Convert to base64
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }

    const base64 = Buffer.from(binary, 'binary').toString('base64');
    const imageData = `data:image/png;base64,${base64}`;

    console.log('[GEN] Runware: Success! Image converted to base64');
    return imageData;
  } catch (error: any) {
    console.error('[GEN] Runware Exception:', error.message);
    console.error('[GEN] Runware Stack:', error.stack);
    return null;
  }
}

async function tryDeepInfra(
  model: string,
  prompt: string,
  width?: number,
  height?: number,
  steps?: number,
  seed?: number
): Promise<string | null> {
  const API_KEY = process.env.DEEPINFRA_API_KEY;
  
  if (!API_KEY) {
    console.log('[GEN] DeepInfra: API key not configured, skipping');
    return null;
  }

  const url = `https://api.deepinfra.com/v1/inference/${model}`;
  const payload: any = { prompt };
  
  if (width) payload.width = width;
  if (height) payload.height = height;
  if (steps) payload.steps = steps;
  if (seed) payload.seed = seed;

  console.log('[GEN] Provider: DeepInfra');
  console.log('[GEN] Calling URL:', url);
  console.log('[GEN] Model:', model);
  console.log('[GEN] Payload:', JSON.stringify(payload, null, 2));

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('[GEN] Status Code:', res.status);
    console.log('[GEN] Model:', model);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[GEN] DeepInfra Error:', res.status, errorText);
      return null;
    }

    // DeepInfra can return either binary or JSON with base64
    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      // JSON response with base64 data
      const json = await res.json();
      console.log('[GEN] DeepInfra: JSON response type');

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
        console.error('[GEN] DeepInfra: No base64 image found in JSON response');
        return null;
      }

      const imageData = base64Image.startsWith('data:image')
        ? base64Image
        : `data:image/png;base64,${base64Image}`;

      console.log('[GEN] DeepInfra: Success! Image extracted from JSON');
      return imageData;
    } else {
      // Binary blob response
      console.log('[GEN] DeepInfra: Binary response type');
      const arrayBuffer = await res.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      console.log('[GEN] DeepInfra Response Size:', arrayBuffer.byteLength, 'bytes');

      // Convert to base64
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }

      const base64 = Buffer.from(binary, 'binary').toString('base64');
      const imageData = `data:image/png;base64,${base64}`;

      console.log('[GEN] DeepInfra: Success! Image converted to base64');
      return imageData;
    }
  } catch (error: any) {
    console.error('[GEN] DeepInfra Exception:', error.message);
    console.error('[GEN] DeepInfra Stack:', error.stack);
    return null;
  }
}

export async function POST(req: NextRequest) {
  console.log('[GEN] API route HIT');
  
  try {
    const body: GenerateRequest = await req.json();
    const { prompt, model, width, height, steps, seed } = body;

    if (!prompt || !model) {
      return NextResponse.json(
        { error: 'Missing prompt or model' },
        { status: 400 }
      );
    }

    console.log('[GEN] Request received');
    console.log('[GEN] Prompt:', prompt);
    console.log('[GEN] Model:', model);
    console.log('[GEN] Width:', width);
    console.log('[GEN] Height:', height);
    console.log('[GEN] Steps:', steps);
    console.log('[GEN] Seed:', seed);

    // Look up model metadata to determine provider
    const modelMetadata = ALL_MODELS.find(m => m.id === model);
    
    if (!modelMetadata) {
      return NextResponse.json(
        { error: `Unknown model: ${model}` },
        { status: 400 }
      );
    }

    const provider = modelMetadata.provider;
    console.log('[GEN] Provider selected:', provider);

    let imageData: string | null = null;

    if (provider === 'runware') {
      // Try Runware first, fallback to DeepInfra
      console.log('[GEN] Calling URL: https://api.runware.ai/v1/schnell');
      imageData = await tryRunware(prompt, width, height, steps, seed);
      
      if (!imageData) {
        console.log('[GEN] Runware failed, falling back to DeepInfra...');
        // Fallback to DeepInfra with a compatible model
        imageData = await tryDeepInfra('black-forest-labs/FLUX.1-dev', prompt, width, height, steps, seed);
      }
    } else if (provider === 'deepinfra') {
      // Try DeepInfra only (no fallback to Runware)
      console.log('[GEN] Calling URL: https://api.deepinfra.com/v1/inference/' + model);
      imageData = await tryDeepInfra(model, prompt, width, height, steps, seed);
    }

    if (!imageData) {
      console.error('[GEN] All providers failed');
      return NextResponse.json(
        { error: 'All providers failed' },
        { status: 500 }
      );
    }

    console.log('[GEN] Success! Returning image data');
    return NextResponse.json({ image: imageData });
  } catch (error: any) {
    console.error('[GEN] Fatal Error:', error.message);
    console.error('[GEN] Error Stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
