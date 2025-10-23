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

    // Check if Replicate API key is available
    const replicateApiToken = process.env.REPLICATE_API_TOKEN;
    
    if (!replicateApiToken) {
      console.log('No Replicate API token found, using placeholder video');
      return NextResponse.json({
        visualUrl: '/videos/placeholder.html',
        vibe: vibe,
        generatedAt: new Date().toISOString(),
        type: 'video',
        isPlaceholder: true
      });
    }

    try {
      // Create prediction with Replicate Stable Video Diffusion
      const predictionResponse = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${replicateApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: "stability-ai/stable-video-diffusion:76c8a89a5e3d6a4a6e2a8b8b8b8b8b8b8b8b8b8b",
          input: {
            image: "https://replicate.delivery/pbxt/example.jpg", // You can generate this from the vibe prompt
            motion_bucket_id: 127,
            cond_aug: 0.02,
            steps: 25,
            seed: Math.floor(Math.random() * 1000000)
          }
        }),
      });

      if (!predictionResponse.ok) {
        throw new Error(`Replicate API error: ${predictionResponse.status}`);
      }

      const prediction = await predictionResponse.json();
      
      // Poll for completion
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes max
      
      while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        
        const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
          headers: {
            'Authorization': `Token ${replicateApiToken}`,
          },
        });
        
        const statusData = await statusResponse.json();
        prediction.status = statusData.status;
        prediction.output = statusData.output;
        
        attempts++;
      }

      if (prediction.status === 'succeeded' && prediction.output && prediction.output.length > 0) {
        return NextResponse.json({
          visualUrl: prediction.output[0],
          vibe: vibe,
          generatedAt: new Date().toISOString(),
          type: 'video',
          isPlaceholder: false
        });
      } else {
        throw new Error('Video generation failed or timed out');
      }

    } catch (apiError) {
      console.error('Replicate API error:', apiError);
      // Fallback to placeholder
      return NextResponse.json({
        visualUrl: '/videos/placeholder.html',
        vibe: vibe,
        generatedAt: new Date().toISOString(),
        type: 'video',
        isPlaceholder: true,
        error: 'API generation failed, using placeholder'
      });
    }

  } catch (error) {
    console.error('Error generating visual:', error);
    return NextResponse.json(
      { error: 'Failed to generate visual' },
      { status: 500 }
    );
  }
}
