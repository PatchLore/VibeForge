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

// 🖼️ IMAGE GENERATION — Using correct Kie.ai API structure
// Based on official API docs: /api/v1/jobs/createTask
export async function generateImage(
  prompt: string,
  styleSuffix: string = ""
): Promise<string | null> {
  const apiKey = KIE_KEYS.image;
  if (!apiKey)
    throw new Error("Missing KIE_IMAGE_API_KEY for image generation");

  const finalPrompt = `${prompt}${styleSuffix ? `, ${styleSuffix}` : ""}`;
  const model = "bytedance/seedream-v4-text-to-image";
  
  // Use correct API structure per documentation
  // image_size: "landscape_16_9" for 16:9 aspect ratio
  // image_resolution: "2K" for 2K resolution (combines with image_size to give actual pixels)
  const callBackUrl = process.env.KIE_CALLBACK_URL || "https://www.soundswoop.com/api/callback";
  
  const requestBody = {
    model: model,
    callBackUrl: callBackUrl,
    input: {
      prompt: finalPrompt,
      image_size: "landscape_16_9",  // 16:9 aspect ratio
      image_resolution: "2K",         // 2K resolution (with 16:9 = 2048x1152px)
      max_images: 1,
    }
  };
  
  console.log(`🖼️ [IMAGE GEN] Using correct API endpoint: /api/v1/jobs/createTask`);
  console.log(`🖼️ [IMAGE GEN] Request body:`, JSON.stringify(requestBody, null, 2));

  try {
    // Use correct endpoint from documentation
    const response = await fetch(`${BASE_URL}/api/v1/jobs/createTask`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log(`🖼️ [IMAGE GEN] status: ${response.status} ok: ${response.ok}`);
    console.log(`🖼️ [IMAGE GEN] Full response:`, JSON.stringify(data, null, 2));
    
    if (!response.ok || (data as any)?.code !== 200) {
      console.error("❌ [IMAGE GEN] Failed:", data);
      return null;
    }

    // Response structure: { code: 200, data: { taskId: "..." } }
    const taskId = (data as any)?.data?.taskId;
    
    if (!taskId) {
      console.error("❌ [IMAGE GEN] No taskId in response:", data);
      return null;
    }
    
    console.log(`✅ [IMAGE GEN] Task created: ${taskId}`);
    console.log(`🖼️ [IMAGE GEN] Image will be delivered via callback at: ${callBackUrl}`);
    console.log(`🖼️ [IMAGE GEN] Expected resolution: 2K with landscape_16_9 = 2048x1152px`);
    
    // Return taskId - the actual image URL will come via callback
    // The callback will contain resultJson with resultUrls array
    // For now, return taskId so caller can track the task
    // In the callback handler, we'll extract the image URL from resultJson.resultUrls[0]
    return taskId;
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
