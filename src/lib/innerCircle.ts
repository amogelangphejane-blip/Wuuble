import { supabase } from '@/integrations/supabase/client';

export interface InnerCircleCommunity {
  id: string;
  name: string;
  description: string;
  avatar_url?: string | null;
  is_private: boolean;
  member_count: number;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Ensures the Inner Circle community exists and has the correct avatar
 * Creates it if it doesn't exist, updates the avatar if it does
 */
export async function ensureInnerCircleCommunity(userId: string): Promise<InnerCircleCommunity | null> {
  try {
    // First, try to find an existing Inner Circle community
    const { data: existingCommunity, error: findError } = await supabase
      .from('communities')
      .select('*')
      .ilike('name', 'Inner Circle')
      .single();

    if (existingCommunity && !findError) {
      console.log('Found existing Inner Circle community:', existingCommunity.id);
      
      // Update the avatar if it's not set to our logo
      if (existingCommunity.avatar_url !== '/inner-circle-logo.svg') {
        const { error: updateError } = await supabase
          .from('communities')
          .update({ 
            avatar_url: '/inner-circle-logo.svg',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCommunity.id);

        if (updateError) {
          console.error('Error updating Inner Circle avatar:', updateError);
        } else {
          console.log('Updated Inner Circle avatar successfully');
          existingCommunity.avatar_url = '/inner-circle-logo.svg';
        }
      }

      return existingCommunity;
    }

    // Community doesn't exist, create it
    console.log('Inner Circle community not found. Creating new one...');
    
    const { data: newCommunity, error: createError } = await supabase
      .from('communities')
      .insert([{
        name: 'Inner Circle',
        description: 'An exclusive community for elite connections and premium networking. Where influence meets opportunity.',
        avatar_url: '/inner-circle-logo.svg',
        is_private: true,
        creator_id: userId
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating Inner Circle community:', createError);
      return null;
    }

    // Add the creator as an admin member
    const { error: memberError } = await supabase
      .from('community_members')
      .insert([{
        community_id: newCommunity.id,
        user_id: userId,
        role: 'admin'
      }]);

    if (memberError) {
      console.error('Error adding creator as admin member:', memberError);
    }

    console.log('Created new Inner Circle community:', newCommunity.id);
    return newCommunity;

  } catch (error) {
    console.error('Error in ensureInnerCircleCommunity:', error);
    return null;
  }
}

/**
 * Updates the Inner Circle community avatar URL
 */
export async function updateInnerCircleAvatar(avatarUrl: string): Promise<boolean> {
  try {
    const { data: community, error: findError } = await supabase
      .from('communities')
      .select('id')
      .ilike('name', 'Inner Circle')
      .single();

    if (findError || !community) {
      console.error('Inner Circle community not found:', findError);
      return false;
    }

    const { error: updateError } = await supabase
      .from('communities')
      .update({ 
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', community.id);

    if (updateError) {
      console.error('Error updating Inner Circle avatar:', updateError);
      return false;
    }

    console.log('Successfully updated Inner Circle avatar to:', avatarUrl);
    return true;

  } catch (error) {
    console.error('Error in updateInnerCircleAvatar:', error);
    return false;
  }
}