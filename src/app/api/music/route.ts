import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateMusic, checkMusicStatus, generateImage } from "@/lib/kie";

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const apiKey = process.env.KIE_API_KEY;

  if (!apiKey) return NextResponse.json({ error: "Missing API key" }, { status: 500 });

  try {
    const finalPrompt = prompt || "A calming ambient soundscape with soft pads, warm tones, and deep atmosphere";

    // Step 1: Generate music
    console.log("🎵 Starting music generation...");
    const taskId = await generateMusic(apiKey, finalPrompt);
    console.log("Task ID:", taskId);

    // Step 2: Poll for completion
    let trackData;
    const start = Date.now();
    const timeout = 600000; // 10 minutes max
    let pollCount = 0;

    while (!trackData && Date.now() - start < timeout) {
      pollCount++;
      console.log(`Polling attempt ${pollCount} for task ${taskId}`);
      
      const result = await checkMusicStatus(apiKey, taskId);
      if (result?.status === "SUCCESS" && result?.audioUrl) {
        trackData = result;
        console.log(`Task ${taskId} completed successfully!`);
        break;
      }
      await new Promise(r => setTimeout(r, 10000)); // wait 10s before next poll
    }

    if (!trackData) throw new Error("Music generation timed out");

    // Step 3: Generate matching AI painting
    console.log("🎨 Starting image generation...");
    const imageUrl = await generateImage(apiKey, finalPrompt);
    console.log("Image generated:", imageUrl);

    // Step 4: Store in Supabase
    if (supabase) {
      try {
        await supabase.from("tracks").insert({
          title: trackData.title || "Untitled Vibe",
          prompt: finalPrompt,
          audio_url: trackData.audioUrl,
          image_url: imageUrl,
          duration: trackData.duration || 600,
          created_at: new Date().toISOString(),
        });
        console.log("🎵🎨 SoundPainting stored successfully in Supabase");
      } catch (storageError) {
        console.warn("Failed to store SoundPainting in Supabase:", storageError);
      }
    } else {
      console.log("Supabase not configured, skipping database storage");
    }

    return NextResponse.json({
      success: true,
      provider: "suno-api",
      title: trackData.title,
      prompt: finalPrompt,
      audioUrl: trackData.audioUrl,
      imageUrl: imageUrl,
      duration: trackData.duration,
      tags: trackData.tags,
    });

  } catch (err: any) {
    console.error("SoundPainting error:", err);

    // fallback local track
    const FALLBACKS = [
      "/audio/fallback/ambient-a.wav",
      "/audio/fallback/ambient-b.wav",
      "/audio/fallback/ambient-c.wav",
    ];
    const fallback = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
    
    return NextResponse.json(
      {
        provider: "fallback",
        audioUrl: fallback,
        error: err.message,
      },
      { status: 200 } // Return 200 to avoid client errors
    );
  }
}