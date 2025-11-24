import { NextRequest, NextResponse } from 'next/server';
import { LORA_SUPPORTED, MODEL_METADATA } from '@/data/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Import generation functions from shared module
import { generateWithRunware, generateWithDeepInfra } from '@/lib/imageGenerators';

export async function POST(req: NextRequest) {
  try {
    const { prompt, modelId, loraId, loraStrength, loras, aspect, width, height, steps, seed } = await req.json();

    console.log("====================================================");
    console.log("[DEBUG] Incoming modelId from frontend:", modelId);
    console.log("[DEBUG] MODELS list:", MODEL_METADATA);
    console.log("====================================================");

    if (!prompt || !modelId) {
      return NextResponse.json(
        { error: 'Missing prompt or modelId' },
        { status: 400 }
      );
    }

    // Build loras array - support both old format (loraId/loraStrength) and new format (loras array)
    let lorasArray: Array<{ id: string; scale: number }> = [];
    
    if (loras && Array.isArray(loras) && loras.length > 0) {
      // New format: array of { id, strength }
      lorasArray = loras.map((l: any) => ({
        id: l.id,
        scale: l.strength || l.scale || 1.0
      }));
    } else if (loraId) {
      // Old format: single loraId and loraStrength
      lorasArray = [
        {
          id: loraId,
          scale: loraStrength || 1.0
        }
      ];
    }

    // Create a mutable body object for routing logic
    const body: any = {
      model: modelId,
      loras: lorasArray,
    };

    // ────────────────────────────────────────────────────────────────
    // MAIN ROUTING FIX — LoRA Enforcement
    // ────────────────────────────────────────────────────────────────

    const model = body.model;
    let finalModel = model;
    let provider = "deepinfra";

    // CASE 1 — LoRAs selected but model cannot use them
    if (lorasArray.length > 0 && LORA_SUPPORTED[model] === false) {
      console.warn(`[LORA SWITCH] Model '${model}' does NOT support LoRAs. Switching to SDXL Turbo.`);
      finalModel = "stabilityai/sdxl-turbo";
      body.model = finalModel;
    } else if (LORA_SUPPORTED[model] === true) {
      // Keep selected model for valid LoRA models (only if we didn't switch above)
      finalModel = model;
    }

    // CASE 2 — Seedream XL attempted with LoRAs
    if (finalModel === "seedream-xl" && lorasArray.length > 0) {
      console.warn("[Seedream] LoRAs removed (Seedream does not support SDXL LoRAs).");
      body.loras = [];
    }

    // CASE 3 — Flux models must never receive LoRAs
    if (finalModel.startsWith("flux-")) {
      body.loras = [];
    }

    // ────────────────────────────────────────────────────────────────
    // PROVIDER ROUTING (FINAL & CORRECT)
    // ────────────────────────────────────────────────────────────────

    // Flux Schnell runs ONLY on Runware
    if (finalModel === "flux-schnell") {
      provider = "runware";
    }

    // All other models (Flux Dev + all SDXL) use DeepInfra
    // deepinfra = default

    console.log("[GEN] Requested model:", model);
    console.log("[GEN] Final routed model:", finalModel);
    console.log("[GEN] LoRAs used:", body.loras.length);
    console.log("[GEN] Provider:", provider);

    // ────────────────────────────────────────────────────────────────
    // PAYLOAD SANITIZATION (NO MORE 400/404)
    // ────────────────────────────────────────────────────────────────

    // RUNWARE → must NOT receive LoRAs
    if (provider === "runware") {
      delete body.loras;
    }

    // DEEPINFRA + FLUX DEV → no LoRAs
    if (provider === "deepinfra" && finalModel.startsWith("flux-")) {
      delete body.loras;
    }

    // DEEPINFRA + SEEDREAM → no LoRAs
    if (provider === "deepinfra" && finalModel === "seedream-xl") {
      delete body.loras;
    }

    // SDXL models keep LoRAs automatically
    // 'stabilityai/sdxl-turbo'

    // Prepare final loras array for DeepInfra
    const finalLoras = body.loras && body.loras.length > 0 ? body.loras : undefined;
    const allowLoras = finalLoras && LORA_SUPPORTED[finalModel] === true;

    // Get model metadata (for models that need special handling)
    // For LoRA-supported models, finalModel IS the DeepInfra model ID
    const modelMetadata = MODEL_METADATA[finalModel];
    const deepInfraModelId = modelMetadata?.deepInfraModelId || finalModel;

    console.log("[DEBUG] finalModel:", finalModel);
    console.log("[DEBUG] provider:", provider);
    console.log("[DEBUG] allowLoras:", allowLoras);
    console.log("[DEBUG] loras:", body.loras);

    // ────────────────────────────────────────────────────────────────
    // EXECUTE GENERATION
    // ────────────────────────────────────────────────────────────────

    try {
      if (finalModel === "flux-schnell") {
        // Waterfall: Runware FLUX.1-schnell → DeepInfra FLUX.1-schnell → DeepInfra SDXL Turbo (ai-forever)
        const runwareModelId = modelMetadata?.apiModelId || "runware:101@1";
        const deepInfraSchnellId = modelMetadata?.deepInfraModelId || "black-forest-labs/FLUX.1-schnell";
        const deepInfraTurboId = "ai-forever/sdxl-turbo";

        console.log("[GEN] Flux Schnell waterfall start", {
          runwareModelId,
          deepInfraSchnellId,
          deepInfraTurboId,
        });

        // 1️⃣ Try Runware first (fastest & cheapest)
        try {
          console.log("[GEN] Trying Runware FLUX.1-schnell");
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
          console.error("[GEN] Runware FLUX.1-schnell failed, falling back to DeepInfra Schnell:", err);
        }

        // 2️⃣ Fallback: DeepInfra FLUX.1-schnell (no LoRAs)
        try {
          console.log("[GEN] Trying DeepInfra FLUX.1-schnell");
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
          console.error("[GEN] DeepInfra FLUX.1-schnell failed, falling back to SDXL Turbo:", schnellErr);
        }

        // 3️⃣ Final fallback: DeepInfra SDXL Turbo (ai-forever) WITH LoRAs allowed
        try {
          console.log("[GEN] Trying DeepInfra SDXL Turbo (ai-forever) as final fallback", {
            modelId: deepInfraTurboId,
            hasLoras: !!finalLoras?.length,
          });

          const image = await generateWithDeepInfra({
            prompt,
            width,
            height,
            steps,
            seed,
            modelId: deepInfraTurboId,
            loras: finalLoras,
            allowLoras: !!finalLoras?.length, // SDXL Turbo is LoRA-friendly
          });
          return NextResponse.json({ image });
        } catch (turboErr: any) {
          console.error("[GEN] DeepInfra SDXL Turbo fallback FAILED completely:", turboErr);
          return NextResponse.json(
            { error: turboErr?.message || "All image generation fallbacks failed" },
            { status: 500 }
          );
        }
      } else {
        // All other models use DeepInfra directly
        // Use deepInfraModelId if available, otherwise use finalModel (which is already the DeepInfra ID for LoRA models)

        // Try with LoRAs if allowed, then fallback without LoRAs
        if (allowLoras && finalLoras) {
          console.log("[GEN] DeepInfra final modelId:", deepInfraModelId);
          console.log("[DEBUG] DeepInfra about to call:", deepInfraModelId);
          try {
            const image = await generateWithDeepInfra({
              prompt,
              width,
              height,
              steps,
              seed,
              modelId: deepInfraModelId,
              loras: finalLoras,
              allowLoras: true,
            });
            return NextResponse.json({ image });
          } catch (err) {
            console.error("[GEN] DeepInfra with LoRAs failed, retrying without LoRAs:", err);
            console.log("[GEN] DeepInfra final modelId:", deepInfraModelId);
            console.log("[DEBUG] DeepInfra about to call:", deepInfraModelId);
            const image = await generateWithDeepInfra({
              prompt,
              width,
              height,
              steps,
              seed,
              modelId: deepInfraModelId,
              loras: undefined,
              allowLoras: false,
            });
            return NextResponse.json({ image });
          }
        } else {
          // No LoRAs or LoRAs not allowed
          console.log("[GEN] DeepInfra final modelId:", deepInfraModelId);
          console.log("[DEBUG] DeepInfra about to call:", deepInfraModelId);
          const image = await generateWithDeepInfra({
            prompt,
            width,
            height,
            steps,
            seed,
            modelId: deepInfraModelId,
            loras: undefined,
            allowLoras: false,
          });
          return NextResponse.json({ image });
        }
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
