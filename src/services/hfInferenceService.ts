// HuggingFace Inference Service
// Uses ONLY HuggingFace Inference API

export async function generateHFImage(modelId: string, prompt: string): Promise<string> {
  // Access env vars at runtime (Next.js replaces NEXT_PUBLIC_* at build time)
  const API_KEY = process.env.NEXT_PUBLIC_HF_API_KEY || '';
  const BASE_URL = process.env.NEXT_PUBLIC_HF_BASE_URL || 'https://api-inference.huggingface.co/models';
  
  if (!API_KEY) {
    throw new Error("HuggingFace API key is not configured. Please set NEXT_PUBLIC_HF_API_KEY in your environment variables.");
  }

  // Build the fetch URL
  const fetchURL = `${BASE_URL}/${modelId}`;
  
  // Build the payload
  const payload = { inputs: prompt };
  
  // Log for debugging
  console.log('🎨 [HF Image Generation]');
  console.log('  Provider: HuggingFace');
  console.log('  Model ID:', modelId);
  console.log('  Fetch URL:', fetchURL);
  console.log('  Payload:', JSON.stringify(payload, null, 2));

  const res = await fetch(fetchURL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ [HF API Error]:", res.status, errorText);
    throw new Error(`HF image generation failed: ${res.status} ${errorText}`);
  }

  console.log('✅ [HF API] Response received, converting to base64...');

  // HF returns raw binary image data, convert to base64
  const arrayBuffer = await res.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  console.log('  Response size:', arrayBuffer.byteLength, 'bytes');
  
  // Convert to base64 (works in both browser and Node.js)
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  
  // Use btoa in browser, Buffer in Node.js
  const base64 = typeof window !== 'undefined' 
    ? btoa(binary)
    : Buffer.from(binary, 'binary').toString('base64');

  return `data:image/png;base64,${base64}`;
}

