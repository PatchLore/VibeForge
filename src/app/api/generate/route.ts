import { NextRequest, NextResponse } from 'next/server';
import { ALL_MODELS } from '@/data/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function generateWithRunware({
  prompt,
  width,
  height,
  steps,
  seed,
  modelId,
  style,
}: {
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  modelId: string;
  style?: { id: string; name: string } | null;
}): Promise<string> {
  const API_KEY = process.env.RUNWARE_API_KEY;
  if (!API_KEY) throw new Error('RUNWARE_API_KEY not set');

  const runwareModelId =
    modelId === 'flux-schnell'
      ? 'runware:101@1' // FLUX Schnell AIR ID
      : modelId;

  const body = [
    {
      taskType: 'imageInference',
      taskUUID: crypto.randomUUID(),
      positivePrompt: prompt,
      width: width ?? 1024,
      height: height ?? 1024,
      model: runwareModelId,
      steps: steps ?? 20,
      seed,
      lora: style?.id ? [style.id] : [],
      outputType: 'dataURI',
      outputFormat: 'PNG',
      deliveryMethod: 'sync',
      numberResults: 1,
    },
  ];

  console.log('[RUNWARE] Request body:', JSON.stringify(body[0]));

  const res = await fetch('https://api.runware.ai/v1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  console.log('[RUNWARE] Status:', res.status);

  if (!res.ok) {
    const text = await res.text();
    console.error('[RUNWARE] Error body:', text);
    throw new Error(`Runware error: ${res.status} ${text}`);
  }

  const json = (await res.json()) as any;
  const item = json?.data?.[0];
  const dataURI: string | undefined = item?.imageDataURI || item?.imageURL || item?.imageBase64Data;

  if (!dataURI) {
    console.error('[RUNWARE] Unexpected response:', JSON.stringify(json).slice(0, 400));
    throw new Error('Runware: no image data in response');
  }

  // If it's already a data URI, just return it. If it's a URL, return as-is (frontend can handle it)
  if (dataURI.startsWith('data:image')) {
    return dataURI;
  }

  // If it's a URL, return it as-is
  return dataURI;
}

async function generateWithDeepInfra({
  prompt,
  width,
  height,
  steps,
  seed,
  modelId,
}: {
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  modelId: string;
}): Promise<string> {
  const API_KEY = process.env.DEEPINFRA_API_KEY;
  if (!API_KEY) throw new Error('DEEPINFRA_API_KEY not set');

  const url = `https://api.deepinfra.com/v1/inference/${modelId}`;
  console.log('[DEEPINFRA] URL:', url);

  const body: any = { prompt };
  if (width) body.width = width;
  if (height) body.height = height;
  if (steps) body.num_inference_steps = steps;
  if (seed) body.seed = seed;

  console.log('[DEEPINFRA] Body:', JSON.stringify(body));

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  console.log('[DEEPINFRA] Status:', res.status);

  if (!res.ok) {
    const text = await res.text();
    console.error('[DEEPINFRA] Error body:', text);
    throw new Error(`DeepInfra error: ${res.status} ${text}`);
  }

  const json = (await res.json()) as any;
  const imageUrl: string | undefined = json?.images?.[0];

  if (!imageUrl) {
    console.error('[DEEPINFRA] Unexpected response:', JSON.stringify(json).slice(0, 400));
    throw new Error('DeepInfra: no image URL in response');
  }

  // Fetch image URL and convert to base64
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) {
    throw new Error(`Failed to fetch DeepInfra image: ${imgRes.status}`);
  }

  const arrayBuffer = await imgRes.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);
  const base64 = buf.toString('base64');

  return `data:image/png;base64,${base64}`;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, model: modelId, width, height, steps, seed, style } = await req.json();

    if (!prompt || !modelId) {
      return NextResponse.json(
        { error: 'Missing prompt or model' },
        { status: 400 }
      );
    }

    const selectedModel = ALL_MODELS.find(m => m.id === modelId);
    if (!selectedModel) {
      return NextResponse.json(
        { error: `Unknown model: ${modelId}` },
        { status: 400 }
      );
    }

    const provider = selectedModel.provider; // "runware" | "deepinfra"
    console.log('[GEN] Provider:', provider, 'Model:', modelId);

    try {
      if (provider === 'runware') {
        // Try Runware first, then DeepInfra fallback
        try {
          const image = await generateWithRunware({ prompt, width, height, steps, seed, modelId, style });
          return NextResponse.json({ image });
        } catch (err) {
          console.error('[GEN] Runware failed, falling back to DeepInfra:', err);
          const image = await generateWithDeepInfra({ 
            prompt, 
            width, 
            height, 
            steps, 
            seed, 
            modelId: 'stabilityai/stable-diffusion-xl-base-1.0' 
          });
          return NextResponse.json({ image });
        }
      } else if (provider === 'deepinfra') {
        const image = await generateWithDeepInfra({ prompt, width, height, steps, seed, modelId });
        return NextResponse.json({ image });
      } else {
        return NextResponse.json(
          { error: `Unsupported provider: ${provider}` },
          { status: 400 }
        );
      }
    } catch (error: any) {
      console.error('[GEN] Fatal error:', error);
      return NextResponse.json(
        { error: error?.message || 'Internal server error' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[GEN] Request parsing error:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
