import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function generateWithRunware({
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
  const API_KEY = process.env.RUNWARE_API_KEY;
  if (!API_KEY) throw new Error('RUNWARE_API_KEY not set');

  // Runware NEVER receives LoRAs - they are DeepInfra-only
  const runwarePayload: any = {
    taskType: 'imageInference',
    taskUUID: crypto.randomUUID(),
    positivePrompt: prompt,
    width: width ?? 1024,
    height: height ?? 1024,
    model: modelId, // e.g. "runware:101@1"
    steps: steps ?? 20,
    seed,
    outputType: 'dataURI',
    outputFormat: 'PNG',
    deliveryMethod: 'sync',
    numberResults: 1,
  };

  const body = [runwarePayload];

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
  loras,
}: {
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  modelId: string;
  loras?: Array<{ id: string; scale: number }>;
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

  // DeepInfra LoRA format: { "loras": [{ "model": "civitai:XXXX", "weight": 0.8 }] }
  if (loras && loras.length > 0) {
    body.loras = loras.map(l => ({
      model: l.id, // e.g. "civitai:122359@135867"
      weight: l.scale, // e.g. 0.8
    }));
    console.log('[DEEPINFRA] LoRAs included:', JSON.stringify(body.loras));
  }

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
    const { prompt, modelId, provider, loraId, loraStrength, width, height, steps, seed } = await req.json();

    if (!prompt || !modelId) {
      return NextResponse.json(
        { error: 'Missing prompt or modelId' },
        { status: 400 }
      );
    }

    // Build loras array if LoRA is selected
    const loras = loraId
      ? [
          {
            id: loraId,
            scale: loraStrength || 1.0
          }
        ]
      : [];

    // CRITICAL: If ANY LoRA is selected, route to DeepInfra ONLY (never Runware)
    if (loras.length > 0) {
      console.log('[GEN] LoRAs detected — routing to DeepInfra only');
      console.log('[GEN] LoRA Payload:', JSON.stringify(loras));
      
      // CASE B: LoRA-enabled → DeepInfra with LoRAs → DeepInfra without LoRAs → fail
      try {
        // Try DeepInfra with LoRAs (FLUX.1-dev supports LoRAs best)
        const image = await generateWithDeepInfra({
          prompt,
          width,
          height,
          steps,
          seed,
          modelId: 'black-forest-labs/FLUX.1-dev',
          loras,
        });
        return NextResponse.json({ image });
      } catch (err) {
        console.error('[GEN] DeepInfra with LoRAs failed, retrying without LoRAs:', err);
        // Fallback: try DeepInfra without LoRAs
        try {
          const image = await generateWithDeepInfra({
            prompt,
            width,
            height,
            steps,
            seed,
            modelId: 'black-forest-labs/FLUX.1-dev',
            loras: undefined, // No LoRAs
          });
          return NextResponse.json({ image });
        } catch (fallbackErr) {
          console.error('[GEN] DeepInfra fallback also failed:', fallbackErr);
          throw fallbackErr; // Fail gracefully
        }
      }
    }

    // CASE A: No LoRAs → Runware → DeepInfra Schnell → DeepInfra Dev → fail
    console.log('[GEN] No LoRAs — using waterfall: Runware → DeepInfra');
    console.log('[GEN] Provider:', provider, 'Model:', modelId);

    // Determine final provider and model for no-LoRA case
    let finalProvider = provider;
    let finalModel = modelId;

    // If provider was "runware", use Runware model; otherwise use DeepInfra model
    if (provider === 'runware') {
      finalProvider = 'runware';
      finalModel = modelId || 'runware:101@1'; // Default to FLUX.1 Schnell
    } else {
      finalProvider = 'deepinfra';
      finalModel = modelId || 'black-forest-labs/FLUX.1-dev';
    }

    console.log('[GEN] Using provider:', finalProvider);

    try {
      if (finalProvider === 'runware') {
        // Waterfall: Runware → DeepInfra Schnell → DeepInfra Dev
        try {
          const image = await generateWithRunware({
            prompt,
            width,
            height,
            steps,
            seed,
            modelId: finalModel,
          });
          return NextResponse.json({ image });
        } catch (err) {
          console.error('[GEN] Runware failed, falling back to DeepInfra Schnell:', err);
          try {
            const image = await generateWithDeepInfra({
              prompt,
              width,
              height,
              steps,
              seed,
              modelId: 'black-forest-labs/FLUX.1-schnell',
              loras: undefined,
            });
            return NextResponse.json({ image });
          } catch (schnellErr) {
            console.error('[GEN] DeepInfra Schnell failed, falling back to DeepInfra Dev:', schnellErr);
            // Final fallback: DeepInfra Dev
            const image = await generateWithDeepInfra({
              prompt,
              width,
              height,
              steps,
              seed,
              modelId: 'black-forest-labs/FLUX.1-dev',
              loras: undefined,
            });
            return NextResponse.json({ image });
          }
        }
      } else if (finalProvider === 'deepinfra') {
        // Direct DeepInfra call (no waterfall needed)
        const image = await generateWithDeepInfra({
          prompt,
          width,
          height,
          steps,
          seed,
          modelId: finalModel,
          loras: undefined,
        });
        return NextResponse.json({ image });
      } else {
        return NextResponse.json(
          { error: `Unsupported provider: ${finalProvider}` },
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
