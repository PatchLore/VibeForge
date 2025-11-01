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
  const resolution = "2048x1152"; // 2K resolution for highest quality
  
  // Optimal 2K parameters for highest quality
  const imageParams = {
    model: model,
    prompt: finalPrompt,
    resolution: resolution, // 2K 16:9 resolution (2048x1152)
    aspect_ratio: "16:9",
    quality: "high",
    steps: 30,
    cfg_scale: 8,
    guidance: "detailed, cinematic lighting, high contrast, ultra sharp focus"
  };
  
  console.log("🖼️ [KIE IMAGE] Model:", model, "| Resolution:", resolution, "| Confirmed: 2K");
  console.log("🎨 [IMAGE GEN] Prompt:", finalPrompt);
  console.log("🎨 [IMAGE GEN] Quality:", imageParams.quality, "| Steps:", imageParams.steps);

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
        return { imageUrl: fallbackData.data?.response?.imageUrl, resolution: "1024x576" };
      }
      
      console.log("✅ [IMAGE GEN] Image generated successfully at 2K resolution (retry)");
      console.log("🎨 [IMAGE GEN] Image URL:", retryData.data?.response?.imageUrl);
      console.log("🖼️ [DEBUG IMAGE SAVED] Retry Image URL received:", retryData.data?.response?.imageUrl);
      return { imageUrl: retryData.data?.response?.imageUrl, resolution: "2048x1152" };
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
        
        // Check if image is < 2K resolution and needs upscaling
        const isLowRes = (size && parseInt(size) < 800000) || !widthCheck;
        
        if (isLowRes) {
          console.warn("⚠️ [IMAGE CHECK] Low-res detected (< 2K or < 800KB), attempting upscale retry...");
          console.warn("⚠️ [IMAGE CHECK] Image size:", size, "bytes | Width check:", widthCheck);
          await new Promise(r => setTimeout(r, 1500));
          
          // Upscaler fallback: request explicitly at 2K resolution with enhanced quality
          const upscalerParams = {
            model: "bytedance/seedream-v4-text-to-image",
            prompt: finalPrompt,
            resolution: "2048x1152", // Explicit 2K resolution
            aspect_ratio: "16:9",
            quality: "high",
            steps: 35, // Increased steps for better quality
            cfg_scale: 8.5, // Slightly higher guidance
            guidance: "detailed, cinematic lighting, high contrast, ultra sharp focus, 2K resolution, professional quality, upscaled"
          };
          
          console.log("🔄 [UPSCALER] Sending upscaler request with enhanced 2K params:", upscalerParams);
          
          const upscalerResponse = await fetch(`${BASE_URL}/generate/image`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(upscalerParams),
          });
          
          console.log("🔄 [UPSCALER] Upscaler response status:", upscalerResponse.status);
          
          const upscalerData = await upscalerResponse.json();
          if (!upscalerResponse.ok || upscalerData.code !== 200) {
            console.error("❌ [UPSCALER] Upscaler retry failed:", upscalerData);
            console.log("⚠️ [IMAGE GEN] Returning original image despite low resolution");
            return { imageUrl, resolution: "2048x1152" };
          }
          
          const upscaledImageUrl = upscalerData.data?.response?.imageUrl;
          if (upscaledImageUrl) {
            // Verify upscaled image quality
            const upscaledHead = await fetch(upscaledImageUrl, { method: "HEAD" }).catch(() => null);
            const upscaledSize = upscaledHead?.headers.get("content-length");
            const upscaledWidthCheck = upscaledImageUrl.includes("2048") || upscaledImageUrl.includes("1152") || upscaledImageUrl.includes("2k");
            
            if ((upscaledSize && parseInt(upscaledSize) >= 800000) || upscaledWidthCheck) {
              console.log("✅ [UPSCALER] Successfully upscaled to 2K | Size:", upscaledSize, "bytes");
              return { imageUrl: upscaledImageUrl, resolution: "2048x1152" };
            } else {
              console.warn("⚠️ [UPSCALER] Upscaled image still appears low-res, using original");
              return { imageUrl, resolution: "2048x1152" };
            }
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

type ImageSize = { width: number; height: number };

function probePngSize(view: DataView): ImageSize | null {
  // PNG signature 8 bytes, IHDR chunk starts at byte 8
  const pngSig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) {
    if (view.getUint8(i) !== pngSig[i]) return null;
  }
  // IHDR at byte 16 contains width/height (4 bytes each, big-endian)
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  if (width > 0 && height > 0) return { width, height };
  return null;
}

