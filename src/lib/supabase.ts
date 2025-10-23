import { createClient } from "@supabase/supabase-js";

// Only create Supabase client if environment variables are available
export const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_KEY 
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
  : null;
