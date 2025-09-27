import { supabase } from '@/integrations/supabase/client';
import { clearProfileCache } from './profileUtils';

/**
 * Immediate fix for the current user's profile
 * This uses the current user's auth data to fix their profile
 */
export async function fixMyProfile() {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('No authenticated user found');
    }

    console.log('Fixing profile for user:', user.id, user.email);

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('Current profile:', profile);

    if (profileError && profileError.code !== 'PGRST116') {
      throw new Error(`Error fetching profile: ${profileError.message}`);
    }

    const emailUsername = user.email?.split('@')[0] || 'User';
    
    if (!profile) {
      // Create profile if it doesn't exist
      console.log('Creating new profile...');
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          display_name: emailUsername,
          bio: null,
          avatar_url: null
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Error creating profile: ${createError.message}`);
      }

      console.log('Profile created:', newProfile);
      clearProfileCache(user.id);
      
      return {
        success: true,
        action: 'created',
        displayName: emailUsername,
        profile: newProfile
      };
    } else if (!profile.display_name || profile.display_name.trim() === '') {
      // Update existing profile with display name
      console.log('Updating existing profile...');
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ 
          display_name: emailUsername,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Error updating profile: ${updateError.message}`);
      }

      console.log('Profile updated:', updatedProfile);
      clearProfileCache(user.id);
      
      return {
        success: true,
        action: 'updated',
        displayName: emailUsername,
        profile: updatedProfile
      };
    } else {
      // Profile already has display name
      console.log('Profile already has display name:', profile.display_name);
      return {
        success: true,
        action: 'no_change_needed',
        displayName: profile.display_name,
        profile: profile
      };
    }
  } catch (error) {
    console.error('Error in fixMyProfile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      action: 'error'
    };
  }
}

/**
 * Test if profile is working correctly
 */
export async function testProfile() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('No authenticated user found');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata
      },
      profile: profile,
      hasValidDisplayName: !!(profile?.display_name && profile.display_name.trim() !== ''),
      suggestedDisplayName: user.email?.split('@')[0] || 'User'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}