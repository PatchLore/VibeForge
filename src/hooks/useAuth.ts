'use client';

import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAuthState({ user: null, session: null, loading: false });
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
      }
      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
      });
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
        });
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  };

  const signUp = async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error('Supabase not configured');
    
    const response = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (response.error) throw response.error;
    return response;
  };

  const signOut = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error('Supabase not configured');
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error('Supabase not configured');
    
    const redirectTo = typeof window !== 'undefined' 
      ? `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/reset-password`
      : `${process.env.NEXT_PUBLIC_SITE_URL || ''}/auth/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error('Supabase not configured');
    
    const redirectTo = typeof window !== 'undefined'
      ? `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`
      : `${process.env.NEXT_PUBLIC_SITE_URL || ''}/auth/callback`;
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });
    
    if (error) throw error;
    return data;
  };

  const signInWithApple = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error('Supabase not configured');
    
    const redirectTo = typeof window !== 'undefined'
      ? `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`
      : `${process.env.NEXT_PUBLIC_SITE_URL || ''}/auth/callback`;
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo,
      },
    });
    
    if (error) throw error;
    return data;
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    resetPassword,
    signInWithGoogle,
    signInWithApple,
  };
}
