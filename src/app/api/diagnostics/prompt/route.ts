import { NextResponse } from "next/server";
import { buildMusicPrompt, buildImagePrompt } from "@/lib/enrichPrompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({
        success: false,
        message: "Missing query parameter 'q'"
      }, { status: 400 });
    }

    console.log("🔍 [DIAGNOSTICS] Testing prompt generation for:", query);

    // Generate both prompts
    const musicPrompt = buildMusicPrompt(query);
    const imagePrompt = buildImagePrompt(query);

    // Add explicit guards
    if (!musicPrompt || musicPrompt.length < 12) {
      console.error("❌ [MUSIC PROMPT MISSING]", { query, musicPrompt });
    }

    if (!imagePrompt || imagePrompt.length < 12) {
      console.error("❌ [IMAGE PROMPT MISSING]", { query, imagePrompt });
    }

    const result = {
      success: true,
      query: query,
      musicPrompt: musicPrompt,
      imagePrompt: imagePrompt,
      length: {
        music: musicPrompt.length,
        image: imagePrompt.length
      },
      timestamp: new Date().toISOString()
    };

    console.log("✅ [DIAGNOSTICS] Prompt generation successful:", {
      musicLength: musicPrompt.length,
      imageLength: imagePrompt.length,
      musicPreview: musicPrompt.substring(0, 100) + "...",
      imagePreview: imagePrompt.substring(0, 100) + "..."
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error("❌ [DIAGNOSTICS] Error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}


