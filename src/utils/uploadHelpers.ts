import { supabase } from '@/integrations/supabase/client';
import { ensureAuthenticated } from '@/utils/authHelpers';

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
  debugInfo?: any;
}

export async function uploadProfilePicture(
  file: File, 
  userId: string
): Promise<UploadResult> {
  try {
    // Ensure user is authenticated with retry logic
    const authResult = await ensureAuthenticated();
    
    if (!authResult.isValid) {
      return {
        success: false,
        error: authResult.error || 'Authentication failed',
        debugInfo: authResult.debugInfo
      };
    }

    // Verify user ID matches authenticated user
    if (authResult.userId !== userId) {
      return {
        success: false,
        error: 'User ID mismatch - security violation',
        debugInfo: { 
          authenticatedUserId: authResult.userId, 
          providedUserId: userId 
        }
      };
    }

    // Generate filename with proper extension
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;
    
         console.log('Upload debug info:', {
       userId,
       fileName,
       authenticatedUserId: authResult.userId,
       fileSize: file.size,
       fileType: file.type
     });

    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error details:', uploadError);
      
      // Provide specific error messages for common issues
      let userFriendlyError = uploadError.message;
      if (uploadError.message.includes('row-level security policy')) {
        userFriendlyError = 'Permission denied: Please ensure you are logged in and try again. If the problem persists, contact support.';
      } else if (uploadError.message.includes('duplicate key')) {
        userFriendlyError = 'File already exists. Please try again or choose a different file.';
      }
      
      return {
        success: false,
        error: userFriendlyError,
                 debugInfo: {
           originalError: uploadError,
           fileName,
           userId,
           authenticatedUserId: authResult.userId
         }
      };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName);

    if (!publicUrl || publicUrl.trim() === '') {
      return {
        success: false,
        error: 'Failed to generate public URL for uploaded file',
        debugInfo: { uploadData, fileName }
      };
    }

    return {
      success: true,
      publicUrl,
      debugInfo: { uploadData, fileName }
    };

  } catch (error) {
    console.error('Upload exception:', error);
    return {
      success: false,
      error: `Upload failed: ${error}`,
      debugInfo: { exception: error }
    };
  }
}

export async function uploadCommunityAvatar(
  file: File, 
  communityId: string,
  userId: string
): Promise<UploadResult> {
  try {
    // Ensure user is authenticated with retry logic
    const authResult = await ensureAuthenticated();
    
    if (!authResult.isValid) {
      return {
        success: false,
        error: authResult.error || 'Authentication failed',
        debugInfo: authResult.debugInfo
      };
    }

    // Verify user ID matches authenticated user
    if (authResult.userId !== userId) {
      return {
        success: false,
        error: 'User ID mismatch - security violation',
        debugInfo: { 
          authenticatedUserId: authResult.userId, 
          providedUserId: userId 
        }
      };
    }

    // Check if user is the creator of the community
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('creator_id')
      .eq('id', communityId)
      .single();

    if (communityError) {
      return {
        success: false,
        error: `Community not found: ${communityError.message}`,
        debugInfo: { communityError, communityId }
      };
    }

    if (community.creator_id !== userId) {
      return {
        success: false,
        error: 'Permission denied: Only community creators can upload avatars',
        debugInfo: { 
          communityCreatorId: community.creator_id, 
          userId,
          communityId 
        }
      };
    }

    // Generate filename with proper extension
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `communities/${communityId}/avatar-${Date.now()}.${fileExt}`;
    
    console.log('Community upload debug info:', {
      userId,
      communityId,
      fileName,
      authenticatedUserId: authResult.userId,
      fileSize: file.size,
      fileType: file.type,
      isCreator: community.creator_id === userId
    });

    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('community-avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Community upload error details:', uploadError);
      
      // Provide specific error messages for common issues
      let userFriendlyError = uploadError.message;
      if (uploadError.message.includes('row-level security policy')) {
        userFriendlyError = 'Permission denied: Please ensure you are the community creator and logged in. If the problem persists, contact support.';
      } else if (uploadError.message.includes('duplicate key')) {
        userFriendlyError = 'File already exists. Please try again or choose a different file.';
      }
      
      return {
        success: false,
        error: userFriendlyError,
        debugInfo: {
          originalError: uploadError,
          fileName,
          userId,
          communityId,
          authenticatedUserId: authResult.userId,
          isCreator: community.creator_id === userId
        }
      };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('community-avatars')
      .getPublicUrl(fileName);

    if (!publicUrl || publicUrl.trim() === '') {
      return {
        success: false,
        error: 'Failed to generate public URL for uploaded file',
        debugInfo: { uploadData, fileName }
      };
    }

    return {
      success: true,
      publicUrl,
      debugInfo: { uploadData, fileName }
    };

  } catch (error) {
    console.error('Community upload exception:', error);
    return {
      success: false,
      error: `Upload failed: ${error}`,
      debugInfo: { exception: error }
    };
  }
}