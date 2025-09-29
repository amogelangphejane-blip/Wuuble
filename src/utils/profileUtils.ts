import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

/**
 * Ensures a user profile exists in the profiles table
 * This function handles the case where a user exists in auth.users but not in the profiles table
 */
export async function ensureUserProfile(user: User): Promise<void> {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        display_name: user.user_metadata?.display_name || 
                     user.user_metadata?.full_name || 
                     user.email?.split('@')[0] || 
                     'Anonymous',
        avatar_url: user.user_metadata?.avatar_url || 
                   user.user_metadata?.picture || 
                   null,
        bio: null, // Will be filled by user later
      }, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      });

    if (error) {
      console.warn('Profile creation/update warning:', error);
      // We log the error but don't throw it to avoid blocking the main flow
    }
  } catch (error) {
    console.error('Error ensuring user profile:', error);
    // Don't throw to avoid blocking main functionality
  }
}

/**
 * Gets user profile with fallback to auth metadata
 */
export async function getUserProfile(userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    console.error('Error fetching profile:', error);
    return null;
  }

  return profile;
}

/**
 * Updates user profile
 */
export async function updateUserProfile(userId: string, updates: {
  display_name?: string;
  avatar_url?: string;
  bio?: string;
}) {
  const { error } = await supabase
    .from('profiles')
    .upsert({
      user_id: userId,
      ...updates,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}