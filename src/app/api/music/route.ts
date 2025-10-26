import { NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { generateMusic, checkMusicStatus, generateImage, generateTitle } from "@/lib/kie";
import { generateExpandedPrompt } from "@/lib/promptExpansion";

export const dynamic = "force-dynamic";

export async function GET() {
  console.log("🎵 GET /api/music endpoint reached");
  return NextResponse.json({
    message: "GET works",
    endpoint: "/api/music",
    methods: ["GET", "POST"],
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: Request) {
  console.log("🎵 POST /api/music endpoint reached");
  console.log("🔍 Request method:", req.method);
  console.log("🔍 Request URL:", req.url);
  console.log("🔍 Request headers:", Object.fromEntries(req.headers.entries()));
  
  try {
    // Create authenticated Supabase client
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

    // Get the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: "Please sign in to generate music"
      }, { status: 401 });
    }

    // Set the session token for authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("❌ Authentication error:", authError);
      return NextResponse.json({
        success: false,
        message: "Please sign in to generate music"
      }, { status: 401 });
    }

    console.log("✅ User authenticated:", user.id);

    const body = await req.json();
    console.log("📝 Request body:", body);
    const { prompt } = body;
    console.log("📝 Extracted prompt:", prompt);

    const userVibe = prompt || "calm";
    
    // Check if credit system is enabled and user is authenticated
    const creditSystemEnabled = process.env.NEXT_PUBLIC_CREDIT_SYSTEM_ENABLED === 'true';
    let userCredits = 0;
    
    if (creditSystemEnabled) {
      console.log("💎 Credit system enabled, checking user credits...");
      
      // Check if user has enough credits (without deducting yet)
      const { data: creditData, error: creditError } = await supabase.rpc("get_credits");
      
      if (creditError) {
        console.error("❌ Error checking credits:", creditError);
        return NextResponse.json({
          success: false,
          message: "❌ Unable to verify credits. Please try again."
        }, { status: 400 });
      }
      
      userCredits = creditData?.[0]?.credits || 0;
      
      if (userCredits < 12) {
        console.warn('⚠️ Insufficient credits for user:', user.id, 'Available:', userCredits);
        return NextResponse.json({
          success: false,
          message: "💎 Not enough credits (need 12)."
        }, { status: 403 });
      }
      
      console.log(`✅ Credits check passed. Available: ${userCredits}`);
    }
    
    // Expand the user's vibe into detailed prompts
    const { musicPrompt, artPrompt } = generateExpandedPrompt(userVibe);
    
    console.log("🎵 Expanded Music Prompt:", musicPrompt);
    console.log("🎨 Expanded Art Prompt:", artPrompt);

    // Generate creative title for the track
    let generatedTitle = 'Generated Track';
    try {
      console.log("🎵 Generating creative title...");
      generatedTitle = await generateTitle(userVibe);
      console.log("🎵 Generated title:", generatedTitle);
    } catch (titleError) {
      console.error("❌ Title generation failed:", titleError);
      // Fallback to a simple title based on vibe
      const words = userVibe.split(' ').slice(0, 2);
      generatedTitle = words.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Generated Track';
    }

    // Step 1: Generate music using the expanded prompt
    console.log("🎵 Starting music generation...");
    const taskId = await generateMusic(musicPrompt);
    console.log("Task ID:", taskId);

    // Store the task-to-user mapping in generation_tasks table
    try {
      const { error: mappingError } = await supabase
        .from("generation_tasks")
        .insert([{ task_id: taskId, user_id: user.id }]);
      
      if (mappingError) {
        console.error("❌ Error storing task mapping:", mappingError);
      } else {
        console.log("✅ Task mapping stored successfully for task:", taskId, "user:", user.id);
      }
    } catch (mappingErr) {
      console.error("❌ Error storing task mapping:", mappingErr);
    }

    // Deduct credits AFTER successful generation start
    let remainingCredits = userCredits;
    if (creditSystemEnabled) {
      console.log("💎 Deducting credits after successful generation start...");
      
      // Use service role client to bypass RLS for credit deduction
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
      
      // Direct update to profiles table with proper user_id filter
      const { data: updatedProfile, error: deductError } = await supabaseAdmin
        .from("profiles")
        .update({
          credits: userCredits - 12,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id)
        .select("credits")
        .single();
      
      if (deductError) {
        console.error("❌ Error deducting credits:", deductError);
        console.error("❌ Deduct error details:", JSON.stringify(deductError, null, 2));
        // Don't fail the generation, just log the error
      } else if (updatedProfile) {
        remainingCredits = updatedProfile.credits;
        console.log(`✅ Credits deducted successfully. Remaining: ${remainingCredits}`);
      } else {
        console.warn("⚠️ No profile updated, keeping original credits");
      }
    }

    // Return immediately with task ID - Vercel has 5-minute timeout limit
    // The generation happens in the background via the API's callback system
    const response = NextResponse.json({
      success: true,
      provider: "suno-api",
      taskId: taskId,
      message: "🎶 Composing your SoundPainting… this usually takes about 1–2 minutes.",
      prompt: userVibe,
      title: generatedTitle,
      expandedPrompts: {
        music: musicPrompt,
        art: artPrompt
      },
      remainingCredits: creditSystemEnabled ? remainingCredits : undefined
    });

    // Prevent caching of credit balance
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (err: unknown) {
    console.error("SoundPainting error:", err);

    // Return professional error message instead of fallback audio
    return NextResponse.json({
      success: false,
      message: "🎵 SoundPainting generation is temporarily unavailable. Please try again in a few moments.",
    }, { status: 503 });
  }
}