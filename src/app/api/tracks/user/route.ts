import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get the current user from session
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ tracks: [], error: "Not authenticated" }, { status: 401 });
    }

    // Use service role client to fetch all tracks (bypassing RLS if needed)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Fetch tracks for the user
    // Note: Includes tracks with user_id matching the current user OR null (for backwards compatibility with old tracks)
    const { data, error } = await supabaseAdmin
      .from("tracks")
      .select("*")
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching user tracks:", error);
      return NextResponse.json({ tracks: [], error: error.message });
    }

    return NextResponse.json({ tracks: data || [] });
  } catch (e) {
    console.error("Unexpected error fetching user tracks:", e);
    return NextResponse.json({ tracks: [], error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
