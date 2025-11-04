import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_KEY 
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
  : null;

export async function GET() {
  console.log("🪙 No credits deducted for playback.");
  try {
    if (!supabase) {
      return NextResponse.json({ tracks: [], error: "Database not configured" });
    }

    // Only show active completed tracks with valid images (exclude archived and processing)
    const { data, error } = await supabase
      .from("tracks")
      .select("*")
      .eq("status", "completed")
      .neq("status", "archived") // Explicitly exclude archived
      .not("image_url", "is", null) // Require valid image_url
      .neq("image_url", "") // Exclude empty strings
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ tracks: [], error: error.message });
    }

    return NextResponse.json({ tracks: data || [] });
  } catch (e) {
    return NextResponse.json({ tracks: [], error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}

