import { supabase } from '@/integrations/supabase/client';

export async function ensureUserProfile(userId: string, email?: string, displayName?: string) {
  try {
    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      // Profile doesn't exist, create one
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          display_name: displayName || email?.split('@')[0] || 'User',
          email: email
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }
      
      return data;
    }

    return existingProfile;
  } catch (error) {
    console.error('Error ensuring profile:', error);
    return null;
  }
}

export function getUserDisplayName(user: any, profile?: any): string {
  return profile?.display_name || 
         user?.user_metadata?.display_name || 
         user?.email?.split('@')[0] || 
         profile?.email?.split('@')[0] || 
         'User';
}

export function getUserInitials(displayName: string): string {
  return displayName.substring(0, 2).toUpperCase();
}