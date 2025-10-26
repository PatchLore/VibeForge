import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    // 🔧 CRITICAL FIX: Only respond to exact /api/status path
    const url = new URL(req.url);
    if (!url.pathname.endsWith("/api/status")) {
      console.log("🚫 [ROUTING] /api/status rejecting request to:", url.pathname);
      // Return 404 instead of NextResponse.next() to avoid routing conflicts
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    console.log("🚀 [DEPLOYMENT] /api/status endpoint reached - Vercel deployment successful! [CACHE CLEAR]");
    console.log("🔍 [DEPLOYMENT] Request URL:", req.url);

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");
    if (!taskId) {
      console.warn("⚠️ Missing taskId");
      return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase env vars", { supabaseUrl, supabaseKey });
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: tracks, error } = await supabase
      .from("tracks")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("❌ Database error", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check if track exists and has audio_url (completed)
    if (tracks?.length && tracks[0].audio_url) {
      const track = tracks[0];
      console.log("🎧 [STATUS CHECK]", taskId, "→", "completed");
      console.log("✅ Track found with audio_url:", track.audio_url);
      
      return NextResponse.json({
        status: "completed",
        track: {
          title: track.title,
          prompt: track.prompt || track.mood,
          audioUrl: track.audio_url,
          imageUrl: track.image_url,
          duration: track.duration,
        },
      });
    }

    // No track yet or no audio_url
    console.log("🎧 [STATUS CHECK]", taskId, "→", "pending");
    return NextResponse.json({ status: "pending" });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("💥 Unexpected error in /api/status:", errorMessage);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
