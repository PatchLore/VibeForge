import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

export async function GET() {
  console.log("🪙 No credits deducted for playback.");
  try {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log("🎧 MyTracks fetch → Not authenticated");
      return NextResponse.json({ tracks: [], error: "Not authenticated" }, { status: 401 });
    }

    console.log("🧠 Fetching tracks for user:", user.id);

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

    // Fetch ONLY tracks belonging to the current user
    const { data, error } = await supabaseAdmin
      .from("tracks")
      .select("*")
      .eq('user_id', user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("❌ Error fetching user tracks:", error);
      return NextResponse.json({ tracks: [], error: error.message });
    }

    console.log(`🎧 MyTracks fetch → ${data?.length || 0} results (before deduplication)`);
    
    const deduplicatedTracks = data?.reduce((acc: any[], track: any) => {
      const existingIndex = acc.findIndex(
        (t) => 
          (track.task_id && t.task_id === track.task_id) || 
          (track.audio_url && t.audio_url === track.audio_url)
      );
      
      if (existingIndex === -1) {
        acc.push(track);
      } else {
        const existing = acc[existingIndex];
        const existingDate = new Date(existing.created_at).getTime();
        const newDate = new Date(track.created_at).getTime();
        
        if (!existing.audio_url && track.audio_url) {
          acc[existingIndex] = track;
        } else if (!track.audio_url && existing.audio_url) {
          // Keep existing
        } else if (newDate > existingDate) {
          acc[existingIndex] = track;
        }
      }
      
      return acc;
    }, []) || [];

    console.log(`🎧 MyTracks fetch → ${deduplicatedTracks.length} results (after deduplication)`);
    
    if (deduplicatedTracks.length > 0) {
      console.log("🎧 First track:", deduplicatedTracks[0].title, deduplicatedTracks[0].audio_url ? "has audio" : "no audio");
    }

    return NextResponse.json({ tracks: deduplicatedTracks });
  } catch (e) {
    console.error("Unexpected error fetching user tracks:", e);
    return NextResponse.json({ tracks: [], error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}

