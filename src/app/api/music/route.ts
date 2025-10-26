import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateMusic, checkMusicStatus, generateImage } from "@/lib/kie";
import { generateExpandedPrompt } from "@/lib/promptExpansion";
import { deductCredits, getUserCredits, getOrCreateUser, CREDITS_PER_GENERATION } from "@/lib/credits";

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
    
    // Check and deduct credits
    if (userId) {
      const userCredits = await getUserCredits(userId);
      
      if (!userCredits || userCredits.credits < CREDITS_PER_GENERATION) {
        console.warn('⚠️ Insufficient credits:', userCredits?.credits);
        const errorResponse = NextResponse.json({
          success: false,
          error: 'INSUFFICIENT_CREDITS',
          message: `Not enough credits. You need ${CREDITS_PER_GENERATION} credits to generate music. You have ${userCredits?.credits || 0} credits.`,
          credits: userCredits?.credits || 0
        }, { status: 403 });
        errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        return errorResponse;
      }

      // Deduct credits
      const deducted = await deductCredits(userId, CREDITS_PER_GENERATION);
      if (!deducted) {
        console.error('❌ Failed to deduct credits');
        const errorResponse = NextResponse.json({
          success: false,
          error: 'CREDIT_DEDUCTION_FAILED',
          message: 'Failed to process credits. Please try again.'
        }, { status: 500 });
        errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        return errorResponse;
      }

      console.log(`✅ Deducted ${CREDITS_PER_GENERATION} credits from user ${userId}`);
    }
    
    // Expand the user's vibe into detailed prompts
    const { musicPrompt, artPrompt } = generateExpandedPrompt(userVibe);
    
    console.log("🎵 Expanded Music Prompt:", musicPrompt);
    console.log("🎨 Expanded Art Prompt:", artPrompt);

    // Step 1: Generate music using the expanded prompt
    console.log("🎵 Starting music generation...");
    const taskId = await generateMusic(musicPrompt);
    console.log("Task ID:", taskId);

    // Fetch remaining credits after deduction
    let remainingCredits = 0;
    if (userId) {
      const updatedCredits = await getUserCredits(userId);
      remainingCredits = updatedCredits?.credits || 0;
      console.log(`💎 Remaining credits after deduction: ${remainingCredits}`);
    }

    // Return immediately with task ID - Vercel has 5-minute timeout limit
    // The generation happens in the background via the API's callback system
    const response = NextResponse.json({
      success: true,
      provider: "suno-api",
      taskId: taskId,
      message: "🎶 Composing your SoundPainting… this usually takes about 1–2 minutes.",
      prompt: userVibe,
      expandedPrompts: {
        music: musicPrompt,
        art: artPrompt
      },
      remainingCredits: remainingCredits
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