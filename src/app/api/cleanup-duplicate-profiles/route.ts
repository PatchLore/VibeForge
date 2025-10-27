import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const userId = "38caaf3e-5735-4622-bc39-d72a7ba37fb6";
    
    console.log("🧹 Cleaning up duplicate profiles...");
    
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client not initialized" }, { status: 500 });
    }
    
    // Get all profiles for this user
    const { data: allProfiles, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', userId);
    
    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    
    console.log("📊 Found profiles:", allProfiles);
    
    if (!allProfiles || allProfiles.length <= 1) {
      return NextResponse.json({ 
        message: "No duplicates found",
        profiles: allProfiles 
      });
    }
    
    // Delete all except the most recent one (with email)
    const profilesToDelete = allProfiles
      .filter(p => !p.email || p.email !== 'allendunn815@yahoo.com')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    // Keep the newest profile with email
    const profileToKeep = allProfiles
      .filter(p => p.email === 'allendunn815@yahoo.com')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    
    console.log("🗑️ Profiles to delete:", profilesToDelete.map(p => ({ id: p.id, created_at: p.created_at, credits: p.credits })));
    console.log("✅ Profile to keep:", profileToKeep ? { id: profileToKeep.id, created_at: profileToKeep.created_at, credits: profileToKeep.credits } : 'None');
    
    // Delete duplicate profiles
    const deleteResults = [];
    for (const profile of profilesToDelete) {
      const { data: deleted, error: deleteError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', profile.id)
        .select('*');
      
      deleteResults.push({
        deleted: deleted,
        error: deleteError
      });
    }
    
    // Get remaining profiles
    const { data: remainingProfiles } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', userId);
    
    return NextResponse.json({
      success: true,
      deletedProfiles: profilesToDelete.length,
      remainingProfiles,
      deleteResults
    });
    
  } catch (error) {
    console.error("❌ Cleanup error:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}


