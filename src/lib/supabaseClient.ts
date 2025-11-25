'use client';

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Frontend-only Supabase client (for browser components)
// Function-based lazy initialization to prevent SSR execution
// Using createClient instead of createBrowserClient to avoid SSR issues
let supabaseInstance: SupabaseClient | null = null;

/**
 * Get the Supabase browser client (lazy initialization)
 * 
 * IMPORTANT: This function MUST only be called:
 * - Inside useEffect hooks
 * - Inside event handlers
 * - Inside other client-side functions
 * 
 * NEVER call this at module level or during SSR!
 * 
 * @returns Supabase client instance or null if in SSR environment
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  // Guard: Only create in browser environment
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Lazy initialization - only create once
  if (!supabaseInstance) {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        // Use createClient instead of createBrowserClient to avoid SSR hook issues
        supabaseInstance = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true
            }
          }
        );
      } catch (error) {
        console.error('Failed to create Supabase client:', error);
        return null;
      }
    }
  }
  
  return supabaseInstance;
}
