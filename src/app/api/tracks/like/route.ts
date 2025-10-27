import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_KEY 
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
  : null;

export async function POST(request: NextRequest) {
  console.log("🪙 No credits deducted for playback.");
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { trackId } = await request.json();
    
    if (!trackId) {
      return NextResponse.json({ error: "Track ID is required" }, { status: 400 });
    }

    // Use the RPC function to safely increment likes
    const { data, error } = await supabase.rpc('increment_track_likes', {
      track_id: trackId
    });

    if (error) {
      console.error('Error incrementing likes:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      newLikes: data 
    });
  } catch (e) {
    return NextResponse.json({ 
      error: e instanceof Error ? e.message : 'Unknown error' 
    }, { status: 500 });
  }
}

