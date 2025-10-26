'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface CreditsDisplayProps {
  className?: string;
}

export default function CreditsDisplay({ className = '' }: CreditsDisplayProps) {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        // Get current user
        const { data, error: userError } = await supabase?.auth.getUser() || {};
        const user = data?.user;
        
        if (userError || !user) {
          setCredits(null);
          setLoading(false);
          return;
        }

        // Get credits using the RPC function
        const { data: creditsData, error } = await supabase?.rpc('get_credits') || {};
        
        if (error) {
          console.error('Error fetching credits:', error);
          setCredits(0);
        } else {
          setCredits(creditsData?.[0]?.credits || 0);
        }

      } catch (err) {
        console.error('Unexpected error fetching credits:', err);
        setCredits(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();

    // Listen for auth changes
    const { data: { subscription } } = supabase?.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchCredits();
      } else {
        setCredits(null);
        setLoading(false);
      }
    }) || { data: { subscription: { unsubscribe: () => {} } } };

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Don't render if no user or still loading
  if (loading || credits === null) {
    return null;
  }

  return (
    <div className={`bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-sm text-gray-200 ${className}`}>
      💎 {credits}
    </div>
  );
}