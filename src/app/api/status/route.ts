import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic"; // Ensures deployment by Vercel
export const runtime = "nodejs"; // Guarantees server runtime

export async function GET(req: Request) {
  try {
    console.log("🚀 [DEPLOYMENT] /api/status endpoint reached - Vercel deployment successful!");
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
      .maybeSingle();

    if (error) {
      console.error("❌ Database error", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      console.log("⏳ Track still pending:", taskId);
      return NextResponse.json({ status: "PENDING" });
    }

    console.log("✅ Track found:", data.task_id);
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
  } catch (err: any) {
    console.error("💥 Unexpected error in /api/status:", err.message || err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
