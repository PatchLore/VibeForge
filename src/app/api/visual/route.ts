import { NextResponse } from "next/server";
import { generateImage } from "@/lib/kie";
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

    // Generate image using enriched prompt
    const imageUrl = await generateImage(imagePrompt);

    if (!imageUrl) {
      throw new Error("Image generation failed");
    }

    console.log("✅ [VISUAL] Image generated successfully:", imageUrl);

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
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