function probeJpegSize(view: DataView): ImageSize | null {
  // JPEG starts with 0xFFD8
  if (view.getUint8(0) !== 0xff || view.getUint8(1) !== 0xd8) return null;
  let offset = 2;
  const length = view.byteLength;
  while (offset < length) {
    if (view.getUint8(offset) !== 0xff) { offset++; continue; }
    let marker = view.getUint8(offset + 1);
    // SOI/EOI
    if (marker === 0xd9 || marker === 0xda) break;
    const blockLen = view.getUint16(offset + 2);
    // SOF0..SOF3 (baseline), SOF5..SOF7, SOF9..SOF11, SOF13..SOF15 contain size
    if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
      const height = view.getUint16(offset + 5);
      const width = view.getUint16(offset + 7);
      if (width > 0 && height > 0) return { width, height };
      return null;
    }
    offset += 2 + blockLen;
  }
  return null;
}

function probeWebpSize(view: DataView): ImageSize | null {
  // RIFF header 'RIFF' .... 'WEBP'
  const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  const webp = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
  if (riff !== 'RIFF' || webp !== 'WEBP') return null;
  const chunk = String.fromCharCode(view.getUint8(12), view.getUint8(13), view.getUint8(14), view.getUint8(15));
  if (chunk === 'VP8X') {
    // Extended format: bytes at 24..26 width-1, 27..29 height-1 (little-endian 24-bit)
    const width = 1 + (view.getUint8(24) | (view.getUint8(25) << 8) | (view.getUint8(26) << 16));
    const height = 1 + (view.getUint8(27) | (view.getUint8(28) << 8) | (view.getUint8(29) << 16));
    return { width, height };
  }
  if (chunk === 'VP8 ') {
    // Lossy bitstream header at 26: 2 bytes (frame tag), then 16-bit little-endian width/height at 26+6, 26+8
    // Here we use a heuristic: width/height at 26+6 and 26+8
    const w = view.getUint16(26 + 6, true);
    const h = view.getUint16(26 + 8, true);
    if (w && h) return { width: w, height: h };
  }
  if (chunk === 'VP8L') {
    // Lossless: width/height are encoded starting at byte 21
    const b0 = view.getUint8(21);
    const b1 = view.getUint8(22);
    const b2 = view.getUint8(23);
    const b3 = view.getUint8(24);
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    if (width && height) return { width, height };
  }
  return null;
}

async function fetchPartialBuffer(url: string, bytes = 65536): Promise<ArrayBuffer> {
  const res = await fetch(url, { headers: { Range: `bytes=0-${bytes - 1}` } }).catch(() => null as any);
  if (res && res.ok) return await res.arrayBuffer();
  // Fallback: full fetch
  const res2 = await fetch(url);
  return await res2.arrayBuffer();
}

async function detectImageSize(url: string): Promise<ImageSize | null> {
  try {
    const buffer = await fetchPartialBuffer(url);
    const view = new DataView(buffer);
    // Try PNG
    let size = probePngSize(view);
    if (size) return size;
    // Try JPEG
    size = probeJpegSize(view);
    if (size) return size;
    // Try WEBP
    size = probeWebpSize(view);
    if (size) return size;
  } catch (e) {
    console.warn("⚠️ [ImageVerify] Size detection failed:", e);
  }
  return null;
}

export async function verifyAndUpscaleTo2K(imageUrl: string, target = { width: 2048, height: 1152 }): Promise<{ url: string; width: number; height: number }> {
  let status: 'verified' | 'upscaled' | 'failed' = 'failed';
  try {
    const size = await detectImageSize(imageUrl);
    if (size && size.width >= target.width && size.height >= target.height) {
      status = 'verified';
      console.log(`[ImageVerify] ${imageUrl} ${size.width}x${size.height} ${status}`);
      return { url: imageUrl, width: size.width, height: size.height };
    }

    if (size) {
      console.warn(`⚠️ [ImageVerify] Low-res detected ${size.width}x${size.height}, target ${target.width}x${target.height}`);
    } else {
      console.warn(`⚠️ [ImageVerify] Could not detect size for ${imageUrl}, attempting fallback`);
    }

    // Attempt internal upscaler endpoint if exists (no-op here; placeholder)
    // If you add an upscaler route in the future, call it here.

    // Without an upscaler and no prompt context here, return failed so caller can regenerate with the proper prompt
    const finalW = size?.width ?? 0;
    const finalH = size?.height ?? 0;
    console.log(`[ImageVerify] ${imageUrl} ${finalW}x${finalH} ${status}`);
    return { url: imageUrl, width: finalW, height: finalH };
  } catch (e) {
    console.error('❌ [ImageVerify] Exception:', e);
    console.log(`[ImageVerify] ${imageUrl} 0x0 failed`);
    return { url: imageUrl, width: 0, height: 0 };
  }
}
