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

    // Parse incoming body safely
    const callbackData = body.data;
    const taskId = callbackData?.task_id;
    const callbackType = callbackData?.callbackType || callbackData?.type;
    const status = callbackData?.status;
    const songs = callbackData?.data || [];
    
    console.log('📊 Callback Summary:');
    console.log('   - Type:', callbackType);
    console.log('   - Status:', status);
    console.log('   - Task ID:', taskId);
    console.log('   - Songs Count:', songs.length);
    
    // Validation: Require task_id
    if (!taskId) {
      console.error('❌ Missing task_id in callback');
      return NextResponse.json(
        { error: 'Missing task_id' },
        { status: 400 }
      );
    }
    
    // Handle processing/queued callbacks - don't save anything yet
    if (!callbackType || callbackType === "processing" || callbackType === "queued" || status === "processing" || status === "queued") {
      console.log(`🕒 Audio still processing for task ${taskId}...`);
      console.log(`   - Type: ${callbackType || 'undefined'}`);
      console.log(`   - Status: ${status || 'undefined'}`);
      return NextResponse.json({ 
        success: true, 
        received: true, 
        status: "processing",
        message: 'Callback received, music still processing' 
      });
    }
    
    // Handle failed callbacks
    if (callbackType === 'failed' || status === 'failed' || status === 'error') {
      console.error('❌ Music generation failed:', callbackData);
      console.log(`   - Task ID: ${taskId}`);
      console.log(`   - Type: ${callbackType}`);
      console.log(`   - Status: ${status}`);
      
      // Store failure status (optional)
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
        console.error('❌ Database error storing failure:', dbError);
      }
      
      console.log('🎵 ========== END CALLBACK (FAILED) ==========');
      return NextResponse.json({ 
        success: false, 
        message: 'Music generation failed' 
      }, { status: 400 });
    }
    
    // Handle completed callbacks - find the first song with audio_url
    const completedSong = songs.find((song: any) => song.audio_url && song.audio_url !== '');
    
    if (completedSong) {
      console.log('✅ Music generation completed!');
      console.log('   - Audio URL:', completedSong.audio_url);
      console.log('   - Image URL:', completedSong.image_url);
      console.log('   - Title:', completedSong.title);
      console.log('   - Duration:', completedSong.duration);
      
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
      
      console.log('🎵 ========== END CALLBACK (SUCCESS) ==========');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Music generation completed successfully' 
      });
    } else {
      // Callback received but no completed song yet (unexpected state)
      console.log('⏳ Callback received, but no audio_url found in songs.');
      console.log(`   - Callback type: ${callbackType || 'undefined'}`);
      console.log(`   - Status: ${status || 'undefined'}`);
      console.log(`   - Songs array length: ${songs.length}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Callback received, waiting for audio' 
      });
    }

  } catch (error) {
    console.error('❌ Callback error:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Callback processing failed' },
      { status: 500 }
    );
  }
}
