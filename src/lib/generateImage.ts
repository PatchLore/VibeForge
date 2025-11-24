/**
 * Shared image generation function
 * Can be called directly from server-side code without HTTP requests
 */

import { generateWithRunware, generateWithDeepInfra } from '@/lib/imageGenerators';
import { LORA_SUPPORTED, MODEL_METADATA } from '@/data/models';

export interface GenerateImageOptions {
  prompt: string;
  modelId?: string;
  width?: number;
  height?: number;
  loras?: Array<{ id: string; scale: number }>;
  steps?: number;
  seed?: number;
}

export async function generateImageDirect(options: GenerateImageOptions): Promise<string> {
  const {
    prompt,
    modelId = 'stabilityai/sdxl-turbo',
    width = 1344,
    height = 768,
    loras = [],
    steps,
    seed,
  } = options;

  // Build loras array
  const lorasArray: Array<{ id: string; scale: number }> = loras || [];

  // Determine provider and final model
  const model = modelId;
  let finalModel = model;
  let provider = "deepinfra";

  // CASE 1 — LoRAs selected but model cannot use them
  if (lorasArray.length > 0 && LORA_SUPPORTED[model] === false) {
    console.warn(`[IMAGE GEN] Model '${model}' does NOT support LoRAs. Switching to SDXL Turbo.`);
    finalModel = "stabilityai/sdxl-turbo";
  } else if (LORA_SUPPORTED[model] === true) {
    finalModel = model;
  }

  // CASE 2 — Seedream XL attempted with LoRAs
  if (finalModel === "seedream-xl" && lorasArray.length > 0) {
    console.warn("[IMAGE GEN] LoRAs removed (Seedream does not support SDXL LoRAs).");
  }

  // CASE 3 — Flux models must never receive LoRAs
  if (finalModel.startsWith("flux-")) {
    // LoRAs already handled above
  }

  // Provider routing
  if (finalModel === "flux-schnell") {
    provider = "runware";
  }

  // Prepare final loras
  const finalLoras = lorasArray.length > 0 ? lorasArray : undefined;
  const allowLoras = finalLoras && LORA_SUPPORTED[finalModel] === true;

  // Get model metadata
  const modelMetadata = MODEL_METADATA[finalModel];
  const deepInfraModelId = modelMetadata?.deepInfraModelId || finalModel;

  console.log("[IMAGE GEN] Generating image:", { finalModel, provider, allowLoras, width, height });

  try {
    if (finalModel === "flux-schnell") {
      // Waterfall: Runware FLUX.1-schnell → DeepInfra FLUX.1-schnell → DeepInfra SDXL Turbo (ai-forever)
      const runwareModelId = modelMetadata?.apiModelId || "runware:101@1";
      const deepInfraSchnellId = modelMetadata?.deepInfraModelId || "black-forest-labs/FLUX.1-schnell";
      const deepInfraTurboId = "ai-forever/sdxl-turbo";

      console.log("[IMAGE GEN] Flux Schnell waterfall start", {
        runwareModelId,
        deepInfraSchnellId,
        deepInfraTurboId,
      });

      // 1️⃣ Try Runware first (fastest & cheapest)
      try {
        console.log("[IMAGE GEN] Trying Runware FLUX.1-schnell");
        return await generateWithRunware({
          prompt,
          width,
          height,
          steps,
          seed,
          modelId: runwareModelId,
        });
      } catch (err) {
        console.error("[IMAGE GEN] Runware FLUX.1-schnell failed, falling back to DeepInfra Schnell:", err);
      }

      // 2️⃣ Fallback: DeepInfra FLUX.1-schnell (no LoRAs)
      try {
        console.log("[IMAGE GEN] Trying DeepInfra FLUX.1-schnell");
        return await generateWithDeepInfra({
          prompt,
          width,
          height,
          steps,
          seed,
          modelId: deepInfraSchnellId,
          loras: undefined,
          allowLoras: false,
        });
      } catch (schnellErr) {
        console.error("[IMAGE GEN] DeepInfra FLUX.1-schnell failed, falling back to SDXL Turbo:", schnellErr);
      }

      // 3️⃣ Final fallback: DeepInfra SDXL Turbo (ai-forever) WITH LoRAs allowed
      try {
        console.log("[IMAGE GEN] Trying DeepInfra SDXL Turbo (ai-forever) as final fallback", {
          modelId: deepInfraTurboId,
          hasLoras: !!finalLoras?.length,
        });

        return await generateWithDeepInfra({
          prompt,
          width,
          height,
          steps,
          seed,
          modelId: deepInfraTurboId,
          loras: finalLoras,
          allowLoras: !!finalLoras?.length, // SDXL Turbo is LoRA-friendly
        });
      } catch (turboErr: any) {
        console.error("[IMAGE GEN] DeepInfra SDXL Turbo fallback FAILED completely:", turboErr);
        throw new Error(turboErr?.message || "All image generation fallbacks failed");
      }
    } else {
      // All other models use DeepInfra directly
      if (allowLoras && finalLoras) {
        try {
          return await generateWithDeepInfra({
            prompt,
            width,
            height,
            steps,
            seed,
            modelId: deepInfraModelId,
            loras: finalLoras,
            allowLoras: true,
          });
        } catch (err) {
          console.error("[IMAGE GEN] DeepInfra with LoRAs failed, retrying without LoRAs:", err);
          return await generateWithDeepInfra({
            prompt,
            width,
            height,
            steps,
            seed,
            modelId: deepInfraModelId,
            loras: undefined,
            allowLoras: false,
          });
        }
      } else {
        return await generateWithDeepInfra({
          prompt,
          width,
          height,
          steps,
          seed,
          modelId: deepInfraModelId,
          loras: undefined,
          allowLoras: false,
        });
      }
    }
  } catch (error: any) {
    console.error("[IMAGE GEN] Fatal error:", error);
    throw new Error(error?.message || "Image generation failed");
  }
}

