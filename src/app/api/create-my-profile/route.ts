import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST() {
  try {
    const userId = "38caaf3e-5735-4622-bc39-d72a7ba37fb6";
    
    console.log("🔧 Creating profile using service role client...");
    
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client not initialized" }, { status: 500 });
    }
    
    // Use service role client to bypass RLS
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: userId,
        email: 'allendunn815@yahoo.com',
        credits: 36,
        plan: 'free'
      })
      .select('*');
    
    console.log("👤 Profile creation result:", profileData);
    console.log("❌ Profile creation error:", profileError);
    
    if (profileError) {
      return NextResponse.json({ 
        error: profileError.message,
        code: profileError.code 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      profile: profileData
    });
    
  } catch (error) {
    console.error("❌ Profile creation error:", error);
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
  }
}
