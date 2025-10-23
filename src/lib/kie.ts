import { NextResponse } from "next/server";

const BASE_URL = "https://api.kie.ai/api/v1";

export async function generateMusic(apiKey: string, prompt: string) {
  const res = await fetch(`${BASE_URL}/generate`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      customMode: false,
      instrumental: true,
      model: "V4_5PLUS",
    }),
  });
  const data = await res.json();
  if (!res.ok || data.code !== 200) throw new Error(data.msg || "Music generation failed");
  return data.data.taskId;
}

export async function checkMusicStatus(apiKey: string, taskId: string) {
  const res = await fetch(`${BASE_URL}/generate/record-info?taskId=${taskId}`, {
    headers: { "Authorization": `Bearer ${apiKey}` },
  });
  const data = await res.json();
  if (!res.ok || data.code !== 200) throw new Error(data.msg || "Status check failed");
  return data.data?.response?.sunoData?.[0];
}

export async function generateImage(apiKey: string, prompt: string) {
  const res = await fetch(`${BASE_URL}/generate/image`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: `An abstract digital painting visualizing the mood: ${prompt}`,
      model: "Seedream",
      resolution: "1024x1024",
      style: "oil painting, abstract, ethereal lighting, calming colors",
    }),
  });
  const data = await res.json();
  if (!res.ok || data.code !== 200) throw new Error(data.msg || "Image generation failed");
  return data.data?.response?.imageUrl;
}
