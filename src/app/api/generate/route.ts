import { NextResponse } from "next/server";
import { generateImageDirect } from "@/lib/generateImage";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body.prompt;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const img = await generateImageDirect({
      prompt,
      width: body.width ?? 1344,
      height: body.height ?? 768,
      steps: body.steps ?? 28,
      seed: body.seed,
    });

    return NextResponse.json({ image: img });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Image generation failed" },
      { status: 500 }
    );
  }
}
