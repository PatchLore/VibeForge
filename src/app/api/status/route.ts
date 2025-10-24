import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("tracks")
      .select("*")
      .eq("task_id", taskId)
      .maybeSingle();

    if (error) {
      console.error("❌ [Status] DB error:", error.message);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ status: "PENDING" });
    }

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
    console.error("💥 [Status] Unexpected error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
