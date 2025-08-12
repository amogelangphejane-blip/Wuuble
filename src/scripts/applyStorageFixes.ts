import { supabase } from '@/integrations/supabase/client';

export interface FixResult {
  step: string;
  success: boolean;
  message: string;
  details?: any;
}

export async function applyStorageFixes(): Promise<FixResult[]> {
  const results: FixResult[] = [];

  try {
    // Step 1: Create missing buckets
    results.push(...await createMissingBuckets());

    // Step 2: Test bucket access
    results.push(...await testBucketAccess());

    // Step 3: Test upload permissions
    results.push(...await testUploadPermissions());

    return results;
  } catch (error) {
    results.push({
      step: 'System Error',
      success: false,
      message: `Fix process failed: ${error}`,
      details: error
    });
    return results;
  }
}

async function createMissingBuckets(): Promise<FixResult[]> {
  const results: FixResult[] = [];

  try {
    // Check existing buckets
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      results.push({
        step: 'Check Buckets',
        success: false,
        message: `Cannot list buckets: ${listError.message}`,
        details: listError
      });
      return results;
    }

    const profileBucketExists = existingBuckets.some(b => b.id === 'profile-pictures');
    const communityBucketExists = existingBuckets.some(b => b.id === 'community-avatars');

    // Create profile-pictures bucket if missing
    if (!profileBucketExists) {
      const { error: profileBucketError } = await supabase.storage.createBucket('profile-pictures', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });

      if (profileBucketError) {
        results.push({
          step: 'Create Profile Pictures Bucket',
          success: false,
          message: `Failed to create profile-pictures bucket: ${profileBucketError.message}`,
          details: profileBucketError
        });
      } else {
        results.push({
          step: 'Create Profile Pictures Bucket',
          success: true,
          message: 'Successfully created profile-pictures bucket'
        });
      }
    } else {
      results.push({
        step: 'Profile Pictures Bucket',
        success: true,
        message: 'Profile pictures bucket already exists'
      });
    }

    // Create community-avatars bucket if missing
    if (!communityBucketExists) {
      const { error: communityBucketError } = await supabase.storage.createBucket('community-avatars', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });

      if (communityBucketError) {
        results.push({
          step: 'Create Community Avatars Bucket',
          success: false,
          message: `Failed to create community-avatars bucket: ${communityBucketError.message}`,
          details: communityBucketError
        });
      } else {
        results.push({
          step: 'Create Community Avatars Bucket',
          success: true,
          message: 'Successfully created community-avatars bucket'
        });
      }
    } else {
      results.push({
        step: 'Community Avatars Bucket',
        success: true,
        message: 'Community avatars bucket already exists'
      });
    }

  } catch (error) {
    results.push({
      step: 'Create Buckets',
      success: false,
      message: `Bucket creation failed: ${error}`,
      details: error
    });
  }

  return results;
}

async function testBucketAccess(): Promise<FixResult[]> {
  const results: FixResult[] = [];

  // Test profile pictures bucket
  try {
    const { data: profileFiles, error: profileListError } = await supabase.storage
      .from('profile-pictures')
      .list('', { limit: 1 });
    
    if (profileListError) {
      results.push({
        step: 'Test Profile Pictures Access',
        success: false,
        message: `Cannot access profile pictures bucket: ${profileListError.message}`,
        details: profileListError
      });
    } else {
      results.push({
        step: 'Test Profile Pictures Access',
        success: true,
        message: 'Profile pictures bucket is accessible'
      });
    }
  } catch (error) {
    results.push({
      step: 'Test Profile Pictures Access',
      success: false,
      message: `Profile pictures bucket access failed: ${error}`,
      details: error
    });
  }

  // Test community avatars bucket
  try {
    const { data: communityFiles, error: communityListError } = await supabase.storage
      .from('community-avatars')
      .list('', { limit: 1 });
    
    if (communityListError) {
      results.push({
        step: 'Test Community Avatars Access',
        success: false,
        message: `Cannot access community avatars bucket: ${communityListError.message}`,
        details: communityListError
      });
    } else {
      results.push({
        step: 'Test Community Avatars Access',
        success: true,
        message: 'Community avatars bucket is accessible'
      });
    }
  } catch (error) {
    results.push({
      step: 'Test Community Avatars Access',
      success: false,
      message: `Community avatars bucket access failed: ${error}`,
      details: error
    });
  }

  return results;
}

