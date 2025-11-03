/**
 * Repair script for tracks with missing or invalid images
 * 
 * This script finds tracks that need image regeneration and fixes them:
 * - image_url IS NULL
 * - resolution IS NULL
 * - resolution NOT IN ('2048x1152', '2K')
 * 
 * Usage:
 * npx tsx scripts/repair-tracks.ts
 * 
 * Or import and call the function:
 * import { repairTracks } from './scripts/repair-tracks';
 * await repairTracks();
 */

import { createClient } from "@supabase/supabase-js";
import { generateImage, verifyAndUpscaleTo2K } from "../src/lib/kie";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Find tracks that need image repair
 */
async function findTracksNeedingRepair() {
  console.log("🔍 [REPAIR] Finding tracks that need image repair...");
  
  const { data, error } = await supabase
    .from('tracks')
    .select('id, task_id, title, prompt, extended_prompt_image, image_url, resolution, status, created_at')
    .or('image_url.is.null,resolution.is.null,resolution.not.in.(2048x1152,2K)')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(3);
  
  if (error) {
    console.error("❌ [REPAIR] Database error:", error);
    throw error;
  }
  
  console.log(`📊 [REPAIR] Found ${data?.length || 0} tracks needing repair`);
  return data || [];
}

/**
 * Repair a single track's image
 */
async function repairTrackImage(track: any) {
  console.log(`🔧 [REPAIR] Regenerating image for track ${track.id}`);
  
  if (!track.extended_prompt_image) {
    console.log(`[REPAIR] ❌ Skipped — no extended_prompt_image for track ${track.id}`);
    return false;
  }
  
  try {
    // Generate new image synchronously
    const result = await generateImage(track.extended_prompt_image);
    
    if (!result.imageUrl) {
      console.log(`[REPAIR] ❌ Skipped — image invalid for track ${track.id}`);
      return false;
    }
    
    // Verify the image dimensions
    const verified = await verifyAndUpscaleTo2K(result.imageUrl, { width: 2048, height: 1152 });
    
    if (verified.width >= 2048 && verified.height >= 1152) {
      // Update the track with the new image
      const { error: updateError } = await supabase
        .from('tracks')
        .update({
          image_url: result.imageUrl,
          resolution: '2048x1152',
          updated_at: new Date().toISOString()
        })
        .eq('id', track.id);
      
      if (updateError) {
        console.error(`❌ [REPAIR] Database update error for track ${track.id}:`, updateError);
        return false;
      }
      
      console.log(`[REPAIR] ✅ Image fixed for track ${track.id}`);
      return true;
    } else {
      console.log(`[REPAIR] ❌ Skipped — image invalid for track ${track.id} (${verified.width}x${verified.height})`);
      return false;
    }
  } catch (error: any) {
    console.error(`❌ [REPAIR] Error repairing track ${track.id}:`, error.message);
    return false;
  }
}

/**
 * Main repair function
 */
export async function repairTracks() {
  console.log("🚀 [REPAIR] Starting track repair process...");
  console.log(`⏰ [REPAIR] Started at ${new Date().toISOString()}`);
  
  try {
    const tracks = await findTracksNeedingRepair();
    
    if (tracks.length === 0) {
      console.log("✅ [REPAIR] No tracks need repair!");
      return;
    }
    
    console.log(`\n📋 [REPAIR] Processing ${tracks.length} tracks:\n`);
    
    let fixed = 0;
    let skipped = 0;
    let failed = 0;
    
    for (const track of tracks) {
      console.log(`\n--- Processing track ${track.id} ---`);
      console.log(`Title: ${track.title || 'N/A'}`);
      console.log(`Current image_url: ${track.image_url || 'NULL'}`);
      console.log(`Current resolution: ${track.resolution || 'NULL'}`);
      
      const success = await repairTrackImage(track);
      
      if (success) {
        fixed++;
      } else if (track.extended_prompt_image) {
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
  } catch (error: any) {
    console.error("❌ [REPAIR] Fatal error:", error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  repairTracks()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ [REPAIR] Script failed:", error);
      process.exit(1);
    });
}




