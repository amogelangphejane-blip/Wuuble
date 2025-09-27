import { supabase } from '@/integrations/supabase/client';

/**
 * Fix profiles that have null or empty display names
 * This function updates existing profiles to use email username as fallback
 */
export async function fixProfileDisplayNames() {
  try {
    console.log('Starting profile display name fix...');
    
    // Get all profiles with null or empty display names
    const { data: profilesNeedingFix, error: fetchError } = await supabase
      .from('profiles')
      .select(`
        user_id,
        display_name,
        auth_users:user_id (
          email
        )
      `)
      .or('display_name.is.null,display_name.eq.');

    if (fetchError) {
      console.error('Error fetching profiles needing fix:', fetchError);
      return { success: false, error: fetchError };
    }

    if (!profilesNeedingFix || profilesNeedingFix.length === 0) {
      console.log('No profiles need display name fixes');
      return { success: true, updated: 0 };
    }

    console.log(`Found ${profilesNeedingFix.length} profiles needing display name fixes`);

    let updated = 0;
    const errors = [];

    // Update each profile
    for (const profile of profilesNeedingFix) {
      try {
        const email = (profile.auth_users as any)?.email;
        if (!email) {
          console.warn(`No email found for user_id: ${profile.user_id}`);
          continue;
        }

        const fallbackDisplayName = email.split('@')[0] || 'User';
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            display_name: fallbackDisplayName,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', profile.user_id);

        if (updateError) {
          console.error(`Error updating profile for user ${profile.user_id}:`, updateError);
          errors.push({ user_id: profile.user_id, error: updateError });
        } else {
          console.log(`Updated display name for user ${profile.user_id} to: ${fallbackDisplayName}`);
          updated++;
        }
      } catch (error) {
        console.error(`Unexpected error updating profile for user ${profile.user_id}:`, error);
        errors.push({ user_id: profile.user_id, error });
      }
    }

    console.log(`Profile display name fix completed. Updated: ${updated}, Errors: ${errors.length}`);
    
    return {
      success: errors.length === 0,
      updated,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    console.error('Unexpected error in fixProfileDisplayNames:', error);
    return { success: false, error };
  }
}

/**
 * Fix the display name for a specific user
 */
export async function fixUserDisplayName(userId: string, email?: string) {
  try {
    // Get current profile
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching user profile:', fetchError);
      return { success: false, error: fetchError };
    }

    // If profile has a valid display name, don't change it
    if (profile?.display_name && profile.display_name.trim() !== '') {
      console.log('Profile already has a valid display name');
      return { success: true, unchanged: true };
    }

    // Get user email if not provided
    let userEmail = email;
    if (!userEmail) {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user?.email) {
        console.error('Cannot get user email:', userError);
        return { success: false, error: 'Cannot determine user email' };
      }
      userEmail = userData.user.email;
    }

    // Update with email-based display name
    const fallbackDisplayName = userEmail.split('@')[0] || 'User';
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        display_name: fallbackDisplayName,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating profile display name:', updateError);
      return { success: false, error: updateError };
    }

    console.log(`Updated display name for current user to: ${fallbackDisplayName}`);
    return { 
      success: true, 
      updated: true, 
      displayName: fallbackDisplayName 
    };
  } catch (error) {
    console.error('Unexpected error in fixUserDisplayName:', error);
    return { success: false, error };
  }
}