import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trackId, vote, timestamp } = body;

    console.log('📊 Feedback received:', { trackId, vote, timestamp });

    if (!supabase) {
      console.warn('⚠️ Supabase client not initialized');
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Insert feedback into Supabase
    const { data, error } = await supabase
      .from('feedback')
      .insert({
        track_id: trackId,
        vote: vote,
        timestamp: timestamp || new Date().toISOString(),
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Feedback saved:', data);
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('❌ Feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}

