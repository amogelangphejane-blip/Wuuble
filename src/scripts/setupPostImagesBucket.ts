#!/usr/bin/env node

import { supabase } from '@/integrations/supabase/client';

async function setupPostImagesBucket() {
  try {
    console.log('🚀 Setting up community-post-images bucket...');
    
    // Check if bucket already exists
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError.message);
      return;
    }

    const bucketExists = existingBuckets.some(b => b.id === 'community-post-images');
    
    if (bucketExists) {
      console.log('✅ community-post-images bucket already exists');
      return;
    }

    // Create the bucket
    console.log('📸 Creating community-post-images bucket...');
    const { data, error } = await supabase.storage.createBucket('community-post-images', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    });

    if (error) {
      console.error('❌ Failed to create community-post-images bucket:', error.message);
      return;
    }

    console.log('✅ community-post-images bucket created successfully!');
    
    // Test upload permissions
    console.log('🔐 Testing upload permissions...');
    const testFileName = `test-upload-${Date.now()}.txt`;
    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    const { error: uploadError } = await supabase.storage
      .from('community-post-images')
      .upload(`temp/${testFileName}`, testFile);

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError.message);
    } else {
      console.log('✅ Upload permissions working correctly');
      // Clean up test file
      await supabase.storage.from('community-post-images').remove([`temp/${testFileName}`]);
    }

  } catch (error) {
    console.error('💥 Setup failed:', error);
  }
}

// Run the setup
setupPostImagesBucket();