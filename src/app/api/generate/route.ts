import { NextRequest, NextResponse } from 'next/server';
import { LORA_SUPPORTED, MODEL_METADATA } from '@/data/models';

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
  allowLoras = true, // Only include LoRAs if model supports them
}: {
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  modelId: string;
  loras?: Array<{ id: string; scale: number }>;
  allowLoras?: boolean;
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
  // Only include LoRAs if allowLoras is true (SDXL models only)
  if (allowLoras && loras && loras.length > 0) {
    body.loras = loras.map(l => ({
      model: l.id, // e.g. "civitai:122359@135867"
      weight: l.scale, // e.g. 0.8
    }));
    console.log('[DEEPINFRA] LoRAs included:', JSON.stringify(body.loras));
  } else if (loras && loras.length > 0) {
    console.log('[DEEPINFRA] LoRAs provided but model does not support them (Flux model)');
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

    // Validate model exists
    const modelMetadata = MODEL_METADATA[modelId];
    if (!modelMetadata) {
      return NextResponse.json(
        { error: `Invalid model: ${modelId}` },
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

    // Create a mutable body object for routing logic
    const body: any = {
      model: modelId,
      loras: loras,
    };

    // ────────────────────────────────────────────────────────────────
    // MAIN ROUTING LOGIC (CRITICAL FIX)
    // ────────────────────────────────────────────────────────────────

    const model = body.model;
    let finalModel = model;
    let providerRoute = "deepinfra";

    // 1. If LoRAs selected and model doesn't support them → switch to SDXL Base
    if (loras.length > 0 && !LORA_SUPPORTED[model]) {
      console.warn(`[LORA BLOCK] Model ${model} cannot use LoRAs. Switching to SDXL Base.`);
      finalModel = "sdxl-base";
      body.model = finalModel;
      body.loras = loras; // Keep the LoRAs for the new model
    }

    // 2. If model supports LoRAs, leave everything as is
    // (No action needed - finalModel is already correct)

    // 3. Provider routing
    if (finalModel === "flux-schnell") {
      providerRoute = "runware";
    } else {
      providerRoute = "deepinfra";
    }

    // 4. Remove LoRAs for models that don't support them
    if (!LORA_SUPPORTED[finalModel]) {
      body.loras = [];
    }

    // Debug logs
    console.log("[GEN] Final model:", finalModel);
    console.log("[GEN] LORAs:", body.loras.length);
    console.log("[GEN] Provider:", providerRoute);

    // Get final model metadata
    const finalModelMetadata = MODEL_METADATA[finalModel];
    if (!finalModelMetadata) {
      return NextResponse.json(
        { error: `Invalid final model: ${finalModel}` },
        { status: 400 }
      );
    }

    // ────────────────────────────────────────────────────────────────
    // PAYLOAD BUILDER FIXES
    // ────────────────────────────────────────────────────────────────

    // RUNWARE PAYLOAD MUST NOT include "loras"
    if (providerRoute === "runware") {
      delete body.loras;
    }

    // DEEPINFRA – ONLY SDXL MODELS CAN USE LORAs (except Seedream, already stripped)
    if (providerRoute === "deepinfra" && finalModel.startsWith("flux-")) {
      delete body.loras; // Flux cannot use SDXL LoRAs
    }

    // Prepare final loras array for DeepInfra
    const finalLoras = body.loras && body.loras.length > 0 ? body.loras : undefined;
    const allowLoras = finalLoras && LORA_SUPPORTED[finalModel] === true;

    // ────────────────────────────────────────────────────────────────
    // EXECUTE GENERATION
    // ────────────────────────────────────────────────────────────────

    try {
      if (finalModel === "flux-schnell") {
        // Waterfall: Runware → DeepInfra Schnell → DeepInfra Dev
        const runwareModelId = finalModelMetadata.apiModelId || "runware:101@1";
        const deepInfraSchnellId = finalModelMetadata.deepInfraModelId || "black-forest-labs/FLUX.1-schnell";
        const deepInfraDevId = "black-forest-labs/FLUX.1-dev";

        try {
          const image = await generateWithRunware({
            prompt,
            width,
            height,
            steps,
            seed,
            modelId: runwareModelId,
          });
          return NextResponse.json({ image });
        } catch (err) {
          console.error("[GEN] Runware failed, falling back to DeepInfra Schnell:", err);
          try {
            const image = await generateWithDeepInfra({
              prompt,
              width,
              height,
              steps,
              seed,
              modelId: deepInfraSchnellId,
              loras: undefined,
              allowLoras: false,
            });
            return NextResponse.json({ image });
          } catch (schnellErr) {
            console.error("[GEN] DeepInfra Schnell failed, falling back to DeepInfra Dev:", schnellErr);
            const image = await generateWithDeepInfra({
              prompt,
              width,
              height,
              steps,
              seed,
              modelId: deepInfraDevId,
              loras: undefined,
              allowLoras: false,
            });
            return NextResponse.json({ image });
          }
        }
      } else if (finalModel === "flux-dev") {
        // Direct DeepInfra FLUX.1 Dev
        const image = await generateWithDeepInfra({
          prompt,
          width,
          height,
          steps,
          seed,
          modelId: finalModelMetadata.deepInfraModelId || "black-forest-labs/FLUX.1-dev",
          loras: undefined,
          allowLoras: false,
        });
        return NextResponse.json({ image });
      } else if (["seedream-xl", "janu-sdxl", "sdxl-base", "dreamshaper-xl", "realvis-xl"].includes(finalModel)) {
        // Direct DeepInfra SDXL models
        if (!finalModelMetadata.deepInfraModelId) {
          return NextResponse.json(
            { error: `Model ${finalModel} missing DeepInfra model ID` },
            { status: 400 }
          );
        }

        // Try with LoRAs if allowed, then fallback without LoRAs
        if (allowLoras && finalLoras) {
          try {
            const image = await generateWithDeepInfra({
              prompt,
              width,
              height,
              steps,
              seed,
              modelId: finalModelMetadata.deepInfraModelId,
              loras: finalLoras,
              allowLoras: true,
            });
            return NextResponse.json({ image });
          } catch (err) {
            console.error("[GEN] DeepInfra with LoRAs failed, retrying without LoRAs:", err);
            const image = await generateWithDeepInfra({
              prompt,
              width,
              height,
              steps,
              seed,
              modelId: finalModelMetadata.deepInfraModelId,
              loras: undefined,
              allowLoras: false,
            });
            return NextResponse.json({ image });
          }
        } else {
          // No LoRAs or LoRAs not allowed
          const image = await generateWithDeepInfra({
            prompt,
            width,
            height,
            steps,
            seed,
            modelId: finalModelMetadata.deepInfraModelId,
            loras: undefined,
            allowLoras: false,
          });
          return NextResponse.json({ image });
        }
      } else {
        return NextResponse.json(
          { error: `Unsupported model: ${finalModel}` },
          { status: 400 }
        );
      }
    } catch (error: any) {
      console.error("[GEN] Fatal error:", error);
      return NextResponse.json(
        { error: error?.message || "Internal server error" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[GEN] Request parsing error:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
