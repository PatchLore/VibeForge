/**
 * One-off repair script for a specific track
 * 
 * Usage:
 * TRACK_ID=0ed159ad-3dcd-4e2d-ad88-29e899685f62 npx tsx scripts/repair-specific-track.ts
 * 
 * Or modify the TRACK_ID constant in this file
 */

import { createClient } from "@supabase/supabase-js";
import { generateImage, verifyAndUpscaleTo2K } from "../src/lib/kie";

const TRACK_ID = process.env.TRACK_ID || "0ed159ad-3dcd-4e2d-ad88-29e899685f62";

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

async function repairSpecificTrack() {
  console.log(`🔧 [REPAIR] Starting one-off repair for track ${TRACK_ID}`);
  console.log(`⏰ [REPAIR] Started at ${new Date().toISOString()}`);
  
  try {
    // Fetch the track
    console.log(`🔍 [REPAIR] Fetching track ${TRACK_ID}...`);
    
    const { data: track, error: fetchError } = await supabase
      .from('tracks')
      .select('id, title, prompt, extended_prompt_image, image_url, resolution, status')
      .eq('id', TRACK_ID)
      .maybeSingle();
    
    if (fetchError) {
      console.error(`❌ [REPAIR] Database fetch error:`, fetchError);
      throw fetchError;
    }
    
    if (!track) {
      console.error(`❌ [REPAIR] Track not found: ${TRACK_ID}`);
      process.exit(1);
    }
    
    console.log(`📋 [REPAIR] Track found: ${track.title || 'N/A'}`);
    console.log(`   Current image_url: ${track.image_url || 'NULL'}`);
    console.log(`   Current resolution: ${track.resolution || 'NULL'}`);
    
    // Check if track has prompt for regeneration
    if (!track.extended_prompt_image) {
      console.log(`❌ [REPAIR] No extended_prompt_image available`);
      process.exit(1);
    }
    
    console.log(`🎨 [REPAIR] Using prompt: ${track.extended_prompt_image.substring(0, 100)}...`);
    
    // Generate new image synchronously
    console.log(`🖼️ [REPAIR] Generating new image...`);
    const result = await generateImage(track.extended_prompt_image);
    
    if (!result.imageUrl) {
      console.log(`❌ [REPAIR] No image URL returned from generator`);
      process.exit(1);
    }
    
    console.log(`✅ [REPAIR] Image generated: ${result.imageUrl}`);
    
    // Verify the image dimensions
    console.log(`🔍 [REPAIR] Verifying image dimensions...`);
    const verified = await verifyAndUpscaleTo2K(result.imageUrl, { width: 2048, height: 1152 });
    
    console.log(`📏 [REPAIR] Verified size: ${verified.width}x${verified.height}`);
    
    if (verified.width >= 2048 && verified.height >= 1152) {
      // Update the track with the new image
      console.log(`💾 [REPAIR] Image valid, updating database...`);
      
      const { error: updateError } = await supabase
        .from('tracks')
        .update({
          image_url: result.imageUrl,
          resolution: '2048x1152',
          updated_at: new Date().toISOString()
        })
        .eq('id', TRACK_ID);
      
      if (updateError) {
        console.error(`❌ [REPAIR] Database update error:`, updateError);
        process.exit(1);
      }
      
      console.log(`✅ [REPAIR] Track ${TRACK_ID} successfully repaired!`);
      console.log(`\n📊 Summary:`);
      console.log(`   Old image: ${track.image_url || 'NULL'}`);
      console.log(`   New image: ${result.imageUrl}`);
      console.log(`   Old resolution: ${track.resolution || 'NULL'}`);
      console.log(`   New resolution: 2048x1152`);
      console.log(`   Verified: ${verified.width}x${verified.height}`);
      console.log(`⏰ [REPAIR] Finished at ${new Date().toISOString()}`);
    } else {
      console.log(`❌ [REPAIR] Image too small: ${verified.width}x${verified.height}`);
      console.log(`   Expected: 2048x1152 minimum`);
      process.exit(1);
    }
    
  } catch (error: any) {
    console.error(`❌ [REPAIR] Fatal error:`, error);
    process.exit(1);
  }
}

// Run
repairSpecificTrack()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ [REPAIR] Script failed:", error);
    process.exit(1);
  });

