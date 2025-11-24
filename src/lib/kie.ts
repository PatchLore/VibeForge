// 🎯 API Key Manager - Clear separation of concerns
// Note: Image generation now uses /api/generate (Runware/DeepInfra), not Kie.ai
const KIE_KEYS = {
  music: process.env.VIBEFORGE_API_KEY,
};

// ⚠️ Runtime validation with clear warnings
if (!KIE_KEYS.music) {
  console.warn("⚠️ Missing VIBEFORGE_API_KEY (Music Generation) API key! Please add it to Vercel.");
}

// ✅ Startup confirmation
console.log("✅ Kie.ai API keys loaded:");
console.log("🎵 Music Key:", KIE_KEYS.music ? "Loaded ✅" : "Missing ❌");

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

// 🖼️ IMAGE GENERATION — REMOVED
// Image generation now uses /api/generate (Runware/DeepInfra) instead of Kie.ai
// This function has been removed. Use /api/generate endpoint for image generation.

// 🖼️ Get actual image dimensions by fetching and parsing image metadata
// Works in Node.js by parsing image binary headers
export async function getImageDimensions(
  imageUrl: string
): Promise<{ width: number; height: number } | null> {
  try {
    // Fetch the image to get its actual dimensions
    const response = await fetch(imageUrl, { method: "GET" });
    if (!response.ok) {
      console.error(`❌ [IMAGE DIM] Failed to fetch image: ${response.status}`);
      return null;
    }

    // Get image as array buffer for parsing
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Check Content-Type to determine format
    const contentType = response.headers.get("content-type") || "";
    
    let width = 0;
    let height = 0;
    
    // Parse JPEG (starts with FF D8)
    if (contentType.includes("jpeg") || contentType.includes("jpg") || 
        (buffer[0] === 0xFF && buffer[1] === 0xD8)) {
      // JPEG: Look for SOF markers (FF C0, FF C1, FF C2, etc.)
      let i = 2;
      while (i < buffer.length - 8) {
        if (buffer[i] === 0xFF && buffer[i + 1] >= 0xC0 && buffer[i + 1] <= 0xC3) {
          height = (buffer[i + 5] << 8) | buffer[i + 6];
          width = (buffer[i + 7] << 8) | buffer[i + 8];
          break;
        }
        i++;
      }
    }
    // Parse PNG (starts with 89 50 4E 47)
    else if (contentType.includes("png") || 
             (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47)) {
      // PNG: Width and height are at bytes 16-23
      if (buffer.length >= 24) {
        width = buffer.readUInt32BE(16);
        height = buffer.readUInt32BE(20);
      }
    }
    // Parse WebP (starts with RIFF...WEBP)
    else if (contentType.includes("webp") || 
             (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
              buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50)) {
      // WebP: Look for VP8 or VP8L chunk
      if (buffer.length >= 30) {
        // VP8 format (simple format)
        if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x20) {
          width = ((buffer[26] | (buffer[27] << 8)) & 0x3FFF) + 1;
          height = ((buffer[28] | (buffer[29] << 8)) & 0x3FFF) + 1;
        }
        // VP8L format (lossless)
        else if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x4C) {
          const bits = buffer[21];
          width = (bits & 0x3F) + 1;
          height = ((bits >> 6) | ((buffer[20] & 0xF) << 2)) + 1;
        }
      }
    }
    
    if (width > 0 && height > 0) {
      console.log(`🖼️ [IMAGE DIM] Image dimensions: ${width}x${height}`);
      return { width, height };
    } else {
      console.warn(`⚠️ [IMAGE DIM] Could not parse dimensions from image: ${imageUrl}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ [IMAGE DIM] Exception getting dimensions:`, error);
    return null;
  }
}

// 🖼️ Get image dimensions from a Buffer (server-side)
export async function getImageDimensionsFromBuffer(
  buffer: Buffer
): Promise<{ width: number; height: number } | null> {
  try {
    let width = 0;
    let height = 0;

    // JPEG (FF D8)
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let i = 2;
      while (i < buffer.length - 8) {
        if (buffer[i] === 0xFF && buffer[i + 1] >= 0xC0 && buffer[i + 1] <= 0xC3) {
          height = (buffer[i + 5] << 8) | buffer[i + 6];
          width = (buffer[i + 7] << 8) | buffer[i + 8];
          break;
        }
        i++;
      }
    }
    // PNG (89 50 4E 47)
    else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      if (buffer.length >= 24) {
        width = buffer.readUInt32BE(16);
        height = buffer.readUInt32BE(20);
      }
    }
    // WebP (RIFF .... WEBP)
    else if (
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    ) {
      if (buffer.length >= 30) {
        // VP8
        if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x20) {
          width = ((buffer[26] | (buffer[27] << 8)) & 0x3FFF) + 1;
          height = ((buffer[28] | (buffer[29] << 8)) & 0x3FFF) + 1;
        }
        // VP8L
        else if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x4C) {
          const bits = buffer[21];
          width = (bits & 0x3F) + 1;
          height = ((bits >> 6) | ((buffer[20] & 0xF) << 2)) + 1;
        }
      }
    }

    if (width > 0 && height > 0) {
      return { width, height };
    }
    return null;
  } catch (e) {
    console.error('❌ [IMAGE DIM BUFFER] Exception:', e);
    return null;
  }
}

// ✅ Simple verifier for old imports (kept for backward compatibility)
export async function verifyAndUpscaleTo2K(
  imageUrl: string,
  target: { width: number; height: number } = { width: 2048, height: 1152 }
): Promise<{ url: string; width: number; height: number }> {
  try {
    await fetch(imageUrl, { method: "HEAD" }).catch(() => null as any);
  } catch (_) {}
  return { url: imageUrl, width: target.width, height: target.height };
}
