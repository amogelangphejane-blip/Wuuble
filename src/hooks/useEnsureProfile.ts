import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ensureUserProfile } from '@/utils/profileUtils';

/**
 * Hook that ensures the current user has a profile in the profiles table
 * This is important for new users or existing users who don't have profiles yet
 */
export const useEnsureProfile = () => {
  const { user } = useAuth();

  useEffect(() => {
    const initializeProfile = async () => {
      if (user) {
        try {
          await ensureUserProfile(user);
        } catch (error) {
          console.error('Failed to ensure user profile:', error);
          // Don't throw - this is a background operation
        }
      }
    };

    initializeProfile();
  }, [user]);

  return null; // This hook doesn't return anything, it just ensures profile exists
};