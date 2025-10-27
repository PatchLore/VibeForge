import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = "force-dynamic";

// Allow this endpoint to be public (no auth required)
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ 
    message: 'Callback endpoint is active and ready to receive API callbacks',
    endpoint: '/api/callback',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🎵 [CALLBACK RECEIVED] Full payload:', JSON.stringify(body, null, 2));

    // Parse API callback format
    const callbackData = body.data;
    const taskId = callbackData?.task_id;
    const callbackType = callbackData?.callbackType;
    const songs = callbackData?.data || [];
    
    console.log('📊 [CALLBACK] Type:', callbackType);
    console.log('📊 [CALLBACK] Task ID:', taskId);
    console.log('📊 [CALLBACK] Songs received:', songs.length);
    
    if (!taskId) {
      console.error('❌ [CALLBACK FAIL] Missing task_id');
      return NextResponse.json({ success: false, error: 'Missing task_id' }, { status: 400 });
    }
    
    // Find the first song with audio_url (completed)
    const completedSong = songs.find((song: any) => song.audio_url && song.audio_url !== '');
    
    if (completedSong) {
      console.log('✅ [CALLBACK SUCCESS] Music generation completed:', completedSong.audio_url);
      
      // Store the completed music in Supabase tracks table
      if (supabaseServer) {
        try {
          // First, find the user_id for this task_id from the pending track
          const { data: pendingTrack } = await supabaseServer
            .from('tracks')
            .select('user_id, prompt')
            .eq('task_id', taskId)
            .maybeSingle();
          
          const userId = pendingTrack?.user_id;
          const userPrompt = completedSong.prompt || pendingTrack?.prompt || 'Generated SoundPainting';
          const mood = userPrompt.split(' ')[0].toLowerCase();
          
          // Deduct credits only on successful generation
          if (userId) {
            console.log('💎 [CALLBACK] Deducting credits for user:', userId);
            const { data: profile } = await supabaseServer
              .from('profiles')
              .select('credits')
              .eq('user_id', userId)
              .maybeSingle();
            
            if (profile && profile.credits >= 12) {
              await supabaseServer
                .from('profiles')
                .update({ 
                  credits: profile.credits - 12,
                  updated_at: new Date().toISOString() 
                })
                .eq('user_id', userId);
              console.log('✅ [CALLBACK SUCCESS] Credits deducted. Remaining:', profile.credits - 12);
            } else {
              console.log('⚠️ [CALLBACK] Cannot deduct credits - insufficient or no profile');
            }
          }
          
          console.log('💾 [CALLBACK] Saving track to database:', {
            taskId,
            title: completedSong.title,
            prompt: userPrompt,
            audioUrl: completedSong.audio_url,
            imageUrl: completedSong.image_url
          });
          
          // Update the pending track with actual data
          const { data: insertData, error } = await supabaseServer
            .from('tracks')
            .update({
              title: completedSong.title || `Soundswoop - ${new Date().toLocaleDateString()}`,
              prompt: userPrompt,
              audio_url: completedSong.audio_url,
              image_url: completedSong.image_url || null,
              mood: mood,
              likes: 0,
              duration: completedSong.duration || 600,
              status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('task_id', taskId)
            .select('*');

          if (error) {
            console.error('❌ [CALLBACK FAIL] Database update error:', error);
            return NextResponse.json({ 
              success: false, 
              error: 'Database error',
              details: error.message 
            }, { status: 500 });
          }
          
          console.log('✅ [CALLBACK SUCCESS] Track saved:', insertData);
        } catch (dbError: any) {
          console.error('❌ [CALLBACK FAIL] Database error:', dbError);
          return NextResponse.json({ 
            success: false, 
            error: 'Database error',
            details: dbError.message 
          }, { status: 500 });
        }
      } else {
        console.warn('⚠️ [CALLBACK] Supabase server client not initialized - skipping database storage');
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Music generation completed successfully',
        taskId
      });
    } else if (callbackType === 'failed') {
      console.error('❌ [CALLBACK FAIL] Music generation failed:', callbackData);
      
      // Store failure status
      if (supabaseServer) {
        try {
          await supabaseServer
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
        } catch (dbError: any) {
          console.error('❌ [CALLBACK FAIL] Database error on failure:', dbError);
        }
      }
      
      return NextResponse.json({ 
        success: false, 
        message: 'Music generation failed',
        taskId
      }, { status: 400 });
    } else {
      // Callback received but no completed song yet (still processing)
      console.log('⏳ [CALLBACK] Callback received, but audio still processing. Callback type:', callbackType);
      return NextResponse.json({ 
        success: true, 
        message: 'Callback received, music still processing',
        taskId
      });
    }

  } catch (error: any) {
    console.error('❌ [CALLBACK FAIL] Callback processing error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Callback processing failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

