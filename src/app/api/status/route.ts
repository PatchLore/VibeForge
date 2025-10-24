import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Check if the track is completed in the database
    const { data, error } = await supabase
      .from('generated_tracks')
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (error) {
      // Track not found or still processing
      return NextResponse.json({
        status: 'processing',
        message: 'Generation in progress...'
      });
    }

    if (data.status === 'completed') {
      return NextResponse.json({
        status: 'completed',
        audioUrl: data.audio_url,
        imageUrl: data.image_url,
        message: 'Generation completed!'
      });
    } else if (data.status === 'failed') {
      return NextResponse.json({
        status: 'failed',
        message: 'Generation failed. Please try again.'
      });
    }

    return NextResponse.json({
      status: 'processing',
      message: 'Generation in progress...'
    });

  } catch (error) {
    console.error('❌ Status check error:', error);
    return NextResponse.json(
      { error: 'Status check failed' },
      { status: 500 }
    );
  }
}
