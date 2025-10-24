import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🎵 Kie.ai callback received:', JSON.stringify(body, null, 2));

    // Extract the generated music data
    const { taskId, status, data } = body;
    
    if (status === 'completed' && data?.audioUrl) {
      console.log('✅ Music generation completed:', data.audioUrl);
      
      // Here you could save to database, notify users, etc.
      // For now, just log the success
      return NextResponse.json({ 
        success: true, 
        message: 'Music generation completed successfully' 
      });
    } else if (status === 'failed') {
      console.error('❌ Music generation failed:', data);
      return NextResponse.json({ 
        success: false, 
        message: 'Music generation failed' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Callback received' 
    });

  } catch (error) {
    console.error('❌ Callback error:', error);
    return NextResponse.json(
      { error: 'Callback processing failed' },
      { status: 500 }
    );
  }
}
