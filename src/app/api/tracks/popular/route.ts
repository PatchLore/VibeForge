import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_KEY 
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
  : null;

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({ moods: [], error: "Database not configured" });
    }

    // Get all tracks and aggregate by mood/prompt
    const { data: tracks, error } = await supabase
      .from("tracks")
      .select("prompt, title, audio_url, image_url, created_at");

    if (error) {
      return NextResponse.json({ moods: [], error: error.message });
    }

    if (!tracks || tracks.length === 0) {
      return NextResponse.json({ moods: [] });
    }

    // Aggregate by mood (extract first word from prompt as mood)
    const moodCounts: Record<string, { count: number; tracks: any[] }> = {};
    
    tracks.forEach(track => {
      const mood = track.prompt.split(' ')[0].toLowerCase();
      if (!moodCounts[mood]) {
        moodCounts[mood] = { count: 0, tracks: [] };
      }
      moodCounts[mood].count++;
      moodCounts[mood].tracks.push(track);
    });

    // Convert to array and sort by popularity
    const popularMoods = Object.entries(moodCounts)
      .map(([mood, data]) => ({
        mood,
        count: data.count,
        sampleTrack: data.tracks[0], // Use first track as sample
        popularity: Math.min(100, Math.round((data.count / tracks.length) * 100))
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    return NextResponse.json({ moods: popularMoods });
  } catch (e) {
    return NextResponse.json({ moods: [], error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
