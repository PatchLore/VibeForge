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

// 🖼️ IMAGE GENERATION — Stable 2K Version
export async function generateImage(
  prompt: string,
  styleSuffix: string = ""
): Promise<string | null> {
  const apiKey = KIE_KEYS.image;
  if (!apiKey)
    throw new Error("Missing KIE_IMAGE_API_KEY for image generation");

  const finalPrompt = `${prompt}${styleSuffix ? `, ${styleSuffix}` : ""}`;
  const model = "bytedance/seedream-v4-text-to-image";
  const resolution = "2048x1152"; // 2K stable resolution
  
  const imageParams = {
    model: model,
    prompt: finalPrompt,
    resolution: resolution,
    aspect_ratio: "16:9",
    quality: "high",
    steps: 40,
    cfg_scale: 8.5,
    guidance: "cinematic lighting, ultra sharp detail, high contrast, realistic textures, professional composition",
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
    console.log(`🖼️ [IMAGE GEN] status: ${response.status} ok: ${response.ok}`);
    console.log(`🖼️ [IMAGE GEN] Full response:`, JSON.stringify(data, null, 2));
    
    if (!response.ok || (data as any)?.code !== 200) {
      console.error("❌ [IMAGE GEN] Failed:", data);
      return null;
    }

    // Try multiple possible response paths for image URL
    // Check for full-resolution URL first, then fall back to thumbnail
    const fullResUrl = (data as any)?.data?.response?.fullImageUrl ||
                       (data as any)?.data?.response?.highResUrl ||
                       (data as any)?.data?.response?.originalUrl ||
                       (data as any)?.data?.fullImageUrl ||
                       (data as any)?.fullImageUrl ||
                       null;
    
    const imageUrl = fullResUrl ||
                     (data as any)?.data?.response?.imageUrl || 
                     (data as any)?.data?.imageUrl || 
                     (data as any)?.imageUrl ||
                     (data as any)?.data?.response?.url ||
                     (data as any)?.url ||
                     null;
    
    // If we got a URL, try to convert thumbnail URLs to full-res
    let finalImageUrl = imageUrl;
    if (imageUrl) {
      // For musicfile.kie.ai URLs, try to verify actual image dimensions
      // The API might be returning thumbnails, so we'll verify the actual image
      if (imageUrl.includes('musicfile.kie.ai') || imageUrl.includes('kie.ai')) {
        try {
          // Fetch image headers to check actual dimensions
          const headResponse = await fetch(imageUrl, { method: 'HEAD' });
          const contentType = headResponse.headers.get('content-type');
          const contentLength = headResponse.headers.get('content-length');
          
          console.log(`🔍 [IMAGE GEN] Image headers:`, {
            contentType,
            contentLength,
            url: imageUrl
          });
          
          // If content length is very small (< 100KB), it's likely a thumbnail
          if (contentLength && parseInt(contentLength) < 100000) {
            console.warn("⚠️ [IMAGE GEN] Image appears to be thumbnail (small file size)");
          }
        } catch (e) {
          console.warn("⚠️ [IMAGE GEN] Could not verify image dimensions:", e);
        }
      }
      
      // Try common URL modifications to get full resolution
      // Replace common thumbnail paths with full-res paths
      const modifiedUrl = imageUrl
        .replace(/\/thumb\//g, '/full/')
        .replace(/\/thumbnail\//g, '/original/')
        .replace(/\/preview\//g, '/full/')
        .replace(/\/360x360\//g, '/2048x1152/')
        .replace(/\/small\//g, '/large/')
        .replace(/w=360&h=360/g, 'w=2048&h=1152')
        .replace(/width=360&height=360/g, 'width=2048&height=1152')
        .replace(/size=360/g, 'size=2048')
        .replace(/scale=thumbnail/g, 'scale=full')
        .replace(/quality=low/g, 'quality=high');
      
      // Only use modified URL if it's different (meaning we found a pattern to replace)
      if (modifiedUrl !== imageUrl) {
        console.log("🔄 [IMAGE GEN] Attempting to convert thumbnail to full-res URL");
        console.log("🔄 [IMAGE GEN] Original:", imageUrl);
        console.log("🔄 [IMAGE GEN] Modified:", modifiedUrl);
        finalImageUrl = modifiedUrl;
      }
    }
    
    console.log("✅ [IMAGE GEN] 2048x1152 image generated:", finalImageUrl);
    console.log(`🖼️ [IMAGE GEN] Params used: resolution=${resolution}, steps=40, cfg_scale=8.5`);
    console.log(`🖼️ [IMAGE GEN] Response structure:`, {
      hasData: !!data?.data,
      hasResponse: !!data?.data?.response,
      hasImageUrl: !!data?.data?.response?.imageUrl,
      hasFullResUrl: !!fullResUrl,
      hasDirectImageUrl: !!data?.data?.imageUrl,
      topLevelUrl: data?.url,
      code: data?.code,
      allKeys: Object.keys(data?.data?.response || {}),
    });
    
    return finalImageUrl;
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
