import { supabase } from '@/integrations/supabase/client';

export interface AuthValidationResult {
  isValid: boolean;
  userId?: string;
  error?: string;
  debugInfo?: any;
}

/**
 * Validates that the user is properly authenticated and returns their ID
 * This helps prevent RLS policy violations due to authentication issues
 */
export async function validateAuthentication(): Promise<AuthValidationResult> {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return {
        isValid: false,
        error: `Session error: ${sessionError.message}`,
        debugInfo: { sessionError }
      };
    }

    if (!session) {
      return {
        isValid: false,
        error: 'No active session found',
        debugInfo: { hasSession: false }
      };
    }

    if (!session.user) {
      return {
        isValid: false,
        error: 'No user in session',
        debugInfo: { hasSession: true, hasUser: false }
      };
    }

    // Additional check: verify the session is not expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      return {
        isValid: false,
        error: 'Session has expired',
        debugInfo: { 
          expiresAt: session.expires_at, 
          now,
          expired: true 
        }
      };
    }

    return {
      isValid: true,
      userId: session.user.id,
      debugInfo: {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        expiresAt: session.expires_at,
        isExpired: session.expires_at ? session.expires_at < now : false
      }
    };

  } catch (error) {
    return {
      isValid: false,
      error: `Authentication validation failed: ${error}`,
      debugInfo: { exception: error }
    };
  }
}

/**
 * Ensures the user is authenticated before proceeding with an operation
 * Includes retry logic for transient authentication issues
 */
export async function ensureAuthenticated(maxRetries: number = 2): Promise<AuthValidationResult> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await validateAuthentication();
    
    if (result.isValid) {
      return result;
    }

    // If this is not the last attempt, wait a bit and try again
    if (attempt < maxRetries) {
      console.log(`Authentication attempt ${attempt} failed, retrying...`, result.error);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to refresh the session
      await supabase.auth.refreshSession();
    }
  }

  // All attempts failed
  const finalResult = await validateAuthentication();
  return finalResult;
}