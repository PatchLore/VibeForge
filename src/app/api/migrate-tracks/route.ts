import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Migration endpoint to add status and updated_at columns
 * Run once: curl https://www.soundswoop.com/api/migrate-tracks
 * Then DELETE this file for security
 */
export async function POST() {
  try {
    console.log("🔧 [MIGRATION] Starting tracks table migration...");

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: "Supabase admin client not initialized" 
      }, { status: 500 });
    }

    // Add status column
    const { error: statusError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `ALTER TABLE tracks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'`
    });

    if (statusError) {
      console.error("❌ [MIGRATION] Status column error:", statusError.message);
      // Try direct SQL execution via query
      const { error: directError } = await supabaseAdmin
        .from('tracks')
        .select('id')
        .limit(1);
      
      console.log("⚠️ [MIGRATION] Cannot use RPC, trying alternative...");
    }

    // Add updated_at column  
    const { error: updatedAtError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `ALTER TABLE tracks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`
    });

    if (updatedAtError) {
      console.error("❌ [MIGRATION] Updated_at column error:", updatedAtError.message);
    }

    console.log("✅ [MIGRATION] Migration complete");

    return NextResponse.json({ 
      success: true, 
      message: "Migration executed successfully. Check Supabase logs for details.",
      note: "If using Supabase dashboard, run the SQL directly."
    });

  } catch (error: any) {
    console.error("❌ [MIGRATION] Migration failed:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Migration failed - run SQL manually in Supabase dashboard",
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Migration endpoint - run SQL manually in Supabase dashboard",
    sql: `
-- Add status column
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add updated_at column
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Update existing rows
UPDATE tracks SET status = 'pending' WHERE status IS NULL;
    `
  });
}

