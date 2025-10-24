import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateMusic, checkMusicStatus, generateImage } from "@/lib/kie";

export async function GET() {
  console.log("🎵 GET /api/music endpoint reached");
  return NextResponse.json({
    message: "GET works",
    endpoint: "/api/music",
    methods: ["GET", "POST"],
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: Request) {
  console.log("🎵 POST /api/music endpoint reached");
  console.log("🔍 Request method:", req.method);
  console.log("🔍 Request URL:", req.url);
  console.log("🔍 Request headers:", Object.fromEntries(req.headers.entries()));
  
  try {
    const body = await req.json();
    console.log("📝 Request body:", body);
    const { prompt } = body;
    console.log("📝 Extracted prompt:", prompt);

    const finalPrompt = prompt || "A calming ambient soundscape with soft pads, warm tones, and deep atmosphere";

    // Step 1: Generate music
    console.log("🎵 Starting music generation...");
    const taskId = await generateMusic(finalPrompt);
    console.log("Task ID:", taskId);

    // Return immediately with task ID - Vercel has 5-minute timeout limit
    // The generation happens in the background via Kie.ai's callback system
    return NextResponse.json({
      success: true,
      provider: "suno-api",
      taskId: taskId,
      message: "🎶 Composing your SoundPainting… this usually takes about 1–2 minutes.",
      prompt: finalPrompt,
    });

  } catch (err: unknown) {
    console.error("SoundPainting error:", err);

    // Return professional error message instead of fallback audio
    return NextResponse.json({
      success: false,
      message: "🎵 SoundPainting generation is temporarily unavailable. Please try again in a few moments.",
    }, { status: 503 });
  }
}