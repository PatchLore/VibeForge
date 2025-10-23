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

    // Check if it's a credit issue
    if (err.message.includes("credits are insufficient") || err.message.includes("top up")) {
      return NextResponse.json(
        {
          provider: "error",
          error: "API credits insufficient. Please add credits to your Kie.ai account to generate SoundPaintings.",
          message: "Your Kie.ai API credits have been exhausted. Please visit the Kie.ai dashboard to add more credits and continue generating music and artwork.",
          audioUrl: null,
          imageUrl: null,
        },
        { status: 402 } // Payment Required
      );
    }

    // For other errors, return a more informative response
    return NextResponse.json(
      {
        provider: "error",
        error: err.message,
        message: "Unable to generate SoundPainting. Please try again later.",
        audioUrl: null,
        imageUrl: null,
      },
      { status: 500 }
    );
  }
}