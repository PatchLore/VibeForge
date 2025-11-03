import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkMusicStatus } from "@/lib/kie";
import { supabaseServer } from "@/lib/supabaseServer";
import { CREDITS_PER_GENERATION } from "@/lib/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// In-memory rate limiting: track last poll time per taskId
const lastPollTime = new Map<string, number>();
const MIN_POLL_INTERVAL = 30000; // 30 seconds minimum between Kie.ai API calls per taskId

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

    // First check if track is already in database
    const { data, error } = await supabase
      .from("tracks")
      .select("title,prompt,audio_url,image_url,duration,task_id,created_at,status,user_id")
      .eq("task_id", taskId)
      .maybeSingle();

    if (error) {
      console.error("❌ Database error", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If track exists and is completed, return it
    if (data && data.status === 'completed') {
      console.log("✅ Track found in database:", data.task_id);
      return NextResponse.json({
        status: "SUCCESS",
        track: {
          title: data.title,
          prompt: data.prompt,
          audioUrl: data.audio_url,
          imageUrl: data.image_url,
          duration: data.duration,
        },
      });
    }

    // Do not query Kie.ai here. Rely on Supabase status only.
    console.log("⏳ [STATUS] Still processing in database for task:", taskId);
    return NextResponse.json({ status: "PENDING" });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("💥 Unexpected error in /api/status:", errorMessage);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
