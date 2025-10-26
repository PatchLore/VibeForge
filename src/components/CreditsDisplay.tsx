'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface CreditsDisplayProps {
  className?: string;
  externalCredits?: number | null;
}

export default function CreditsDisplay({ className = '', externalCredits }: CreditsDisplayProps) {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  // Update credits when external credits change (from API response - always authoritative)
  useEffect(() => {
    if (externalCredits !== undefined && externalCredits !== null) {
      console.log('💎 External credits received from API:', externalCredits);
      setCredits(externalCredits);
      setLoading(false);
    }
  }, [externalCredits]);

  // Fetch credits function
  const fetchCredits = useCallback(async () => {
    try {
      // Get current user
      const { data, error: userError } = await supabase?.auth.getUser() || {};
      const user = data?.user;
      
      if (userError || !user) {
        setCredits(null);
        setUserId(null);
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // Get credits directly from profiles table instead of RPC
      const { data: profileData, error } = await supabase
        ?.from('profiles')
        .select('credits')
        .eq('user_id', user.id)
        .maybeSingle() || {};
      
      if (error) {
        console.error('Error fetching credits:', error);
        setCredits(0);
      } else if (profileData) {
        const newCredits = profileData?.credits || 0;
        console.log('💎 Credits fetched from database (direct query):', newCredits);
        setCredits(newCredits);
      } else {
        console.warn('No profile found for user, setting credits to 0');
        setCredits(0);
      }

    } catch (err) {
      console.error('Unexpected error fetching credits:', err);
      setCredits(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredits();

    // Listen for auth changes
    const { data: { subscription: authSub } } = supabase?.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        await fetchCredits();
      } else {
        setCredits(null);
        setUserId(null);
        setLoading(false);
      }
    }) || { data: { subscription: { unsubscribe: () => {} } } };

    return () => {
      authSub.unsubscribe();
    };
  }, [fetchCredits]);

  // Realtime subscription to profiles table
  useEffect(() => {
    if (!userId) return;

    // Subscribe to changes in the profiles table for this user
    channelRef.current = supabase
      ?.channel(`realtime:credits:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('🎯 Credits updated via realtime:', payload.new.credits);
          setCredits(payload.new.credits);
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase?.removeChannel(channelRef.current);
      }
    };
  }, [userId]);

  // Refetch credits on mount and when needed (fallback if realtime doesn't work)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCredits();
    }, 30000); // Refetch every 30 seconds as fallback

    return () => clearInterval(interval);
  }, [fetchCredits]);

  // Don't render if no user or still loading
  if (loading || credits === null) {
    return null;
  }

  // Show low credit warning with link to pricing
  if (credits === 0) {
    return (
      <Link 
        href="/pricing" 
        className={`bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-md px-3 py-1 rounded-lg text-sm text-white hover:from-red-500/30 hover:to-pink-500/30 transition-all ${className}`}
      >
        💎 No Credits - Top Up →
      </Link>
    );
  }

  // Show low credit warning
  if (credits < 12) {
    return (
      <Link 
        href="/pricing" 
        className={`bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md px-3 py-1 rounded-lg text-sm text-gray-200 hover:from-yellow-500/30 hover:to-orange-500/30 transition-all ${className}`}
      >
        💎 {credits} Credits (Low)
      </Link>
    );
  }

  // Normal display
  return (
    <div className={`bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-sm text-gray-200 ${className}`}>
      💎 {credits}
    </div>
  );
}
