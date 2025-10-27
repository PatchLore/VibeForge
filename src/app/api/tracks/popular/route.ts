import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_KEY 
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
  : null;

export async function GET() {
  console.log("🪙 No credits deducted for playback.");
  try {
    if (!supabase) {
      return NextResponse.json({ tracks: [], error: "Database not configured" });
    }

    // Get tracks with valid audio URLs, sorted by popularity (likes) and recency
    const { data: tracks, error } = await supabase
      .from("tracks")
      .select("id, title, audio_url, image_url, prompt, likes, created_at, user_id")
      .not("audio_url", "is", null)
      .neq("audio_url", "")
      .order("likes", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) {
      console.error("❌ [Popular Tracks] Error:", error);
      return NextResponse.json({ tracks: [], error: error.message });
    }

    if (!tracks || tracks.length === 0) {
      console.log("ℹ️ [Popular Tracks] No tracks with audio found");
      return NextResponse.json({ tracks: [] });
    }

    // Format tracks for TrendingVibes component
    const formattedTracks = tracks.map(track => ({
      id: track.id,
      title: track.title || 'Untitled Track',
      audioUrl: track.audio_url,
      imageUrl: track.image_url,
      mood: track.prompt || 'Unknown mood',
      generatedAt: track.created_at,
      duration: 600, // Default duration
      likes: track.likes || 0,
      userId: track.user_id
    }));

    console.log(`✅ [Popular Tracks] Returning ${formattedTracks.length} real tracks`);
    
    return NextResponse.json({ tracks: formattedTracks });
  } catch (e) {
    console.error("❌ [Popular Tracks] Unexpected error:", e);
    return NextResponse.json({ tracks: [], error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}

