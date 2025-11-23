import { DeepInfraModel, GeneratedImage } from "../types/aiTypes";

// Note: Next.js requires NEXT_PUBLIC_ prefix for client-side env vars
// Using NEXT_PUBLIC_ instead of REACT_APP_ for Next.js compatibility
const API_KEY = process.env.NEXT_PUBLIC_DEEPINFRA_API_KEY || process.env.REACT_APP_DEEPINFRA_API_KEY || '';
const BASE_URL = process.env.NEXT_PUBLIC_DEEPINFRA_BASE_URL || process.env.REACT_APP_DEEPINFRA_BASE_URL || 'https://api.deepinfra.com/v1/openai';

export async function listModels(): Promise<DeepInfraModel[]> {
  if (!API_KEY) {
    throw new Error("DeepInfra API key is not configured");
  }

  const res = await fetch(`${BASE_URL}/models`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch DeepInfra models: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return data?.data?.map((m: any) => ({
    id: m.id,
    name: m.id,
    maxResolution: "2048x2048",
  })) || [];
}

export async function generateImage(
  prompt: string,
  model: string
): Promise<GeneratedImage> {
  if (!API_KEY) {
    throw new Error("DeepInfra API key is not configured");
  }

  const res = await fetch(`${BASE_URL}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      size: "2048x2048",
      response_format: "b64_json"
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`DeepInfra image generation failed: ${res.status} ${errorText}`);
  }

  const json = await res.json();
  
  if (!json.data || !json.data[0] || !json.data[0].b64_json) {
    throw new Error("Invalid response format from DeepInfra API");
  }

  return {
    imageBase64: json.data[0].b64_json,
    model
  };
}

