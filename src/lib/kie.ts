import { NextResponse } from "next/server";

// 🎯 API Key Manager - Clear separation of concerns
const KIE_KEYS = {
  music: process.env.VibeForge,
  image: process.env.KIE_API_KEY,
};

// ⚠️ Runtime validation with clear warnings
if (!KIE_KEYS.music) {
  console.warn("⚠️ Missing VibeForge (Music Generation) API key! Please add it to Vercel.");
}

if (!KIE_KEYS.image) {
  console.warn("⚠️ Missing KIE_API_KEY (Image Generation) API key! Please add it to Vercel.");
}

// ✅ Startup confirmation
console.log("✅ Kie.ai API keys loaded:");
console.log("🎵 Music Key:", KIE_KEYS.music ? "Loaded ✅" : "Missing ❌");
console.log("🖼️ Image Key:", KIE_KEYS.image ? "Loaded ✅" : "Missing ❌");

const BASE_URL = "https://api.kie.ai/api/v1";

export async function generateMusic(prompt: string) {
  const apiKey = KIE_KEYS.music;
  if (!apiKey) throw new Error("Missing VibeForge music generation API key");

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
      callBackUrl: process.env.KIE_CALLBACK_URL || "https://soothe-ai.vercel.app/api/callback",
    }),
  });

  const data = await response.json();
  if (!response.ok || data.code !== 200) {
    console.error("🎵 Music generation error:", data);
    throw new Error(`Music generation failed: ${data.msg}`);
  }
  return data.data.taskId;
}

export async function checkMusicStatus(taskId: string) {
  const apiKey = KIE_KEYS.music;
  if (!apiKey) throw new Error("Missing VibeForge music generation API key");

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

export async function generateImage(prompt: string) {
  const apiKey = KIE_KEYS.image;
  if (!apiKey) throw new Error("Missing KIE_API_KEY for image generation");

  const response = await fetch(`${BASE_URL}/generate/image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: `Abstract painting inspired by: ${prompt}`,
      model: "Seedream",
      resolution: "1024x1024",
      style: "ethereal, abstract, cinematic lighting, calming colors",
    }),
  });

  const data = await response.json();
  if (!response.ok || data.code !== 200) {
    console.error("🖼️ Image generation error:", data);
    throw new Error(`Image generation failed: ${data.msg}`);
  }

  return data.data?.response?.imageUrl;
}
