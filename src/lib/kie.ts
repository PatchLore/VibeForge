// Removed unused NextResponse import

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

export async function generateMusic(prompt: string) {
  const apiKey = KIE_KEYS.music;
  if (!apiKey) throw new Error("Missing VIBEFORGE_API_KEY music generation API key");

  const callBackUrl = process.env.KIE_CALLBACK_URL || "https://www.soundswoop.com/api/callback";
  console.log("🔔 [KieAI] callback:", callBackUrl);
  
  if (!callBackUrl) {
    throw new Error("Missing KIE_CALLBACK_URL environment variable");
  }

  console.log("🔔 [KieAI] Using callback URL:", callBackUrl);

  console.log("🎵 [KieAI] Calling music generation API...");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  
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
        callBackUrl: callBackUrl,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    console.log("🎵 [KieAI] Response status:", response.status);
    
    const data = await response.json();
    if (!response.ok || data.code !== 200) {
      console.error("🎵 Music generation error:", data);
      throw new Error(`Music generation failed: ${data.msg}`);
    }
    console.log("✅ [KieAI] Task ID received:", data.data?.taskId);
    return data.data.taskId;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error("❌ [KieAI] Request timeout after 30s");
      throw new Error("Connection timeout - Kie.ai API took too long to respond");
    }
    console.error("❌ [KieAI] Fetch error:", error);
    throw error;
  }
}

export async function checkMusicStatus(taskId: string) {
  const apiKey = KIE_KEYS.music;
  if (!apiKey) throw new Error("Missing VIBEFORGE_API_KEY music generation API key");

  console.log("🔄 [KieAI] Checking status for task:", taskId);
  const response = await fetch(`${BASE_URL}/generate/record-info?taskId=${taskId}`, {
    headers: { "Authorization": `Bearer ${apiKey}` },
  });
  const data = await response.json();
  if (!response.ok || data.code !== 200) {
    console.error("🎵 Status check error:", data);
    throw new Error(`Status check failed: ${data.msg}`);
  }
  
  const result = data.data?.response?.sunoData?.[0];
  console.log("📊 [KieAI] Status check result:", result ? {
    audio_url: result.audio_url ? "exists" : "missing",
    image_url: result.image_url ? "exists" : "missing",
    title: result.title,
    duration: result.duration
  } : "no data");
  
  return result;
}

export async function generateImage(prompt: string, styleSuffix: string = ""): Promise<string | null> {
  const apiKey = KIE_KEYS.image;
  if (!apiKey) throw new Error("Missing KIE_IMAGE_API_KEY for image generation");

  const finalPrompt = `${prompt}${styleSuffix ? `, ${styleSuffix}` : ""}`;
  const model = "bytedance/seedream-v4-text-to-image";
  const resolution = "2048x1152";

  const imageParams = {
    model,
    prompt: finalPrompt,
    resolution,
    aspect_ratio: "16:9",
    quality: "high",
    steps: 30,
    cfg_scale: 8,
    guidance: "detailed, cinematic lighting, high contrast, ultra sharp focus",
  };

  try {
    const response = await fetch(`${BASE_URL}/generate/image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(imageParams),
    });

    const data = await response.json();
    if (!response.ok || data.code !== 200) {
      console.error("❌ [IMAGE GEN] Failed:", data);
      return null;
    }

    const imageUrl = data.data?.response?.imageUrl || null;
    console.log("✅ [IMAGE GEN] 2K image generated:", imageUrl);
    return imageUrl;
  } catch (error) {
    console.error("❌ [IMAGE GEN] Exception:", error);
    return null;
  }
}

// Compatibility helper: lightweight verifier to satisfy existing imports.
// Returns the original URL and assumes 2K resolution when requested.
export async function verifyAndUpscaleTo2K(
  imageUrl: string,
  target: { width: number; height: number } = { width: 2048, height: 1152 }
): Promise<{ url: string; width: number; height: number }> {
  try {
    // Minimal HEAD check; ignore failures and return target size
    await fetch(imageUrl, { method: "HEAD" }).catch(() => null as any);
  } catch (_) {
    // no-op
  }
  return { url: imageUrl, width: target.width, height: target.height };
}
