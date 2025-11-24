import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * One-off repair endpoint for a specific track by ID
 * 
 * Usage: GET /api/repair-track/{trackId}
 */

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: trackId } = await params;
  
  console.log(`🔧 [REPAIR] Starting one-off repair for track ${trackId}`);
  console.log(`⏰ [REPAIR] Started at ${new Date().toISOString()}`);
  
  try {
    if (!supabaseServer) {
      throw new Error("Supabase not initialized");
    }
    
    // Fetch the track
    console.log(`🔍 [REPAIR] Fetching track ${trackId}...`);
    
    const { data: track, error: fetchError } = await supabaseServer
      .from('tracks')
      .select('id, title, prompt, extended_prompt_image, image_url, resolution, status')
      .eq('id', trackId)
      .maybeSingle();
    
    if (fetchError) {
      console.error(`❌ [REPAIR] Database fetch error:`, fetchError);
      throw fetchError;
    }
    
    if (!track) {
      console.error(`❌ [REPAIR] Track not found: ${trackId}`);
      return NextResponse.json({
        success: false,
        error: "Track not found"
      }, { status: 404 });
    }
    
    console.log(`📋 [REPAIR] Track found: ${track.title || 'N/A'}`);
    console.log(`   Current image_url: ${track.image_url || 'NULL'}`);
    console.log(`   Current resolution: ${track.resolution || 'NULL'}`);
    
    // Check if track has prompt for regeneration
    if (!track.extended_prompt_image) {
      console.log(`❌ [REPAIR] No extended_prompt_image available`);
      return NextResponse.json({
        success: false,
        error: "No extended_prompt_image available for this track"
      }, { status: 400 });
    }
    
    console.log(`🎨 [REPAIR] Using prompt: ${track.extended_prompt_image.substring(0, 100)}...`);
    console.log(`📝 [REPAIR] Full prompt length: ${track.extended_prompt_image.length} characters`);
    
    // Generate new image via /api/generate (Runware/DeepInfra)
    console.log(`🖼️ [REPAIR] Calling /api/generate with prompt...`);
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const imageResponse = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: track.extended_prompt_image,
        modelId: 'stabilityai/sdxl-turbo',
        width: 1344,
        height: 768,
      }),
    });
    
    if (!imageResponse.ok) {
      const errorData = await imageResponse.json().catch(() => ({}));
      console.log(`❌ [REPAIR] Image generation failed:`, errorData);
      return NextResponse.json({
        success: false,
        error: "Image generation failed",
        details: errorData
      }, { status: 500 });
    }
    
    const imageData = await imageResponse.json();
    const imageUrl = imageData.image;
    
    console.log(`📦 [REPAIR] /api/generate returned:`, {
      hasImageUrl: !!imageUrl,
      preview: imageUrl ? imageUrl.substring(0, 100) + '...' : null
    });
    
    if (!imageUrl) {
      console.log(`❌ [REPAIR] /api/generate returned no image`);
      return NextResponse.json({
        success: false,
        error: "Image generation failed - no result returned"
      }, { status: 500 });
    }
    
    console.log(`✅ [REPAIR] Image generated successfully`);
    console.log(`🔗 [REPAIR] Image URL: ${imageUrl.substring(0, 100)}...`);
    
    // Update the track with the new image
    console.log(`💾 [REPAIR] Image valid, updating database...`);
    
    const { error: updateError } = await supabaseServer
      .from('tracks')
      .update({
        image_url: imageUrl,
        resolution: '1344x768',
        updated_at: new Date().toISOString()
      })
      .eq('id', trackId);
    
    if (updateError) {
      console.error(`❌ [REPAIR] Database update error:`, updateError);
      return NextResponse.json({
        success: false,
        error: "Database update failed",
        details: updateError
      }, { status: 500 });
    }
    
    console.log(`✅ [REPAIR] Track ${trackId} successfully repaired!`);
    
    return NextResponse.json({
      success: true,
      message: "Track repaired successfully",
      track: {
        id: trackId,
        title: track.title,
        oldImageUrl: track.image_url,
        oldResolution: track.resolution,
        newImageUrl: imageUrl,
        newResolution: '1344x768'
      }
    });
    
  } catch (error: any) {
    console.error(`❌ [REPAIR] Fatal error:`, error);
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error"
    }, { status: 500 });
  }
}

