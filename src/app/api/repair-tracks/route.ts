import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { generateImage, verifyAndUpscaleTo2K } from "@/lib/kie";

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

export async function GET(req: Request) {
  console.log("🚀 [REPAIR] Starting track repair process...");
  console.log(`⏰ [REPAIR] Started at ${new Date().toISOString()}`);
  
  try {
    if (!supabaseServer) {
      throw new Error("Supabase not initialized");
    }
    
    // Find tracks that need repair
    console.log("🔍 [REPAIR] Finding tracks that need image repair...");
    
    const { data: tracks, error: findError } = await supabaseServer
      .from('tracks')
      .select('id, task_id, title, prompt, extended_prompt_image, image_url, resolution, status, created_at')
      .or('image_url.is.null,resolution.is.null,resolution.not.in.(2048x1152,2K)')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (findError) {
      console.error("❌ [REPAIR] Database error:", findError);
      throw findError;
    }
    
    console.log(`📊 [REPAIR] Found ${tracks?.length || 0} tracks needing repair`);
    
    if (!tracks || tracks.length === 0) {
      console.log("✅ [REPAIR] No tracks need repair!");
      return NextResponse.json({
        success: true,
        message: "No tracks need repair",
        fixed: 0,
        skipped: 0,
        failed: 0
      });
    }
    
    console.log(`\n📋 [REPAIR] Processing ${tracks.length} tracks:\n`);
    
    let fixed = 0;
    let skipped = 0;
    let failed = 0;
    
    const results = [];
    
    for (const track of tracks) {
      console.log(`\n--- Processing track ${track.id} ---`);
      console.log(`Title: ${track.title || 'N/A'}`);
      console.log(`Current image_url: ${track.image_url || 'NULL'}`);
      console.log(`Current resolution: ${track.resolution || 'NULL'}`);
      
      const result = await repairTrackImage(track);
      results.push({ trackId: track.id, title: track.title, ...result });
      
      if (result.success) {
        fixed++;
      } else if (result.skipped) {
        skipped++;
      } else {
        failed++;
      }
    }
    
    console.log(`\n✅ [REPAIR] Repair process complete!`);
    console.log(`📊 [REPAIR] Summary:`);
    console.log(`   - Fixed: ${fixed}`);
    console.log(`   - Skipped: ${skipped}`);
    console.log(`   - Failed: ${failed}`);
    console.log(`⏰ [REPAIR] Finished at ${new Date().toISOString()}`);
    
    return NextResponse.json({
      success: true,
      summary: {
        fixed,
        skipped,
        failed,
        total: tracks.length
      },
      results
    });
    
  } catch (error: any) {
    console.error("❌ [REPAIR] Fatal error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error"
    }, { status: 500 });
  }
}

/**
 * Repair a single track's image
 */
async function repairTrackImage(track: any) {
  console.log(`🔧 [REPAIR] Regenerating image for track ${track.id}`);
  
  if (!track.extended_prompt_image) {
    console.log(`[REPAIR] ❌ Skipped — no extended_prompt_image for track ${track.id}`);
    return { success: false, skipped: true, reason: "No extended_prompt_image" };
  }
  
  try {
    // Generate new image synchronously
    const result = await generateImage(track.extended_prompt_image);
    
    if (!result.imageUrl) {
      console.log(`[REPAIR] ❌ Skipped — image invalid for track ${track.id}`);
      return { success: false, skipped: true, reason: "No imageUrl returned" };
    }
    
    // Verify the image dimensions
    const verified = await verifyAndUpscaleTo2K(result.imageUrl, { width: 2048, height: 1152 });
    
    if (verified.width >= 2048 && verified.height >= 1152) {
      // Update the track with the new image
      const { error: updateError } = await supabaseServer!
        .from('tracks')
        .update({
          image_url: result.imageUrl,
          resolution: '2048x1152',
          updated_at: new Date().toISOString()
        })
        .eq('id', track.id);
      
      if (updateError) {
        console.error(`❌ [REPAIR] Database update error for track ${track.id}:`, updateError);
        return { success: false, skipped: false, reason: "Database update failed" };
      }
      
      console.log(`[REPAIR] ✅ Image fixed for track ${track.id}`);
      return { 
        success: true, 
        skipped: false, 
        imageUrl: result.imageUrl,
        resolution: '2048x1152',
        verifiedDimensions: `${verified.width}x${verified.height}`
      };
    } else {
      console.log(`[REPAIR] ❌ Skipped — image invalid for track ${track.id} (${verified.width}x${verified.height})`);
      return { 
        success: false, 
        skipped: true, 
        reason: `Image too small (${verified.width}x${verified.height})` 
      };
    }
  } catch (error: any) {
    console.error(`❌ [REPAIR] Error repairing track ${track.id}:`, error.message);
    return { success: false, skipped: false, reason: error.message };
  }
}

