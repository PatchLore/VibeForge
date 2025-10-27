import { supabase } from './supabase';
import { CREDITS_PER_GENERATION } from './config';

export { CREDITS_PER_GENERATION };

export interface UserCredits {
  credits: number;
  plan: string;
  email?: string;
}

/**
 * Get user's current credit balance
 */
export async function getUserCredits(userId: string): Promise<UserCredits | null> {
  if (!supabase) {
    console.warn('⚠️ Supabase client not initialized');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('credits, plan, email')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching credits:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Error fetching credits:', error);
    return null;
  }
}

/**
 * Deduct credits from user account
 */
export async function deductCredits(userId: string, amount: number = CREDITS_PER_GENERATION): Promise<boolean> {
  if (!supabase) {
    console.warn('⚠️ Supabase client not initialized');
    return false;
  }

  try {
    // Call the RPC function to deduct credits atomically
    const { data, error } = await supabase.rpc('deduct_credits', {
      user_id: userId,
      amount: amount
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
 * Add credits to user account
 */
export async function addCredits(userId: string, amount: number): Promise<boolean> {
  if (!supabase) {
    console.warn('⚠️ Supabase client not initialized');
    return false;
  }

  try {
    await supabase.rpc('add_credits', {
      user_id: userId,
      amount: amount
    });

    return true;
  } catch (error) {
    console.error('❌ Error adding credits:', error);
    return false;
  }
}

/**
 * Get or create user by email
 */
export async function getOrCreateUser(email: string): Promise<string | null> {
  if (!supabase) {
    console.warn('⚠️ Supabase client not initialized');
    return null;
  }

  try {
    // Try to find existing user
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return existingUser.user_id;
    }

    // Create new user profile
    const { data: newUser, error } = await supabase
      .from('profiles')
      .insert({ email, credits: 100, user_id: userId }) // Give new users 100 free credits
      .select('user_id')
      .single();

    if (error) {
      console.error('❌ Error creating user:', error);
      return null;
    }

    return newUser.user_id;
  } catch (error) {
    console.error('❌ Error getting/creating user:', error);
    return null;
  }
}

/**
 * Update user plan
 */
export async function updateUserPlan(userId: string, plan: string): Promise<boolean> {
  if (!supabase) {
    console.warn('⚠️ Supabase client not initialized');
    return false;
  }

  try {
    await supabase.rpc('update_user_plan', {
      user_id: userId,
      new_plan: plan
    });

    return true;
  } catch (error) {
    console.error('❌ Error updating plan:', error);
    return false;
  }
}

