import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { vibe } = await request.json();

    if (!vibe) {
      return NextResponse.json(
        { error: 'Vibe is required' },
        { status: 400 }
      );
    }

    // Create enhanced prompt for ambient music generation
    const musicPrompt = `ambient generative soundscape inspired by "${vibe}", no melody, no percussion, no vocals, deep evolving pads, analog warmth, soft drones, cinematic reverb tail, slow motion atmosphere, harmonic texture, calm emotion`;
    
    try {
      // Call the music generation API
      const musicResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/music`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: musicPrompt
        }),
      });

      if (!musicResponse.ok) {
        throw new Error('Music generation failed');
      }

      const musicData = await musicResponse.json();
      
      return NextResponse.json({
        audioUrl: musicData.audioUrl,
        vibe: vibe,
        duration: 600,
        generatedAt: new Date().toISOString(),
        isGenerated: !musicData.error,
        source: musicData.source || 'fallback'
      });

    } catch (apiError) {
      console.error('Music API error:', apiError);
      
      // Fallback to placeholder
      return NextResponse.json({
        audioUrl: '/audio/fallback/ambient-a.wav',
        vibe: vibe,
        duration: 600,
        generatedAt: new Date().toISOString(),
        isGenerated: false,
        source: 'fallback'
      });
    }

  } catch (error) {
    console.error('Error generating vibe:', error);
    return NextResponse.json(
      { error: 'Failed to generate vibe' },
      { status: 500 }
    );
  }
}
