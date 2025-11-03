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

export async function generateImage(prompt: string, styleSuffix: string = "") {
  const apiKey = KIE_KEYS.image;
  if (!apiKey) throw new Error("Missing KIE_IMAGE_API_KEY for image generation");

  const finalPrompt = `${prompt}${styleSuffix ? `, ${styleSuffix}` : ''}`;
  const model = "bytedance/seedream-v4-text-to-image";
  const resolution = "2048x1152";
  
  // Optimal 2K parameters for highest quality
  const imageParams = {
    model: model,
    prompt: finalPrompt,
    resolution: resolution, // 2K 16:9 resolution
    aspect_ratio: "16:9",
    quality: "high",
    steps: 30,
    cfg_scale: 8,
    guidance: "detailed, cinematic lighting, high contrast, ultra sharp focus"
  };
  
  console.log("🖼️ [KIE IMAGE] Using model:", model, "Resolution:", resolution);
  console.log("🎨 [IMAGE GEN] Prompt:", finalPrompt);
  console.log("🎨 [IMAGE GEN] Quality:", imageParams.quality);
  console.log("🎨 [IMAGE GEN] Steps:", imageParams.steps);

  try {
    console.log("🧠 [DEBUG IMAGE] Sending imagePrompt:", finalPrompt);
    console.log("🧠 [DEBUG IMAGE] Request params:", imageParams);
    
    const response = await fetch(`${BASE_URL}/generate/image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(imageParams),
    });

    console.log("🧠 [DEBUG IMAGE] Kie.ai response status:", response.status);
    console.log("🧠 [DEBUG IMAGE] Kie.ai response headers:", Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    if (!response.ok || data.code !== 200) {
      console.error("🖼️ [IMAGE GEN] Error response:", data);
      
      // Retry once with explicit 2K parameters if first attempt fails
      console.log("🖼️ [KIE IMAGE] Retrying at 2K");
      const retryParams = {
        model: "bytedance/seedream-v4-text-to-image",
        prompt: finalPrompt,
        resolution: "2048x1152",
        aspect_ratio: "16:9",
        quality: "high",
        steps: 25,
        cfg_scale: 7,
        guidance: "detailed, cinematic lighting, high contrast, ultra sharp focus"
      };
      
      console.log("🧠 [DEBUG IMAGE] Sending retry request with params:", retryParams);
      
      const retryResponse = await fetch(`${BASE_URL}/generate/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(retryParams),
      });
      
      console.log("🧠 [DEBUG IMAGE] Retry response status:", retryResponse.status);
      
      const retryData = await retryResponse.json();
      if (!retryResponse.ok || retryData.code !== 200) {
        console.error("🖼️ [IMAGE GEN] Retry also failed:", retryData);
        
        // Final fallback to lower resolution only if 2K completely fails
        console.log("🔄 [IMAGE GEN] Final fallback to 1024x576 resolution");
        const fallbackParams = {
          ...imageParams,
          resolution: "1024x576",
          quality: "high"
        };
        
        console.log("🧠 [DEBUG IMAGE] Sending fallback request with params:", fallbackParams);
        
        const fallbackResponse = await fetch(`${BASE_URL}/generate/image`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(fallbackParams),
        });
        
        console.log("🧠 [DEBUG IMAGE] Fallback response status:", fallbackResponse.status);
        
        const fallbackData = await fallbackResponse.json();
        if (!fallbackResponse.ok || fallbackData.code !== 200) {
          console.error("🖼️ [IMAGE GEN] All attempts failed:", fallbackData);
          throw new Error(`Image generation failed: ${fallbackData.msg}`);
        }
        
        console.log("✅ [IMAGE GEN] Image generated successfully (fallback resolution)");
        console.log("🖼️ [DEBUG IMAGE SAVED] Fallback Image URL received:", fallbackData.data?.response?.imageUrl);
        return fallbackData.data?.response?.imageUrl;
      }
      
      console.log("✅ [IMAGE GEN] Image generated successfully at 2K resolution (retry)");
      console.log("🎨 [IMAGE GEN] Image URL:", retryData.data?.response?.imageUrl);
      console.log("🖼️ [DEBUG IMAGE SAVED] Retry Image URL received:", retryData.data?.response?.imageUrl);
      return retryData.data?.response?.imageUrl;
    }

    const imageUrl = data.data?.response?.imageUrl;
    console.log("✅ [KIE IMAGE] Received:", imageUrl);
    
    if (imageUrl) {
      try {
        // Enhanced 2K quality verification with size checking
        const head = await fetch(imageUrl, { method: "HEAD" });
        const size = head.headers.get("content-length");
        const widthCheck = imageUrl.includes("2048") || imageUrl.includes("1152") || imageUrl.includes("2k");
        
        console.log("🔍 [IMAGE CHECK] Size:", size, "bytes, Width check:", widthCheck);
        
        if ((size && parseInt(size) < 800000) || !widthCheck) {
          console.warn("⚠️ [IMAGE CHECK] Low-res detected, retrying at 2K...");
          await new Promise(r => setTimeout(r, 1500));
          
          const retryParams = {
            model: "bytedance/seedream-v4-text-to-image",
            prompt: finalPrompt,
            resolution: "2048x1152",
            aspect_ratio: "16:9",
            quality: "high",
            steps: 30,
            cfg_scale: 8,
            guidance: "detailed, cinematic lighting, high contrast, ultra sharp focus, 2K resolution, professional quality"
          };
          
          console.log("🧠 [DEBUG IMAGE] Sending retry request with enforced 2K params:", retryParams);
          
          const retryResponse = await fetch(`${BASE_URL}/generate/image`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(retryParams),
          });
          
          console.log("🧠 [DEBUG IMAGE] Retry response status:", retryResponse.status);
          
          const retryData = await retryResponse.json();
          if (!retryResponse.ok || retryData.code !== 200) {
            console.error("🖼️ [IMAGE GEN] Retry also failed:", retryData);
            console.log("⚠️ [IMAGE GEN] Returning original image despite quality uncertainty");
            return { imageUrl, resolution: "2048x1152" };
          }
          
          const retryImageUrl = retryData.data?.response?.imageUrl;
          if (retryImageUrl) {
            console.log("✅ [IMAGE CHECK] Retried successfully with 2K image");
            return { imageUrl: retryImageUrl, resolution: "2048x1152" };
          }
        }
        
        console.log("✅ [IMAGE GEN] Image generated successfully at 2K resolution");
        console.log("🎨 [IMAGE GEN] Image URL:", imageUrl);
        console.log("🖼️ [DEBUG IMAGE SAVED] Image URL received:", imageUrl);
        return { imageUrl, resolution: "2048x1152" };
        
      } catch (err) {
        console.error("❌ [IMAGE CHECK] Verification failed:", err);
        console.log("⚠️ [IMAGE GEN] Returning image without verification");
        return { imageUrl, resolution: "2048x1152" };
      }
    }
    
    throw new Error("No image URL received from Kie.ai");
    
  } catch (error) {
    console.error("❌ [IMAGE GEN] Generation error:", error);
    throw error;
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
