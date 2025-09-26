import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  display_name: string | null;
  avatar_url: string | null;
}

/**
 * Gets or creates a user profile with proper display name and avatar
 * @param user - The authenticated user
 * @returns Promise containing the user's profile information
 */
export const ensureUserProfile = async (user: User): Promise<UserProfile> => {
  console.log('🔍 ensureUserProfile called for user:', user.id, user.email);
  try {
    // First, try to get the existing profile
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('user_id', user.id)
      .single();

    console.log('🔍 Profile query result:', { profile, error: error?.message, code: error?.code });

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist, create it
      const displayName = user.user_metadata?.display_name || 
                          user.user_metadata?.full_name || 
                          user.email?.split('@')[0] || 
                          'Anonymous';
      
      const avatarUrl = user.user_metadata?.avatar_url || 
                        user.user_metadata?.picture || 
                        null;

      console.log('🔍 Creating new profile:', { displayName, avatarUrl });

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          display_name: displayName,
          avatar_url: avatarUrl
        })
        .select('display_name, avatar_url')
        .single();

      console.log('🔍 Profile creation result:', { newProfile, error: createError?.message });

      if (createError) {
        console.error('Error creating profile:', createError);
        // Return fallback values
        return {
          display_name: displayName,
          avatar_url: avatarUrl
        };
      }

      profile = newProfile;
    } else if (error) {
      console.error('Error fetching profile:', error);
      // Return fallback values
      return {
        display_name: user.user_metadata?.display_name || 
                      user.user_metadata?.full_name || 
                      user.email?.split('@')[0] || 
                      'Anonymous',
        avatar_url: user.user_metadata?.avatar_url || 
                    user.user_metadata?.picture || 
                    null
      };
    }

    // If profile exists but missing display_name, update it
    if (!profile?.display_name) {
      const displayName = user.user_metadata?.display_name || 
                          user.user_metadata?.full_name || 
                          user.email?.split('@')[0] || 
                          'Anonymous';

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('user_id', user.id);

      if (!updateError) {
        profile.display_name = displayName;
      }
    }

    return {
      display_name: profile?.display_name || 'Anonymous',
      avatar_url: profile?.avatar_url || null
    };
  } catch (error) {
    console.error('Unexpected error in ensureUserProfile:', error);
    return {
      display_name: user.user_metadata?.display_name || 
                    user.user_metadata?.full_name || 
                    user.email?.split('@')[0] || 
                    'Anonymous',
      avatar_url: user.user_metadata?.avatar_url || 
                  user.user_metadata?.picture || 
                  null
    };
  }
};

/**
 * Updates the user's profile information
 * @param user - The authenticated user
 * @param updates - The profile updates to apply
 */
export const updateUserProfile = async (
  user: User, 
  updates: Partial<UserProfile>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        ...updates,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating profile:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};