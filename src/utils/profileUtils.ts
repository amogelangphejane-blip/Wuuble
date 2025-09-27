import { supabase } from '@/integrations/supabase/client';

// User profile interface matching the database schema
export interface UserProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  email?: string | null;
  created_at: string;
  updated_at: string;
}

// Cache for user profiles to avoid repeated database calls
const profileCache = new Map<string, { profile: UserProfile | null; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getUserProfile(userId: string, forceRefresh = false): Promise<UserProfile | null> {
  // Check cache first unless force refresh is requested
  if (!forceRefresh) {
    const cached = profileCache.get(userId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached.profile;
    }
  }

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      return null;
    }

    // Cache the result
    profileCache.set(userId, {
      profile: profile || null,
      timestamp: Date.now()
    });

    return profile || null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

export async function ensureUserProfile(userId: string, email?: string, displayName?: string): Promise<UserProfile | null> {
  try {
    // First try to get existing profile
    let profile = await getUserProfile(userId, true);
    
    if (!profile) {
      // Profile doesn't exist, create one
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          display_name: displayName || email?.split('@')[0] || null,
          bio: null,
          avatar_url: null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }
      
      profile = data;
      
      // Update cache
      profileCache.set(userId, {
        profile,
        timestamp: Date.now()
      });
    }

    return profile;
  } catch (error) {
    console.error('Error ensuring profile:', error);
    return null;
  }
}

export function getUserDisplayName(user: any, profile?: UserProfile | null): string {
  // Priority: profile display_name > auth display_name > email username > 'User'
  if (profile?.display_name) {
    return profile.display_name;
  }
  
  if (user?.user_metadata?.display_name) {
    return user.user_metadata.display_name;
  }
  
  if (user?.email) {
    return user.email.split('@')[0];
  }
  
  if (profile?.email) {
    return profile.email.split('@')[0];
  }
  
  return 'User';
}

export function getUserAvatar(user: any, profile?: UserProfile | null): string | null {
  // Priority: profile avatar_url > auth avatar_url
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;
  
  // Validate the URL to ensure it's properly formatted
  if (!avatarUrl || typeof avatarUrl !== 'string' || avatarUrl.trim() === '') {
    return null;
  }
  
  return avatarUrl.trim();
}

export function getUserInitials(displayName: string): string {
  if (!displayName || displayName.trim() === '') {
    return 'U';
  }
  
  const name = displayName.trim();
  if (name.includes(' ')) {
    const parts = name.split(' ');
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  
  return name.substring(0, 2).toUpperCase();
}

// Clear profile cache when profile is updated
export function clearProfileCache(userId: string) {
  profileCache.delete(userId);
}

// Get user profile data formatted for discussion components
export async function getUserForDiscussion(userId: string): Promise<{
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
} | null> {
  try {
    const profile = await getUserProfile(userId);
    
    // If no profile exists, try to get user data from auth
    if (!profile) {
      return null;
    }

    return {
      id: userId,
      email: profile.email || '',
      display_name: getUserDisplayName(null, profile),
      avatar_url: profile.avatar_url
    };
  } catch (error) {
    console.error('Error getting user for discussion:', error);
    return null;
  }
}