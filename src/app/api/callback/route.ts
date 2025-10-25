import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ 
    message: 'Callback endpoint is active and ready to receive Kie.ai callbacks',
    endpoint: '/api/callback',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🎵 Kie.ai callback received:', JSON.stringify(body, null, 2));

    // Parse Kie.ai callback format
    const callbackData = body.data;
    const taskId = callbackData?.task_id;
    const callbackType = callbackData?.callbackType;
    const songs = callbackData?.data || [];
    
    console.log('📊 Callback type:', callbackType);
    console.log('📊 Task ID:', taskId);
    console.log('📊 Songs received:', songs.length);
    
    // Find the first song with audio_url (completed)
    const completedSong = songs.find((song: any) => song.audio_url && song.audio_url !== '');
    
    if (completedSong) {
      console.log('✅ Music generation completed:', completedSong.audio_url);
      
      // Store the completed music in Supabase tracks table
      if (supabase) {
        try {
          const { data: insertData, error } = await supabase
            .from('tracks')
            .insert({
              task_id: taskId,
              title: completedSong.title || `SoundPainting - ${new Date().toLocaleDateString()}`,
              prompt: completedSong.prompt || 'Generated SoundPainting',
              audio_url: completedSong.audio_url,
              image_url: completedSong.image_url || null,
              duration: completedSong.duration || 600,
              created_at: new Date().toISOString()
            });

          if (error) {
            console.error('❌ Database insert error:', error);
          } else {
            console.log('✅ Music saved to database:', insertData);
          }
        } catch (dbError) {
          console.error('❌ Database error:', dbError);
        }
      } else {
        console.warn('⚠️ Supabase client not initialized - skipping database storage');
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Music generation completed successfully' 
      });
    } else if (callbackType === 'failed') {
      console.error('❌ Music generation failed:', callbackData);
      
      // Store failure status
      if (supabase) {
        try {
          await supabase
            .from('tracks')
            .insert({
              task_id: taskId,
              title: 'Failed Generation',
              prompt: 'Generation failed',
              audio_url: null,
              image_url: null,
              duration: 0,
              created_at: new Date().toISOString()
            });
        } catch (dbError) {
          console.error('❌ Database error:', dbError);
        }
      } else {
        console.warn('⚠️ Supabase client not initialized - skipping failure storage');
      }
      
      return NextResponse.json({ 
        success: false, 
        message: 'Music generation failed' 
      }, { status: 400 });
    } else {
      // Callback received but no completed song yet (still processing)
      console.log('⏳ Callback received, but audio still processing. Callback type:', callbackType);
      return NextResponse.json({ 
        success: true, 
        message: 'Callback received, music still processing' 
      });
    }

  } catch (error) {
    console.error('❌ Callback error:', error);
    return NextResponse.json(
      { error: 'Callback processing failed' },
      { status: 500 }
    );
  }
}
