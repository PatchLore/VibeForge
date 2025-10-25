import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_KEY 
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
  : null;

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({ tracks: [], error: "Database not configured" });
    }

    const { data, error } = await supabase
      .from("tracks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ tracks: [], error: error.message });
    }

    return NextResponse.json({ tracks: data || [] });
  } catch (e) {
    return NextResponse.json({ tracks: [], error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
