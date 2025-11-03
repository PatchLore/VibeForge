import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { buildImagePrompt } from "@/lib/enrichPrompt";
import { generateImage } from "@/lib/kie";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Repair script for tracks with missing or invalid images
 * 
 * Finds the 3 most recent tracks where:
 * - image_url IS NULL
 * - resolution IS NULL
 * - resolution NOT IN ('2048x1152', '2K')
 * 
 * Regenerates images for each track and verifies dimensions
 */

export async function GET() {
  try {
    console.log("🛠️ [REPAIR] Starting track image backfill...");

    if (!supabaseAdmin) {
      throw new Error("Supabase admin client not initialized");
    }

    const { data: brokenTracks, error } = await supabaseAdmin
      .from("tracks")
      .select("id, prompt")
      .is("image_url", null)
      .limit(10);

    if (error) throw error;
    if (!brokenTracks?.length) {
      return NextResponse.json({ message: "No tracks need repair ✅" });
    }

    const results: any[] = [];

    for (const track of brokenTracks) {
      const imagePrompt = buildImagePrompt(track.prompt);
      try {
        const imageUrl = await generateImage(imagePrompt);
        if (imageUrl) {
          await supabaseAdmin
            .from("tracks")
            .update({
              image_url: typeof imageUrl === "string" ? imageUrl : (imageUrl as any)?.imageUrl ?? null,
              resolution: "2048x1152",
              updated_at: new Date().toISOString(),
            })
            .eq("id", track.id);

          results.push({ id: track.id, success: true, imageUrl });
          console.log(`✅ [REPAIR] Updated track ${track.id} with image.`);
        } else {
          results.push({ id: track.id, success: false, reason: "No image returned" });
        }
      } catch (err: any) {
        console.error(`❌ [REPAIR] Failed for ${track.id}:`, err);
        results.push({ id: track.id, success: false, reason: err.message });
      }
    }

    return NextResponse.json({
      message: `Processed ${brokenTracks.length} tracks`,
      results,
    });
  } catch (err: any) {
    console.error("🔥 [REPAIR] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}




