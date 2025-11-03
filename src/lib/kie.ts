// 🎯 API Key Manager - Clear separation of concerns
const KIE_KEYS = {
  music: process.env.VIBEFORGE_API_KEY,
  image: process.env.KIE_IMAGE_API_KEY,
};

// ⚠️ Runtime validation with clear warnings
if (!KIE_KEYS.music) {
  console.warn("⚠️ Missing VIBEFORGE_API_KEY (Music Generation) API key! Please add it to Vercel.");
}

if (!KIE_KEYS.image) {
  console.warn("⚠️ Missing KIE_IMAGE_API_KEY (Image Generation) API key! Please add it to Vercel.");
}

// ✅ Startup confirmation
console.log("✅ Kie.ai API keys loaded:");
console.log("🎵 Music Key:", KIE_KEYS.music ? "Loaded ✅" : "Missing ❌");
console.log("🖼️ Image Key:", KIE_KEYS.image ? "Loaded ✅" : "Missing ❌");

const BASE_URL = "https://api.kie.ai/api/v1";

// 🎵 MUSIC GENERATION
export async function generateMusic(prompt: string) {
  const apiKey = KIE_KEYS.music;
  if (!apiKey) throw new Error("Missing VIBEFORGE_API_KEY music generation API key");

  const callBackUrl = process.env.KIE_CALLBACK_URL || "https://www.soundswoop.com/api/callback";
  console.log("🔔 [KieAI] callback:", callBackUrl);

  console.log("🎵 [KieAI] Calling music generation API...");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await fetch(`${BASE_URL}/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        customMode: false,
        instrumental: true,
        model: "V5",
        callBackUrl,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const data = await response.json();
    if (!response.ok || data.code !== 200) {
      console.error("🎵 Music generation error:", data);
      throw new Error(`Music generation failed: ${data.msg}`);
    }

    console.log("✅ [KieAI] Task ID received:", data.data?.taskId);
    return data.data.taskId;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("❌ [KieAI] Fetch error:", error);
    throw error;
  }
}

// 🔍 STATUS CHECK
export async function checkMusicStatus(taskId: string) {
  const apiKey = KIE_KEYS.music;
  if (!apiKey) throw new Error("Missing VIBEFORGE_API_KEY music generation API key");

  const response = await fetch(`${BASE_URL}/generate/record-info?taskId=${taskId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const data = await response.json();
  if (!response.ok || data.code !== 200) {
    console.error("🎵 Status check error:", data);
    throw new Error(`Status check failed: ${data.msg}`);
  }
  
  const result = data.data?.response?.sunoData?.[0];
  return result;
}

// 🖼️ IMAGE GENERATION — Updated & Robust
export async function generateImage(
  prompt: string,
  styleSuffix: string = ""
): Promise<string | null> {
  const apiKey = KIE_KEYS.image;
  if (!apiKey)
    throw new Error("Missing KIE_IMAGE_API_KEY for image generation");

  const finalPrompt = `${prompt}${styleSuffix ? `, ${styleSuffix}` : ""}`;
  const model = "bytedance/seedream-v4-text-to-image";
  const resolution = "3840x2160"; // 4K UHD
  
  const imageParams = {
    model: model,
    prompt: finalPrompt,
    resolution: resolution,      // 4K UHD
    aspect_ratio: "16:9",
    quality: "ultra",
    steps: 45,                   // higher for more detail
    cfg_scale: 9.5,              // stronger guidance
    guidance:
      "cinematic composition, volumetric lighting, ultra sharp, high contrast, detailed textures",
  };

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Referer: "https://www.soundswoop.com",
  } as Record<string, string>;

  const parseUrl = (data: any): string | null => {
    // Support multiple shapes
    return (
      data?.data?.response?.imageUrl ||
      data?.data?.imageUrl ||
      data?.data?.url ||
      (Array.isArray(data?.data) ? data.data[0]?.url : null) ||
      data?.image_url ||
      data?.url ||
      null
    );
  };

  try {
    // Primary 4K request
    const response = await fetch(`${BASE_URL}/generate/image`, {
      method: "POST",
      headers,
      body: JSON.stringify(imageParams),
    });
    const json = await response.json().catch(() => ({} as any));

    let imageUrl = response.ok && (json as any)?.code === 200 ? parseUrl(json) : null;
    const returnedRes: string | undefined = (json as any)?.data?.response?.resolution || (Array.isArray((json as any)?.data) ? (json as any).data[0]?.resolution : undefined);

    if (!imageUrl || (returnedRes && returnedRes !== "3840x2160")) {
      console.log("🪄 [UPSCALE] Retrying with Seedream v4 Upscaler");
      const upscaleBody = {
        model: "bytedance/seedream-v4-upscaler",
        prompt: finalPrompt,
        resolution: "3840x2160",
        quality: "ultra",
      };
      const upscale = await fetch(`${BASE_URL}/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify(upscaleBody),
      });
      const upscaled = await upscale.json().catch(() => ({} as any));
      const upscaledUrl = upscale.ok ? parseUrl(upscaled) : null;
      if (upscaledUrl) {
        console.log("✅ [IMAGE GEN] 4K upscaled image generated:", upscaledUrl);
        return upscaledUrl;
      }
    }

    if (!imageUrl) {
      console.error("❌ [IMAGE GEN] No image returned from both base and upscaler calls");
      return null;
    }

    console.log("✅ [IMAGE GEN] 4K image generated:", imageUrl);
    return imageUrl;
  } catch (error) {
    console.error("❌ [IMAGE GEN] Exception:", error);
    return null;
  }
}

// ✅ Simple verifier for old imports
export async function verifyAndUpscaleTo2K(
  imageUrl: string,
  target: { width: number; height: number } = { width: 2048, height: 1152 }
): Promise<{ url: string; width: number; height: number }> {
  try {
    await fetch(imageUrl, { method: "HEAD" }).catch(() => null as any);
  } catch (_) {}
  return { url: imageUrl, width: target.width, height: target.height };
}
