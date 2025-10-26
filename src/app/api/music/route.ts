import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateMusic, checkMusicStatus, generateImage } from "@/lib/kie";
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
    const body = await req.json();
    console.log("📝 Request body:", body);
    const { prompt, userId } = body;
    console.log("📝 Extracted prompt:", prompt);

    const userVibe = prompt || "calm";
    
    // Check if credit system is enabled and user is authenticated
    const creditSystemEnabled = process.env.NEXT_PUBLIC_CREDIT_SYSTEM_ENABLED === 'true';
    
    if (creditSystemEnabled && userId && supabaseAdmin) {
      console.log("💎 Credit system enabled, checking user credits...");
      
      // Check if user has enough credits using the RPC function
      const { data: spendRows, error } = await supabaseAdmin.rpc("spend_credits", { cost: 12 });
      
      if (error) {
        console.error("❌ Error checking credits:", error);
        return NextResponse.json({
          success: false,
          message: "❌ Unable to verify credits. Please try again."
        }, { status: 400 });
      }
      
      if (!spendRows || spendRows.length === 0) {
        console.warn('⚠️ Insufficient credits for user:', userId);
        return NextResponse.json({
          success: false,
          message: "💎 Not enough credits (need 12)."
        }, { status: 403 });
      }
      
      console.log(`✅ Credits deducted successfully. Remaining: ${spendRows[0]?.credits || 0}`);
    }
    
    // Expand the user's vibe into detailed prompts
    const { musicPrompt, artPrompt } = generateExpandedPrompt(userVibe);
    
    console.log("🎵 Expanded Music Prompt:", musicPrompt);
    console.log("🎨 Expanded Art Prompt:", artPrompt);

    // Step 1: Generate music using the expanded prompt
    console.log("🎵 Starting music generation...");
    const taskId = await generateMusic(musicPrompt);
    console.log("Task ID:", taskId);

    // Return immediately with task ID - Vercel has 5-minute timeout limit
    // The generation happens in the background via the API's callback system
    return NextResponse.json({
      success: true,
      provider: "suno-api",
      taskId: taskId,
      message: "🎶 Composing your SoundPainting… this usually takes about 1–2 minutes.",
      prompt: userVibe,
      expandedPrompts: {
        music: musicPrompt,
        art: artPrompt
      },
      remainingCredits: creditSystemEnabled && userId ? await getRemainingCredits(userId) : undefined
    });

  } catch (err: unknown) {
    console.error("SoundPainting error:", err);

    // Return professional error message instead of fallback audio
    return NextResponse.json({
      success: false,
      message: "🎵 SoundPainting generation is temporarily unavailable. Please try again in a few moments.",
    }, { status: 503 });
  }
}

// Helper function to get remaining credits
async function getRemainingCredits(userId: string) {
  if (!supabaseAdmin) return null;
  
  try {
    const { data, error } = await supabaseAdmin.rpc("get_credits");
    if (error) {
      console.error("Error getting remaining credits:", error);
      return null;
    }
    return data?.[0]?.credits || 0;
  } catch (err) {
    console.error("Error in getRemainingCredits:", err);
    return null;
  }
}