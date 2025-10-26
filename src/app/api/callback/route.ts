import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = "force-dynamic";

// Create Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET() {
  return NextResponse.json({ 
    message: 'Callback endpoint is active and ready to receive API callbacks',
    endpoint: '/api/callback',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  console.log('🎧 [CALLBACK RECEIVED]', new Date().toISOString());
  console.log('🎧 [CALLBACK] Request URL:', request.url);
  console.log('🎧 [CALLBACK] Headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    const body = await request.json();
    console.log('🎧 [CALLBACK] Body:', JSON.stringify(body, null, 2));
    
    console.log('🎵 ========== CALLBACK RECEIVED ==========');
    console.log('⏰ Timestamp:', new Date().toISOString());

    // Parse API callback format
    const callbackData = body.data;
    const taskId = callbackData?.task_id;
    const callbackType = callbackData?.callbackType;
    const songs = callbackData?.data || [];
    
    console.log('📊 Callback Summary:');
    console.log('   - Type:', callbackType);
    console.log('   - Task ID:', taskId);
    console.log('   - Songs Count:', songs.length);
    
    // Find the first song with audio_url (completed)
    const completedSong = songs.find((song: any) => song.audio_url && song.audio_url !== '');
    
    if (completedSong) {
      console.log('✅ Music generation completed!');
      console.log('   - Audio URL:', completedSong.audio_url);
      console.log('   - Image URL:', completedSong.image_url);
      console.log('   - Title:', completedSong.title);
      
      // Store the completed music in Supabase tracks table
      try {
        // Fetch the user_id from generation_tasks table using task_id
        console.log('🔍 Looking up user mapping for task_id:', taskId);
        let userId = null;
        const { data: mapping, error: mappingError } = await supabase
          .from('generation_tasks')
          .select('user_id')
          .eq('task_id', taskId)
          .single();
        
        if (!mappingError && mapping) {
          userId = mapping.user_id;
          console.log('✅ Found user mapping - user_id:', userId);
        } else {
          console.warn('⚠️ No user mapping found for task_id:', taskId);
          console.warn('   - Error:', mappingError);
        }

        // Extract mood from prompt (first word)
        const prompt = completedSong.prompt || 'Generated SoundPainting';
        const mood = prompt.split(' ')[0].toLowerCase();
        
        console.log('💾 Saving track to database...');
        const trackData = {
          task_id: taskId,
          user_id: userId,
          title: completedSong.title || `Soundswoop - ${new Date().toLocaleDateString()}`,
          prompt: prompt,
          audio_url: completedSong.audio_url,
          image_url: completedSong.image_url || null,
          mood: mood,
          likes: 0,
          duration: completedSong.duration || 600,
          created_at: new Date().toISOString()
        };
        console.log('📦 Track Data:', JSON.stringify(trackData, null, 2));
        
        const { data: insertData, error } = await supabase
          .from('tracks')
          .insert(trackData);

        if (error) {
          console.error('❌ Database insert error:', error);
        } else {
          console.log('✅ Track saved to database successfully');
          console.log('   - Inserted data:', insertData);
          
          // Optionally delete the mapping after successful insert to keep the table clean
          if (userId) {
            await supabase
              .from('generation_tasks')
              .delete()
              .eq('task_id', taskId);
            console.log('✅ Task mapping deleted for task:', taskId);
          }
        }
      } catch (dbError) {
        console.error('❌ Database error:', dbError);
      }
      
      console.log('🎵 ========== END CALLBACK ==========');
      
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
