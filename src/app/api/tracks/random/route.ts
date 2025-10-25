import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Only create Supabase client if environment variables are available
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_KEY 
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
  : null;

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({ track: null, error: "Database not configured" });
    }

    const { data, error } = await supabase
      .from("tracks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data?.length)
      return NextResponse.json({ track: null, error: "No tracks yet" });

    const random = data[Math.floor(Math.random() * data.length)];
    return NextResponse.json({ track: random });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}

