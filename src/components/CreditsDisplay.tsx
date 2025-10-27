'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface CreditsDisplayProps {
  className?: string;
  externalCredits?: number | null;
}

export default function CreditsDisplay({ className = '', externalCredits }: CreditsDisplayProps) {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const lastExternalCredits = useRef<number | null>(null);
  const isUpdating = useRef(false);

  // Update credits when externalCredits prop changes (from API responses)
  useEffect(() => {
    if (externalCredits !== undefined && externalCredits !== lastExternalCredits.current) {
      if (!isUpdating.current) {
        isUpdating.current = true;
        setCredits(externalCredits);
        lastExternalCredits.current = externalCredits;
        setLoading(false);
        setTimeout(() => {
          isUpdating.current = false;
        }, 100);
      }
    }
  }, [externalCredits]);

  // Fetch credits from Supabase profiles table
  const fetchCredits = useCallback(async () => {
    try {
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCredits(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching credits:', error);
        return;
      }

      if (data) {
        setCredits(data.credits);
      }
    } catch (error) {
      console.error('Error in fetchCredits:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch credits on mount and subscribe to changes
  useEffect(() => {
    if (!supabase) return;

    // Initial fetch
    fetchCredits();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('credits-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          if (payload.new.credits !== undefined) {
            if (!isUpdating.current) {
              isUpdating.current = true;
              setCredits(payload.new.credits);
              setTimeout(() => {
                isUpdating.current = false;
              }, 100);
            }
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchCredits]);

  if (loading) {
    return (
      <div className={`${className} text-gray-400`}>Loading...</div>
    );
  }

  if (credits === null) {
    return null;
  }

  return (
    <div className={`${className} flex items-center gap-2`}>
      <div className="flex items-center space-x-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-xl text-sm">
        <span className="text-lg">💎</span>
        <span className="text-gray-200 font-medium">{credits}</span>
      </div>
      {credits < 12 && (
        <Link 
          href="/pricing" 
          className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-white text-sm font-medium rounded-xl transition-all duration-200"
        >
          Top Up
        </Link>
      )}
    </div>
  );
}

