import {
  generateRunwareFLUX,
  generateDeepInfraFLUX,
  generateDeepInfraSDXLTurbo,
} from "@/lib/imageGenerators";

export async function generateImageDirect({
  prompt,
  width = 1344,
  height = 768,
  steps,
  seed,
}: {
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
}) {
  console.log("🎨 [GEN] Start:", { prompt: prompt.substring(0, 100), width, height, steps, seed });

  // 1 — Runware first
  try {
    console.log("🎨 [GEN] Attempting Runware → FLUX.1-schnell");
    const runwareResult = await generateRunwareFLUX({
      prompt,
      width,
      height,
      steps,
      seed,
    });
    console.log("✅ [GEN] Runware succeeded, result length:", runwareResult?.length || 0);
    return runwareResult;
  } catch (e: any) {
    console.error("❌ [GEN] Runware failed:", e?.message || e);
    console.error("❌ [GEN] Runware error stack:", e?.stack);
  }

  // 2 — DeepInfra FLUX.1-schnell fallback
  try {
    console.log("🎨 [GEN] Attempting DeepInfra → FLUX.1-schnell");
    const fluxResult = await generateDeepInfraFLUX({
      prompt,
      width,
      height,
      steps,
      seed,
    });
    console.log("✅ [GEN] DeepInfra FLUX succeeded, result length:", fluxResult?.length || 0);
    return fluxResult;
  } catch (e: any) {
    console.error("❌ [GEN] DeepInfra FLUX failed:", e?.message || e);
    console.error("❌ [GEN] DeepInfra FLUX error stack:", e?.stack);
  }

  // 3 — Final fallback SDXL Turbo
  console.log("🎨 [GEN] Attempting DeepInfra → SDXL-Turbo (final fallback)");
  try {
    const turboResult = await generateDeepInfraSDXLTurbo({
      prompt,
      width,
      height,
      steps,
      seed,
    });
    console.log("✅ [GEN] DeepInfra SDXL Turbo succeeded, result length:", turboResult?.length || 0);
    return turboResult;
  } catch (e: any) {
    console.error("❌ [GEN] DeepInfra SDXL Turbo FAILED (final fallback):", e?.message || e);
    console.error("❌ [GEN] DeepInfra SDXL Turbo error stack:", e?.stack);
    throw new Error(`All image generation fallbacks failed: ${e?.message || e}`);
  }
}
