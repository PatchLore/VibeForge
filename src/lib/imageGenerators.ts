/**
 * Image generation via:
 * 1. Runware (FLUX.1-schnell)
 * 2. DeepInfra FLUX.1-schnell
 * 3. DeepInfra SDXL Turbo (final fallback)
 */

export async function generateRunwareFLUX({
  prompt,
  width,
  height,
  steps = 20,
  seed,
}: {
  prompt: string;
  width: number;
  height: number;
  steps?: number;
  seed?: number;
}) {
  const API_KEY = process.env.RUNWARE_API_KEY;
  if (!API_KEY) throw new Error("RUNWARE_API_KEY missing");

  const payload = [
    {
      taskType: "imageInference",
      taskUUID: crypto.randomUUID(),
      positivePrompt: prompt,
      width,
      height,
      model: "runware:101@1", // FLUX.1-schnell
      steps,
      seed,
      outputType: "dataURI",
      outputFormat: "PNG",
      deliveryMethod: "sync",
      numberResults: 1,
    },
  ];

  const res = await fetch("https://api.runware.ai/v1", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    const errorText = text.substring(0, 300);
    console.error(`❌ [RUNWARE] HTTP ${res.status} error:`, errorText);
    throw new Error(`Runware failed: ${res.status} ${errorText}`);
  }

  const json = await res.json();
  const item = json?.data?.[0];

  const dataURI =
    item?.imageDataURI || item?.imageURL || item?.imageBase64Data;

  if (!dataURI) throw new Error("Runware returned no image");

  return dataURI.startsWith("data:image") ? dataURI : dataURI;
}

export async function generateDeepInfraFLUX({
  prompt,
  width,
  height,
  steps = 28,
  seed,
}: {
  prompt: string;
  width: number;
  height: number;
  steps?: number;
  seed?: number;
}) {
  const API_KEY = process.env.DEEPINFRA_API_KEY;
  if (!API_KEY) throw new Error("DEEPINFRA_API_KEY missing");

  const modelId = "black-forest-labs/FLUX.1-schnell";

  const body: any = {
    prompt,
    width,
    height,
    num_inference_steps: steps,
  };

  if (seed) body.seed = seed;

  const res = await fetch(
    `https://api.deepinfra.com/v1/inference/${modelId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    const errorText = text.substring(0, 300);
    console.error(`❌ [DEEPINFRA FLUX] HTTP ${res.status} error:`, errorText);
    throw new Error(`DeepInfra FLUX failed: ${res.status} ${errorText}`);
  }

  const json = await res.json();
  console.log("🔍 [DEEPINFRA FLUX] Response JSON keys:", Object.keys(json || {}));
  const url = json?.images?.[0];
  console.log("🔍 [DEEPINFRA FLUX] Image URL extracted:", url ? "yes" : "no", url ? url.substring(0, 100) : "");
  if (!url) {
    console.error("❌ [DEEPINFRA FLUX] No image URL in response:", JSON.stringify(json, null, 2).substring(0, 500));
    throw new Error("DeepInfra FLUX returned no image");
  }

  // Convert to base64
  console.log("🔍 [DEEPINFRA FLUX] Fetching image from URL...");
  const img = await fetch(url);
  if (!img.ok) {
    console.error(`❌ [DEEPINFRA FLUX] Failed to fetch image: ${img.status}`);
    throw new Error(`Failed to fetch image: ${img.status}`);
  }
  const buf = Buffer.from(await img.arrayBuffer());
  console.log("✅ [DEEPINFRA FLUX] Image fetched, buffer size:", buf.length);
  return `data:image/png;base64,${buf.toString("base64")}`;
}

export async function generateDeepInfraSDXLTurbo({
  prompt,
  width,
  height,
  steps = 28,
  seed,
}: {
  prompt: string;
  width: number;
  height: number;
  steps?: number;
  seed?: number;
}) {
  const API_KEY = process.env.DEEPINFRA_API_KEY;
  if (!API_KEY) throw new Error("DEEPINFRA_API_KEY missing");

  const modelId = "stabilityai/sdxl-turbo";

  const body: any = {
    prompt,
    width,
    height,
    num_inference_steps: steps,
  };

  if (seed) body.seed = seed;

  const res = await fetch(
    `https://api.deepinfra.com/v1/inference/${modelId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    const errorText = text.substring(0, 300);
    console.error(`❌ [DEEPINFRA SDXL] HTTP ${res.status} error:`, errorText);
    throw new Error(`DeepInfra SDXL Turbo failed: ${res.status} ${errorText}`);
  }

  const json = await res.json();
  console.log("🔍 [DEEPINFRA SDXL] Response JSON keys:", Object.keys(json || {}));
  const url = json?.images?.[0];
  console.log("🔍 [DEEPINFRA SDXL] Image URL extracted:", url ? "yes" : "no", url ? url.substring(0, 100) : "");
  if (!url) {
    console.error("❌ [DEEPINFRA SDXL] No image URL in response:", JSON.stringify(json, null, 2).substring(0, 500));
    throw new Error("DeepInfra Turbo returned no image");
  }

  console.log("🔍 [DEEPINFRA SDXL] Fetching image from URL...");
  const img = await fetch(url);
  if (!img.ok) {
    console.error(`❌ [DEEPINFRA SDXL] Failed to fetch image: ${img.status}`);
    throw new Error(`Failed to fetch image: ${img.status}`);
  }
  const buf = Buffer.from(await img.arrayBuffer());
  console.log("✅ [DEEPINFRA SDXL] Image fetched, buffer size:", buf.length);
  return `data:image/png;base64,${buf.toString("base64")}`;
}