async function testUploadPermissions(): Promise<FixResult[]> {
  const results: FixResult[] = [];

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    results.push({
      step: 'Upload Permission Test',
      success: false,
      message: 'User not authenticated for upload test'
    });
    return results;
  }

  // Test profile picture upload permission
  try {
    const testFileName = `${user.id}/fix-test-${Date.now()}.txt`;
    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(testFileName, testFile);

    if (uploadError) {
      results.push({
        step: 'Test Profile Upload Permission',
        success: false,
        message: `Profile picture upload failed: ${uploadError.message}`,
        details: uploadError
      });
    } else {
      results.push({
        step: 'Test Profile Upload Permission',
        success: true,
        message: 'Profile picture upload permission works'
      });

      // Clean up test file
      await supabase.storage
        .from('profile-pictures')
        .remove([testFileName]);
    }
  } catch (error) {
    results.push({
      step: 'Test Profile Upload Permission',
      success: false,
      message: `Profile upload test failed: ${error}`,
      details: error
    });
  }

  // Test community avatar upload permission
  try {
    const testFileName = `temp/fix-test-${Date.now()}.txt`;
    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('community-avatars')
      .upload(testFileName, testFile);

    if (uploadError) {
      results.push({
        step: 'Test Community Upload Permission',
        success: false,
        message: `Community avatar upload failed: ${uploadError.message}`,
        details: uploadError
      });
    } else {
      results.push({
        step: 'Test Community Upload Permission',
        success: true,
        message: 'Community avatar upload permission works'
      });

      // Clean up test file
      await supabase.storage
        .from('community-avatars')
        .remove([testFileName]);
    }
  } catch (error) {
    results.push({
      step: 'Test Community Upload Permission',
      success: false,
      message: `Community upload test failed: ${error}`,
      details: error
    });
  }

  return results;
}

// Helper function to generate SQL for manual application
export function generateStoragePolicySQL(): string {
  return `-- Apply this SQL in your Supabase SQL Editor to fix storage policies
-- Go to: https://supabase.com/dashboard -> Your Project -> SQL Editor

-- Enable RLS on storage.objects (should already be enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Profile Pictures Policies
DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile pictures" ON storage.objects;

CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile pictures" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view profile pictures" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-pictures');

-- Community Avatars Policies
DROP POLICY IF EXISTS "Community avatars are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload community avatars" ON storage.objects;
DROP POLICY IF EXISTS "Community creators can update their community avatars" ON storage.objects;
DROP POLICY IF EXISTS "Community creators can delete their community avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to temp folders" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage temp files" ON storage.objects;

CREATE POLICY "Community avatars are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-avatars');

CREATE POLICY "Authenticated users can upload community avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'community-avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'communities'
);

CREATE POLICY "Community creators can update their community avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'community-avatars'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.communities 
    WHERE id = (storage.foldername(name))[2]::uuid 
    AND creator_id = auth.uid()
  )
);

CREATE POLICY "Community creators can delete their community avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'community-avatars'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.communities 
    WHERE id = (storage.foldername(name))[2]::uuid 
    AND creator_id = auth.uid()
  )
);

-- Temporary policies for testing
CREATE POLICY "Authenticated users can upload to temp folders" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id IN ('profile-pictures', 'community-avatars')
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'temp'
);

CREATE POLICY "Users can manage temp files" ON storage.objects
FOR ALL USING (
  bucket_id IN ('profile-pictures', 'community-avatars')
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'temp'
);

-- Verify policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND (policyname LIKE '%profile%' OR policyname LIKE '%community%' OR policyname LIKE '%avatar%')
ORDER BY policyname;`;
}