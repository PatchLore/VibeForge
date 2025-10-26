// Removed unused NextResponse import

// 🎯 API Key Manager - Clear separation of concerns
const API_KEYS = {
  music: process.env.VIBEFORGE_API_KEY,
  image: process.env.KIE_IMAGE_API_KEY,
};

// ⚠️ Runtime validation with clear warnings
if (!API_KEYS.music) {
  console.warn("⚠️ Missing VIBEFORGE_API_KEY (Music Generation) API key! Please add it to Vercel.");
}

if (!API_KEYS.image) {
  console.warn("⚠️ Missing KIE_IMAGE_API_KEY (Image Generation) API key! Please add it to Vercel.");
}

// ✅ Startup confirmation
console.log("✅ API keys loaded:");
console.log("🎵 Music Key:", API_KEYS.music ? "Loaded ✅" : "Missing ❌");
console.log("🖼️ Image Key:", API_KEYS.image ? "Loaded ✅" : "Missing ❌");

const BASE_URL = "https://api.kie.ai/api/v1";

export async function generateMusic(prompt: string) {
  const apiKey = API_KEYS.music;
  if (!apiKey) throw new Error("Missing VIBEFORGE_API_KEY music generation API key");

  console.log("🔍 KIE_CALLBACK_URL env var:", process.env.KIE_CALLBACK_URL);
  const callbackUrl = process.env.KIE_CALLBACK_URL || "https://www.soundswoop.com/api/callback";
  
  const requestBody = {
    prompt,
    customMode: false,
    instrumental: true,
    model: "V5",
    callBackUrl: callbackUrl,
  };

  console.log("🎵 ========== MUSIC GENERATION REQUEST ==========");
  console.log("📡 API Endpoint:", `${BASE_URL}/generate`);
  console.log("📡 Callback URL (active):", callbackUrl);
  console.log("📝 Prompt:", prompt);
  console.log("📦 Request Body:", JSON.stringify(requestBody, null, 2));
  console.log("⏰ Timestamp:", new Date().toISOString());

  try {
    const response = await fetch(`${BASE_URL}/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("📡 API Response Status:", response.status);

    const data = await response.json();
    console.log("📡 API Response Data:", JSON.stringify(data, null, 2));
    
    if (!response.ok || data.code !== 200) {
      console.error("❌ Music generation error:", data);
      throw new Error(`Music generation failed: ${data.msg}`);
    }
    
    const taskId = data.data.taskId;
    console.log("✅ Task ID received:", taskId);
    console.log("🎵 ========== END GENERATION REQUEST ==========");
    
    return taskId;
  } catch (error) {
    console.error("💥 Error in generateMusic:", error);
    throw error;
  }
}

export async function checkMusicStatus(taskId: string) {
  const apiKey = API_KEYS.music;
  if (!apiKey) throw new Error("Missing VIBEFORGE_API_KEY music generation API key");

  const response = await fetch(`${BASE_URL}/generate/record-info?taskId=${taskId}`, {
    headers: { "Authorization": `Bearer ${apiKey}` },
  });
  const data = await response.json();
  if (!response.ok || data.code !== 200) {
    console.error("🎵 Status check error:", data);
    throw new Error(`Status check failed: ${data.msg}`);
  }
  return data.data?.response?.sunoData?.[0];
}

export async function generateTitle(vibe: string): Promise<string> {
  const apiKey = API_KEYS.image; // Using image API key for text generation
  if (!apiKey) throw new Error("Missing KIE_IMAGE_API_KEY for title generation");

  const prompt = `Generate a short, creative song name (2-4 words) inspired by this vibe: '${vibe}'. Avoid generic words like Track or Song. Examples: "Midnight Reverie", "Electric Dreams", "Cosmic Drift". Return only the title, no quotes or extra text.`;

  const response = await fetch(`${BASE_URL}/generate/text`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: prompt,
      model: "GPT-4",
      maxTokens: 20,
    }),
  });

  const data = await response.json();
  if (!response.ok || data.code !== 200) {
    console.error("🎵 Title generation error:", data);
    // Fallback to a simple generated title
    const words = vibe.split(' ').slice(0, 2);
    return words.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Generated Track';
  }

  const generatedTitle = data.data?.response?.text?.trim() || 'Generated Track';
  console.log("🎵 Generated title:", generatedTitle);
  return generatedTitle;
}

export async function generateImage(prompt: string) {
  const apiKey = API_KEYS.image;
  if (!apiKey) throw new Error("Missing KIE_IMAGE_API_KEY for image generation");

  const response = await fetch(`${BASE_URL}/generate/image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: `Digital painting inspired by: ${prompt}, expressive brushstrokes, artstation style, oil painting aesthetic, cinematic lighting, painterly texture, artistic composition, vibrant yet harmonious colors, atmospheric mood, high detail artwork`,
      model: "Seedream",
      resolution: "1024x1024",
      style: "digital painting, expressive brushstrokes, artstation, oil painting style, cinematic lighting, painterly texture",
    }),
  });

  const data = await response.json();
  if (!response.ok || data.code !== 200) {
    console.error("🖼️ Image generation error:", data);
    throw new Error(`Image generation failed: ${data.msg}`);
  }

  return data.data?.response?.imageUrl;
}
