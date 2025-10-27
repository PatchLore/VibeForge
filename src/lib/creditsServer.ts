import { supabaseServer } from './supabaseServer';

const CREDITS_PER_GENERATION = 12;

export interface UserCredits {
  credits: number;
  plan: string;
  email?: string;
}

/**
 * Get user's current credit balance (server-side only)
 */
export async function getUserCredits(userId: string): Promise<UserCredits | null> {
  if (!supabaseServer) {
    console.warn('⚠️ Supabase server client not initialized');
    return null;
  }

  try {
    const { data, error } = await supabaseServer
      .from('profiles')
      .select('credits, plan, email')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching credits:', error);
      return null;
    }

    if (!data) {
      console.warn('⚠️ No user found for userId:', userId);
      return null;
    }

    if (Array.isArray(data)) {
      console.warn('⚠️ Multiple users returned for userId:', userId);
      return data[0]; // Return first record
    }

    return data;
  } catch (error) {
    console.error('❌ Error fetching credits:', error);
    return null;
  }
}

/**
 * Deduct credits from user account (server-side only)
 */
export async function deductCredits(userId: string, amount: number = CREDITS_PER_GENERATION): Promise<boolean> {
  if (!supabaseServer) {
    console.warn('⚠️ Supabase server client not initialized');
    return false;
  }

  try {
    // Call the RPC function to deduct credits atomically
    const { data, error } = await supabaseServer.rpc('spend_credits', {
      cost: amount
    });

    if (error) {
      console.error('❌ Error deducting credits:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('❌ Error deducting credits:', error);
    return false;
  }
}

/**
 * Add credits to user account (server-side only)
 */
export async function addCredits(userId: string, amount: number): Promise<boolean> {
  if (!supabaseServer) {
    console.warn('⚠️ Supabase server client not initialized');
    return false;
  }

  try {
    const { error } = await supabaseServer
      .from('profiles')
      .update({ credits: amount })
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error adding credits:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Error adding credits:', error);
    return false;
  }
}

export { CREDITS_PER_GENERATION };
