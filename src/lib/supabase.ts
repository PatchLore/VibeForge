import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client (for API routes only)
// NOTE: Browser client is in supabaseClient.ts (with 'use client')
export const supabaseAdmin = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null;

