#!/usr/bin/env node

import { supabase } from '@/integrations/supabase/client';

interface SetupResult {
  step: string;
  success: boolean;
  message: string;
  details?: any;
}

export async function setupStorageBuckets(): Promise<SetupResult[]> {
  const results: SetupResult[] = [];

  try {
    console.log('🚀 Starting storage bucket setup...');
    
    // Step 1: Check existing buckets
    results.push({ step: 'Checking Buckets', success: true, message: 'Checking existing storage buckets...' });
    
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      results.push({ step: 'Checking Buckets', success: false, message: `Failed to list buckets: ${listError.message}`, details: listError });
      return results;
    }

    console.log('📋 Existing buckets:', existingBuckets.map(b => b.id));
    const profileBucketExists = existingBuckets.some(b => b.id === 'profile-pictures');
    const communityBucketExists = existingBuckets.some(b => b.id === 'community-avatars');

    // Step 2: Create profile-pictures bucket if needed
    if (!profileBucketExists) {
      console.log('📸 Creating profile-pictures bucket...');
      results.push({ step: 'Profile Pictures Bucket', success: true, message: 'Creating profile-pictures bucket...' });
      
      const { data: profileBucketData, error: profileBucketError } = await supabase.storage.createBucket('profile-pictures', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });

      if (profileBucketError) {
        console.error('❌ Failed to create profile-pictures bucket:', profileBucketError);
        results.push({ step: 'Profile Pictures Bucket', success: false, message: `Failed to create: ${profileBucketError.message}`, details: profileBucketError });
      } else {
        console.log('✅ Profile-pictures bucket created successfully');
        results.push({ step: 'Profile Pictures Bucket', success: true, message: 'Created successfully', details: profileBucketData });
      }
    } else {
      console.log('✅ Profile-pictures bucket already exists');
      results.push({ step: 'Profile Pictures Bucket', success: true, message: 'Already exists' });
    }

    // Step 3: Create community-avatars bucket if needed
    if (!communityBucketExists) {
      console.log('👥 Creating community-avatars bucket...');
      results.push({ step: 'Community Avatars Bucket', success: true, message: 'Creating community-avatars bucket...' });
      
      const { data: communityBucketData, error: communityBucketError } = await supabase.storage.createBucket('community-avatars', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });

      if (communityBucketError) {
        console.error('❌ Failed to create community-avatars bucket:', communityBucketError);
        results.push({ step: 'Community Avatars Bucket', success: false, message: `Failed to create: ${communityBucketError.message}`, details: communityBucketError });
      } else {
        console.log('✅ Community-avatars bucket created successfully');
        results.push({ step: 'Community Avatars Bucket', success: true, message: 'Created successfully', details: communityBucketData });
      }
    } else {
      console.log('✅ Community-avatars bucket already exists');
      results.push({ step: 'Community Avatars Bucket', success: true, message: 'Already exists' });
    }

    // Step 4: Verify final setup
    console.log('🔍 Verifying final setup...');
    const { data: finalBuckets, error: finalListError } = await supabase.storage.listBuckets();
    
    if (finalListError) {
      results.push({ step: 'Verification', success: false, message: `Cannot verify setup: ${finalListError.message}`, details: finalListError });
    } else {
      const finalProfileExists = finalBuckets.some(b => b.id === 'profile-pictures');
      const finalCommunityExists = finalBuckets.some(b => b.id === 'community-avatars');
      
      console.log('📊 Final verification:', { 
        profilePictures: finalProfileExists, 
        communityAvatars: finalCommunityExists,
        totalBuckets: finalBuckets.length 
      });
      
      if (finalProfileExists && finalCommunityExists) {
        results.push({ step: 'Verification', success: true, message: 'Storage setup complete! Upload functionality is ready.' });
      } else {
        results.push({ step: 'Verification', success: false, message: 'Setup incomplete - some buckets are still missing' });
      }
    }

    // Step 5: Test upload permissions
    console.log('🔐 Testing upload permissions...');
    try {
      const testFileName = `test-upload-${Date.now()}.txt`;
      const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      // Test profile pictures upload
      const { error: profileUploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(`temp/${testFileName}`, testFile);

      if (profileUploadError) {
        results.push({ step: 'Profile Upload Test', success: false, message: `Upload test failed: ${profileUploadError.message}`, details: profileUploadError });
      } else {
        results.push({ step: 'Profile Upload Test', success: true, message: 'Profile pictures upload works' });
        // Clean up test file
        await supabase.storage.from('profile-pictures').remove([`temp/${testFileName}`]);
      }

      // Test community avatars upload
      const { error: communityUploadError } = await supabase.storage
        .from('community-avatars')
        .upload(`temp/${testFileName}`, testFile);

      if (communityUploadError) {
        results.push({ step: 'Community Upload Test', success: false, message: `Upload test failed: ${communityUploadError.message}`, details: communityUploadError });
      } else {
        results.push({ step: 'Community Upload Test', success: true, message: 'Community avatars upload works' });
        // Clean up test file
        await supabase.storage.from('community-avatars').remove([`temp/${testFileName}`]);
      }

    } catch (error) {
      results.push({ step: 'Upload Permission Test', success: false, message: `Permission test failed: ${error}`, details: error });
    }

  } catch (error) {
    console.error('💥 Storage setup failed:', error);
    results.push({ step: 'Setup Error', success: false, message: `Unexpected error: ${error}`, details: error });
  }

  return results;
}

// Function to run the setup and log results
export async function runStorageSetup(): Promise<void> {
  console.log('🔧 Running storage bucket setup...');
  const results = await setupStorageBuckets();
  
  console.log('📋 Setup Results:');
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.step}: ${result.message}`);
    if (result.details) {
      console.log('   Details:', result.details);
    }
  });
  
  const allSuccessful = results.every(r => r.success);
  if (allSuccessful) {
    console.log('🎉 Storage setup completed successfully!');
  } else {
    console.log('⚠️ Storage setup had issues. Check the results above.');
  }
}