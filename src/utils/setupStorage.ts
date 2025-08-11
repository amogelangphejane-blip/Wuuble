import { supabase } from '@/integrations/supabase/client';

export interface SetupResult {
  step: string;
  success: boolean;
  message: string;
}

export async function setupStorageBuckets(): Promise<SetupResult[]> {
  const results: SetupResult[] = [];

  try {
    // Step 1: Check existing buckets
    results.push({ step: 'Checking Buckets', success: true, message: 'Checking existing storage buckets...' });
    
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      results.push({ step: 'Checking Buckets', success: false, message: `Failed to list buckets: ${listError.message}` });
      return results;
    }

    const profileBucketExists = existingBuckets.some(b => b.id === 'profile-pictures');
    const communityBucketExists = existingBuckets.some(b => b.id === 'community-avatars');

    // Step 2: Create profile-pictures bucket if needed
    if (!profileBucketExists) {
      results.push({ step: 'Profile Pictures Bucket', success: true, message: 'Creating profile-pictures bucket...' });
      
      const { error: profileBucketError } = await supabase.storage.createBucket('profile-pictures', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });

      if (profileBucketError) {
        if (profileBucketError.message.includes('row-level security') || profileBucketError.message.includes('policy')) {
          results.push({ 
            step: 'Profile Pictures Bucket', 
            success: false, 
            message: `Permission denied: ${profileBucketError.message}. Please create the bucket manually via Supabase Dashboard → Storage → Create bucket named 'profile-pictures' (public, 5MB limit).` 
          });
        } else {
          results.push({ step: 'Profile Pictures Bucket', success: false, message: `Failed to create: ${profileBucketError.message}` });
        }
      } else {
        results.push({ step: 'Profile Pictures Bucket', success: true, message: 'Created successfully' });
      }
    } else {
      results.push({ step: 'Profile Pictures Bucket', success: true, message: 'Already exists' });
    }

    // Step 3: Create community-avatars bucket if needed
    if (!communityBucketExists) {
      results.push({ step: 'Community Avatars Bucket', success: true, message: 'Creating community-avatars bucket...' });
      
      const { error: communityBucketError } = await supabase.storage.createBucket('community-avatars', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });

      if (communityBucketError) {
        if (communityBucketError.message.includes('row-level security') || communityBucketError.message.includes('policy')) {
          results.push({ 
            step: 'Community Avatars Bucket', 
            success: false, 
            message: `Permission denied: ${communityBucketError.message}. Please create the bucket manually via Supabase Dashboard → Storage → Create bucket named 'community-avatars' (public, 5MB limit).` 
          });
        } else {
          results.push({ step: 'Community Avatars Bucket', success: false, message: `Failed to create: ${communityBucketError.message}` });
        }
      } else {
        results.push({ step: 'Community Avatars Bucket', success: true, message: 'Created successfully' });
      }
    } else {
      results.push({ step: 'Community Avatars Bucket', success: true, message: 'Already exists' });
    }

    // Step 4: Verify final setup
    const { data: finalBuckets, error: finalListError } = await supabase.storage.listBuckets();
    
    if (finalListError) {
      results.push({ step: 'Verification', success: false, message: `Cannot verify setup: ${finalListError.message}` });
    } else {
      const finalProfileExists = finalBuckets.some(b => b.id === 'profile-pictures');
      const finalCommunityExists = finalBuckets.some(b => b.id === 'community-avatars');
      
      if (finalProfileExists && finalCommunityExists) {
        results.push({ step: 'Verification', success: true, message: 'Storage setup complete! Upload functionality is ready.' });
      } else {
        const missingBuckets = [];
        if (!finalProfileExists) missingBuckets.push('profile-pictures');
        if (!finalCommunityExists) missingBuckets.push('community-avatars');
        
        results.push({ 
          step: 'Manual Setup Required', 
          success: false, 
          message: `Missing buckets: ${missingBuckets.join(', ')}. Please create them manually via Supabase Dashboard → Storage, or run the SQL script in setup_storage_manual.sql in your Supabase SQL Editor.` 
        });
      }
    }

  } catch (error) {
    results.push({ step: 'Setup Error', success: false, message: `Unexpected error: ${error}. Please try manual setup via Supabase Dashboard.` });
  }

  return results;
}

export async function checkStorageReady(): Promise<boolean> {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.warn('Cannot check storage buckets:', error);
      return false;
    }
    
    return buckets.some(b => b.id === 'profile-pictures');
  } catch (error) {
    console.warn('Storage check failed:', error);
    return false;
  }
}

export async function checkCommunityStorageReady(): Promise<boolean> {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.warn('Cannot check storage buckets:', error);
      return false;
    }
    
    return buckets.some(b => b.id === 'community-avatars');
  } catch (error) {
    console.warn('Storage check failed:', error);
    return false;
  }
}