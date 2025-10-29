import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

    // Dual-key mapping (snake_case + camelCase) to match /api/tracks/popular
    const formattedTracks = deduplicatedTracks.map((t: any) => {
      const audioUrl = t.audio_url ?? null;
      const imageUrl = t.image_url ?? null;
      const extendedPrompt = t.extended_prompt ?? '';
      const extendedPromptImage = t.extended_prompt_image ?? '';

      return {
        id: t.id,
        title: t.title || 'Untitled Track',

        // snake_case (legacy)
        audio_url: t.audio_url ?? null,
        image_url: t.image_url ?? null,
        extended_prompt: extendedPrompt,
        extended_prompt_image: extendedPromptImage,
        created_at: t.created_at,
        user_id: t.user_id,

        // camelCase (current)
        audioUrl,
        imageUrl,
        extendedPrompt,
        extendedPromptImage,
        generatedAt: t.created_at,
        userId: t.user_id,

        // general fields
        prompt: t.prompt ?? '',
        vibe: t.vibe ?? null,
        mood: t.vibe ?? t.prompt ?? 'Unknown mood',
        summary: t.summary ?? '',
        status: t.status ?? 'completed',
        duration: t.duration || 600,
        likes: t.likes ?? 0,
      };
    });

    return NextResponse.json({ tracks: formattedTracks });
  } catch (e) {
    console.error("Unexpected error fetching user tracks:", e);
    return NextResponse.json({ tracks: [], error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}

