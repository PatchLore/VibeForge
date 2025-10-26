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

    const { data, error } = await supabase
      .from("tracks")
      .select("title,prompt,audio_url,image_url,duration,task_id,created_at")
      .eq("task_id", taskId)
      .limit(1);

    if (error) {
      console.error("❌ Database error", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log("⏳ Track still pending:", taskId);
      return NextResponse.json({ status: "PENDING" });
    }

    // Handle case where multiple tracks have same task_id (shouldn't happen but be safe)
    const track = data[0];
    if (data.length > 1) {
      console.warn(`⚠️ Multiple tracks found for task_id ${taskId}, using first one`);
    }

    console.log("✅ Track found:", track.task_id);
    return NextResponse.json({
      status: "SUCCESS",
      track: {
        title: track.title,
        prompt: track.prompt,
        audioUrl: track.audio_url,
        imageUrl: track.image_url,
        duration: track.duration,
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("💥 Unexpected error in /api/status:", errorMessage);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
