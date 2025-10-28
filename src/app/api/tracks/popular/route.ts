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

    // Get only completed tracks with valid audio URLs, sorted by popularity (likes) and recency
    const { data: tracks, error } = await supabase
      .from("tracks")
      .select("id, title, audio_url, image_url, prompt, likes, created_at, user_id, status")
      .eq('status', 'completed')
      .not("audio_url", "is", null)
      .neq("audio_url", "")
      .not("audio_url", "eq", "")
      .order("likes", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) {
      console.error("❌ [Popular Tracks] Error:", error);
      return NextResponse.json({ tracks: [], error: error.message });
    }

    if (!tracks || tracks.length === 0) {
      console.log("ℹ️ [Popular Tracks] No tracks with audio found, trying without audio filter...");
      
      // Fallback: get any completed tracks
      const { data: fallbackTracks, error: fallbackError } = await supabase
        .from("tracks")
        .select("id, title, audio_url, image_url, prompt, likes, created_at, user_id, status")
        .eq('status', 'completed')
        .order("created_at", { ascending: false })
        .limit(8);
        
      if (fallbackError) {
        console.error("❌ [Popular Tracks] Fallback error:", fallbackError);
        return NextResponse.json({ tracks: [], error: fallbackError.message });
      }
      
      console.log(`ℹ️ [Popular Tracks] Fallback found ${fallbackTracks?.length || 0} tracks`);
      console.log("🔍 [Popular Tracks] Fallback tracks sample:", fallbackTracks?.[0]);
      
      if (!fallbackTracks || fallbackTracks.length === 0) {
        console.log("❌ [Popular Tracks] No tracks found in database at all");
        return NextResponse.json({ tracks: [] });
      }
      
      // Use fallback tracks
      const formattedTracks = fallbackTracks.map(track => ({
        id: track.id,
        title: track.title || 'Untitled Track',
        audioUrl: track.audio_url || '',
        imageUrl: track.image_url,
        mood: track.prompt || 'Unknown mood',
        generatedAt: track.created_at,
        duration: 600, // Default duration
        likes: track.likes || 0,
        userId: track.user_id
      }));

      console.log(`✅ [Popular Tracks] Returning ${formattedTracks.length} fallback tracks`);
      return NextResponse.json({ tracks: formattedTracks });
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

