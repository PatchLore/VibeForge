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

    // Track is pending or doesn't exist - check Kie.ai status
    console.log("🔄 [POLL] Checking Kie.ai for task:", taskId);

    // Rate limiting: only poll Kie.ai if enough time has passed since last poll for this taskId
    const now = Date.now();
    const lastPoll = lastPollTime.get(taskId) || 0;
    const timeSinceLastPoll = now - lastPoll;

    if (timeSinceLastPoll < MIN_POLL_INTERVAL) {
      console.log(`⏭️ [POLL] Rate limited: ${Math.round(timeSinceLastPoll / 1000)}s since last poll (min: ${MIN_POLL_INTERVAL / 1000}s)`);
      return NextResponse.json({ status: "PENDING" });
    }

    // Update last poll time
    lastPollTime.set(taskId, now);

    try {
      const kieData = await checkMusicStatus(taskId);
      
      if (kieData && kieData.audio_url) {
        console.log("✅ [POLL] Completed on Kie.ai → Saving to database");
        console.log("📦 [POLL] Data received:", {
          audio_url: kieData.audio_url ? "✅ exists" : "❌ missing",
          image_url: kieData.image_url ? "✅ exists" : "❌ missing",
          title: kieData.title,
          duration: kieData.duration
        });
        
        // Update or insert the track - ONLY update audio_url, preserve existing image_url if present
        const trackData: any = {
          task_id: taskId,
          title: kieData.title || `Generated Track`,
          prompt: data?.prompt || 'Generated',
          audio_url: kieData.audio_url,
          // CRITICAL: Don't overwrite existing image_url (likely 2K from callback)
          // Only set if image_url doesn't exist yet
          duration: kieData.duration || 600,
          status: 'completed',
          updated_at: new Date().toISOString()
        };

        // Only set image_url from Suno if track doesn't have one yet
        if (!data?.image_url && kieData.image_url) {
          trackData.image_url = kieData.image_url;
          console.log("📸 [POLL] Setting Suno image_url (no existing image)");
        } else if (data?.image_url) {
          console.log("🖼️ [POLL] Preserving existing image_url (not overwriting with Suno thumbnail)");
        }

        if (data?.user_id) {
          trackData.user_id = data.user_id;
        }

        console.log("💾 [POLL] Updating track in database:", trackData);

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
      
      // Handle rate limit errors by increasing poll interval for this task
      if (pollError.message === 'RATE_LIMIT') {
        console.warn("🚫 [POLL] Rate limit hit for taskId:", taskId);
        // Set a longer wait time (2 minutes) before next poll for this task
        lastPollTime.set(taskId, Date.now() + 120000);
        return NextResponse.json({ status: "PENDING", rateLimited: true });
      }
      
      return NextResponse.json({ status: "PENDING" });
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("💥 Unexpected error in /api/status:", errorMessage);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
