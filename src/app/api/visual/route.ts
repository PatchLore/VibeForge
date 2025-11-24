import { NextResponse } from "next/server";
import { buildImagePrompt } from "@/lib/enrichPrompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    message: "Visual generation endpoint ready",
    endpoint: "/api/visual",
    methods: ["GET", "POST"],
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: Request) {
  console.log("🎨 POST /api/visual endpoint reached");
  
  try {
    const body = await req.json();
    const { prompt } = body;
    
    if (!prompt) {
      return NextResponse.json({
        success: false,
        message: "Prompt is required for image generation"
      }, { status: 400 });
    }

    console.log("🎨 [VISUAL] Generating image for prompt:", prompt);

    // Use literal image prompt based on user's theme
    const imagePrompt = buildImagePrompt(prompt);

    console.log("🎨 [VISUAL] Literal image prompt:", imagePrompt);
    console.log("[IMAGE PROMPT SENT]", imagePrompt);

    // Generate image via /api/generate (Runware/DeepInfra)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const imageResponse = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: imagePrompt,
        modelId: 'stabilityai/sdxl-turbo',
        width: 1344,
        height: 768,
      }),
    });

    if (!imageResponse.ok) {
      const errorData = await imageResponse.json().catch(() => ({}));
      throw new Error(`Image generation failed: ${errorData.error || 'Unknown error'}`);
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.image;

    if (!imageUrl) {
      throw new Error("Image generation failed - no image returned");
    }

    console.log("✅ [VISUAL] Image generated successfully");

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      resolution: "1344x768",
      prompt: prompt,
      literalPrompt: imagePrompt,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("🎨 [VISUAL] Image generation error:", error);
    return NextResponse.json({
      success: false,
      message: "Image generation failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}