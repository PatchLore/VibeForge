import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : null;

console.log("🔥 [TRENDING] Trending tracks API initialized");

export async function GET() {
  console.log("🪙 No credits deducted for playback.");
  console.log("🔍 [Trending Tracks] Starting fetch...");
  try {
    if (!supabase) {
      return NextResponse.json({ tracks: [], error: "Database not configured" });
    }

    // Fetch most liked tracks, ordered by likes descending
    const { data: tracks, error } = await supabase
      .from("tracks")
      .select(
        "id, title, prompt, extended_prompt, extended_prompt_image, vibe, summary, status, audio_url, image_url, likes, created_at, user_id"
      )
      .eq("status", "completed")
      .order("likes", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("❌ [Trending Tracks] Error:", error);
      return NextResponse.json({ tracks: [], error: error.message });
    }

    if (!tracks || tracks.length === 0) {
      console.log("❌ [Trending Tracks] No completed tracks found in database");
      return NextResponse.json({ tracks: [] });
    }

    // ✅ Dual-key mapping (snake_case + camelCase)
    const formattedTracks = tracks.map((t) => {
      const audioUrl = t.audio_url ?? null;
      const imageUrl = t.image_url ?? null;
      const extendedPrompt = t.extended_prompt ?? "";
      const extendedPromptImage = t.extended_prompt_image ?? "";

      return {
        id: t.id,
        title: t.title || "Untitled Track",

        // snake_case (legacy)
        audio_url: t.audio_url ?? null,
        image_url: t.image_url ?? null,
        extended_prompt: extendedPrompt,
        extended_prompt_image: extendedPromptImage,

        // camelCase (current)
        audioUrl,
        imageUrl,
        extendedPrompt,
        extendedPromptImage,

        // general fields
        prompt: t.prompt ?? "",
        vibe: t.vibe ?? null,
        mood: t.vibe ?? t.prompt ?? "Unknown mood",
        summary: t.summary ?? "",
        status: t.status ?? "completed",
        created_at: t.created_at,
        generatedAt: t.created_at,
        duration: 600,
        likes: t.likes ?? 0,
        user_id: t.user_id,
        userId: t.user_id,
      };
    });

    console.log(`✅ [Trending Tracks] Returning ${formattedTracks.length} completed tracks`);
    console.log(
      `📊 [Trending Tracks Summary] Total: ${formattedTracks.length} | With audio: ${
        formattedTracks.filter((t) => t.audioUrl).length
      } | With images: ${formattedTracks.filter((t) => t.imageUrl).length}`
    );

    return NextResponse.json({ tracks: formattedTracks });
  } catch (e) {
    console.error("❌ [Trending Tracks] Unexpected error:", e);
    return NextResponse.json(
      {
        tracks: [],
        error: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


