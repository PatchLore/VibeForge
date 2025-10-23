import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Only create Supabase client if environment variables are available
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_KEY 
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
  : null;

const BASE_URL = "https://api.kie.ai/api/v1";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const finalPrompt =
      prompt ||
      "A calming ambient soundscape with soft pads, warm tones, and deep atmosphere";

    // Step 1: Create generation task
    const genRes = await fetch(`${BASE_URL}/generate`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.KIE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: finalPrompt,
        customMode: false,
        instrumental: true,
        model: "V5",
        callBackUrl: "https://your-app.com/callback", // Placeholder callback URL
      }),
    });

    const genData = await genRes.json();
    if (!genRes.ok || genData.code !== 200)
      throw new Error(`Generation failed: ${genData.msg || "Unknown error"}`);

    const taskId = genData.data.taskId;
    console.log("Task ID:", taskId);

    // Step 2: Poll until success or timeout
    const start = Date.now();
    const timeout = 1000 * 60 * 5; // 5 minutes max
    let result;
    let pollCount = 0;

    while (Date.now() - start < timeout) {
      pollCount++;
      console.log(`Polling attempt ${pollCount} for task ${taskId}`);
      
      const statusRes = await fetch(
        `${BASE_URL}/generate/record-info?taskId=${taskId}`,
        {
          headers: { Authorization: `Bearer ${process.env.KIE_API_KEY}` },
        }
      );

      const statusData = await statusRes.json();
      if (!statusRes.ok || statusData.code !== 200)
        throw new Error(statusData.msg || "Status check failed");

      const status = statusData.data.status;
      console.log(`Task ${taskId} status: ${status}`);

      if (status === "SUCCESS" && statusData.data.response) {
        result = statusData.data.response.sunoData[0];
        console.log(`Task ${taskId} completed successfully!`);
        break;
      } else if (
        status === "CREATE_TASK_FAILED" ||
        status === "GENERATE_AUDIO_FAILED"
      ) {
        throw new Error(statusData.data.errorMessage || "Audio generation failed");
      }

      await new Promise((r) => setTimeout(r, 10000)); // wait 10s before next poll
    }

    if (!result) throw new Error("Timeout: Music generation took too long");

    // Store the generated track in Supabase (if available)
    if (supabase) {
      try {
        await supabase.from("tracks").insert({
          title: result.title || "Untitled Vibe",
          prompt: result.prompt || finalPrompt,
          audio_url: result.audioUrl,
          duration: result.duration,
          created_at: new Date().toISOString(),
        });
        console.log("Track stored successfully in Supabase");
      } catch (storageError) {
        console.warn("Failed to store track in Supabase:", storageError);
        // Don't break the generation if storage fails
      }
    } else {
      console.log("Supabase not configured, skipping database storage");
    }

    return NextResponse.json({
      provider: "suno-api",
      title: result.title,
      prompt: result.prompt,
      audioUrl: result.audioUrl,
      duration: result.duration,
      tags: result.tags,
    });
  } catch (err: any) {
    console.error("Error in /api/music:", err.message);

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