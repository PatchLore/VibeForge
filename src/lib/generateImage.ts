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
  console.log("🎨 [GEN] Start:", { prompt, width, height });

  // 1 — Runware first
  try {
    console.log("🎨 Trying Runware → FLUX.1-schnell");
    return await generateRunwareFLUX({
      prompt,
      width,
      height,
      steps,
      seed,
    });
  } catch (e) {
    console.error("❌ Runware failed:", e);
  }

  // 2 — DeepInfra FLUX.1-schnell fallback
  try {
    console.log("🎨 Trying DeepInfra → FLUX.1-schnell");
    return await generateDeepInfraFLUX({
      prompt,
      width,
      height,
      steps,
      seed,
    });
  } catch (e) {
    console.error("❌ DeepInfra FLUX failed:", e);
  }

  // 3 — Final fallback SDXL Turbo
  console.log("🎨 Trying DeepInfra → SDXL-Turbo (final fallback)");

  return await generateDeepInfraSDXLTurbo({
    prompt,
    width,
    height,
    steps,
    seed,
  });
}
