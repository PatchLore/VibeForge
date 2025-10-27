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

    // Get all tracks with proper filtering
    const { data: tracks, error } = await supabase
      .from("tracks")
      .select("prompt, title, audio_url, image_url, created_at")
      .not("prompt", "is", null)
      .neq("prompt", "")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("❌ [Popular Tracks] Error:", error);
      return NextResponse.json({ moods: [], error: error.message });
    }

    if (!tracks || tracks.length === 0) {
      console.log("ℹ️ [Popular Tracks] No tracks found");
      return NextResponse.json({ moods: [] });
    }

    // Aggregate by key terms/phrases from prompts
    const moodCounts: Record<string, { count: number; tracks: any[]; samples: Set<string> }> = {};
    
    tracks.forEach(track => {
      if (!track.prompt) return;
      
      // Extract meaningful key phrases from the prompt
      const words = track.prompt.toLowerCase().split(/\s+/);
      
      // Look for descriptive 2-word phrases
      for (let i = 0; i < words.length - 1; i++) {
        const phrase = `${words[i]} ${words[i + 1]}`;
        
        // Only consider meaningful phrases
        if (phrase.length > 6 && !phrase.includes('the') && !phrase.includes('and')) {
          if (!moodCounts[phrase]) {
            moodCounts[phrase] = { count: 0, tracks: [], samples: new Set() };
          }
          moodCounts[phrase].count++;
          if (!moodCounts[phrase].samples.has(track.audio_url)) {
            moodCounts[phrase].tracks.push(track);
            moodCounts[phrase].samples.add(track.audio_url);
          }
        }
      }
    });

    // Convert to array and sort by popularity
    const popularMoods = Object.entries(moodCounts)
      .filter(([mood]) => mood.length > 8) // Only keep substantial phrases
      .map(([mood, data]) => ({
        mood,
        count: data.count,
        sampleTrack: data.tracks[0],
        popularity: Math.min(100, Math.round((data.count / tracks.length) * 100))
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 popular moods

    console.log(`✅ [Popular Tracks] Returning ${popularMoods.length} popular moods`);
    
    return NextResponse.json({ moods: popularMoods });
  } catch (e) {
    console.error("❌ [Popular Tracks] Unexpected error:", e);
    return NextResponse.json({ moods: [], error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}

