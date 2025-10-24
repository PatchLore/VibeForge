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
      
      // Store the completed music in Supabase for the user to retrieve
      try {
        const { data: insertData, error } = await supabase
          .from('generated_tracks')
          .insert({
            task_id: taskId,
            audio_url: data.audioUrl,
            image_url: data.imageUrl || null,
            status: 'completed',
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
      
      return NextResponse.json({ 
        success: true, 
        message: 'Music generation completed successfully' 
      });
    } else if (status === 'failed') {
      console.error('❌ Music generation failed:', data);
      
      // Store failure status
      try {
        await supabase
          .from('generated_tracks')
          .insert({
            task_id: taskId,
            status: 'failed',
            created_at: new Date().toISOString()
          });
      } catch (dbError) {
        console.error('❌ Database error:', dbError);
      }
      
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
