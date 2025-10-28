import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;
  
console.log("🔥 [POPULAR] Popular tracks API initialized");

export async function GET() {
  console.log("🪙 No credits deducted for playback.");
  console.log("🔍 [Popular Tracks] Starting fetch...");
  try {
    if (!supabase) {
      return NextResponse.json({ tracks: [], error: "Database not configured" });
    }

    // Get all completed tracks across all users, sorted by recency
    const { data: tracks, error } = await supabase
      .from("tracks")
      .select("id, title, prompt, audio_url, image_url, likes, created_at, user_id")
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error("❌ [Popular Tracks] Error:", error);
      return NextResponse.json({ tracks: [], error: error.message });
    }

    if (!tracks || tracks.length === 0) {
      console.log("❌ [Popular Tracks] No completed tracks found in database");
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

    console.log(`✅ [Popular Tracks] Returning ${formattedTracks.length} completed tracks`);

    // Add summary log
    console.log(`📊 [Popular Tracks Summary] Total: ${formattedTracks.length} | With audio: ${formattedTracks.filter(t => t.audioUrl).length} | With images: ${formattedTracks.filter(t => t.imageUrl).length}`);

    return NextResponse.json({ tracks: formattedTracks });
  } catch (e) {
    console.error("❌ [Popular Tracks] Unexpected error:", e);
    return NextResponse.json({ tracks: [], error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}

