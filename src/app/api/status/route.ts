import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkMusicStatus } from "@/lib/kie";
import { supabaseServer } from "@/lib/supabaseServer";
import { CREDITS_PER_GENERATION } from "@/lib/config";

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

    // Track is pending or doesn't exist - check Kie.ai status
    console.log("🔄 [POLL] Checking Kie.ai for task:", taskId);
    try {
      const kieData = await checkMusicStatus(taskId);
      
      if (kieData && kieData.audio_url) {
        console.log("✅ [POLL] Completed on Kie.ai → Saving to database");
        
        // Update or insert the track
        const trackData: any = {
          task_id: taskId,
          title: kieData.title || `Generated Track`,
          prompt: data?.prompt || 'Generated',
          audio_url: kieData.audio_url,
          image_url: kieData.image_url || null,
          duration: kieData.duration || 600,
          status: 'completed',
          updated_at: new Date().toISOString()
        };

        if (data?.user_id) {
          trackData.user_id = data.user_id;
        }

        const { data: updated, error: updateError } = await supabase
          .from("tracks")
          .update(trackData)
          .eq("task_id", taskId)
          .select()
          .maybeSingle();

        if (updateError) {
          console.error("❌ [POLL] Failed to save to database:", updateError);
        } else if (data?.user_id) {
          // Deduct credits on successful completion
          console.log("💎 [POLL] Deducting credits for user:", data.user_id);
          const { data: profile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('user_id', data.user_id)
            .maybeSingle();
          
          if (profile && profile.credits >= CREDITS_PER_GENERATION) {
            await supabase
              .from('profiles')
              .update({ 
                credits: profile.credits - CREDITS_PER_GENERATION,
                updated_at: new Date().toISOString() 
              })
              .eq('user_id', data.user_id);
            console.log("✅ [POLL] Credits deducted. Remaining:", profile.credits - CREDITS_PER_GENERATION);
          }
        }

        console.log("✅ [POLL] Track saved successfully");
        return NextResponse.json({
          status: "SUCCESS",
          track: {
            title: trackData.title,
            prompt: trackData.prompt,
            audioUrl: trackData.audio_url,
            imageUrl: trackData.image_url,
            duration: trackData.duration,
          },
        });
      } else {
        console.log("⏳ [POLL] Still processing on Kie.ai");
        return NextResponse.json({ status: "PENDING" });
      }
    } catch (pollError: any) {
      console.error("⚠️ [POLL] Kie.ai check failed:", pollError.message);
      return NextResponse.json({ status: "PENDING" });
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("💥 Unexpected error in /api/status:", errorMessage);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
