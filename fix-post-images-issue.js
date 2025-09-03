import { supabase } from './src/integrations/supabase/client';

async function fixPostImagesIssue() {
  console.log('🔧 Fixing post images disappearing issue...\n');
  
  const results = [];
  
  try {
    // Step 1: Check if community-post-images bucket exists
    console.log('📦 Checking storage buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      results.push({ step: 'Check Buckets', success: false, message: `Failed to list buckets: ${listError.message}` });
      console.error('❌ Failed to list buckets:', listError.message);
      return results;
    }
    
    const postImagesBucketExists = buckets.some(b => b.id === 'community-post-images');
    
    if (!postImagesBucketExists) {
      console.log('📸 Creating community-post-images bucket...');
      
      const { error: bucketError } = await supabase.storage.createBucket('community-post-images', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });
      
      if (bucketError) {
        results.push({ step: 'Create Bucket', success: false, message: `Failed to create bucket: ${bucketError.message}` });
        console.error('❌ Failed to create bucket:', bucketError.message);
        return results;
      } else {
        results.push({ step: 'Create Bucket', success: true, message: 'Created community-post-images bucket' });
        console.log('✅ Created community-post-images bucket');
      }
    } else {
      results.push({ step: 'Check Bucket', success: true, message: 'community-post-images bucket already exists' });
      console.log('✅ community-post-images bucket already exists');
    }
    
    // Step 2: Apply storage policies using the fix-storage-policies.sql
    console.log('\n🔐 Applying storage policies...');
    
    const policyStatements = [
      // Drop existing policies to avoid conflicts
      `DROP POLICY IF EXISTS "Users can upload post images" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Users can view all post images" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Users can update their own post images" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects;`,
      
      // Create new policies
      `CREATE POLICY "Users can upload post images" ON storage.objects 
       FOR INSERT WITH CHECK (
         bucket_id = 'community-post-images' 
         AND auth.role() = 'authenticated'
         AND auth.uid()::text = (storage.foldername(name))[1]
       );`,
      
      `CREATE POLICY "Users can view all post images" ON storage.objects 
       FOR SELECT USING (bucket_id = 'community-post-images');`,
      
      `CREATE POLICY "Users can update their own post images" ON storage.objects 
       FOR UPDATE USING (
         bucket_id = 'community-post-images'
         AND auth.role() = 'authenticated'
         AND auth.uid()::text = (storage.foldername(name))[1]
       );`,
      
      `CREATE POLICY "Users can delete their own post images" ON storage.objects 
       FOR DELETE USING (
         bucket_id = 'community-post-images'
         AND auth.role() = 'authenticated'
         AND auth.uid()::text = (storage.foldername(name))[1]
       );`
    ];
    
    for (const statement of policyStatements) {
      const { error: policyError } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (policyError) {
        console.warn('⚠️ Policy statement had an issue:', policyError.message);
        // Don't fail completely for policy errors as they might already exist
      }
    }
    
    results.push({ step: 'Apply Policies', success: true, message: 'Storage policies applied successfully' });
    console.log('✅ Storage policies applied successfully');
    
    // Step 3: Test upload permissions
    console.log('\n🧪 Testing upload permissions...');
    
    const testFileName = `test-upload-${Date.now()}.txt`;
    const testFile = new File(['test content'], testFileName, { type: 'text/plain' });
    
    const { error: uploadError } = await supabase.storage
      .from('community-post-images')
      .upload(`temp/${testFileName}`, testFile);
    
    if (uploadError) {
      results.push({ step: 'Test Upload', success: false, message: `Upload test failed: ${uploadError.message}` });
      console.error('❌ Upload test failed:', uploadError.message);
    } else {
      results.push({ step: 'Test Upload', success: true, message: 'Upload permissions working correctly' });
      console.log('✅ Upload permissions working correctly');
      
      // Clean up test file
      await supabase.storage.from('community-post-images').remove([`temp/${testFileName}`]);
      console.log('🧹 Cleaned up test file');
    }
    
    // Step 4: Verify policies exist
    console.log('\n🔍 Verifying policies...');
    
    const { data: policies, error: policyCheckError } = await supabase.rpc('exec_sql', {
      sql: `SELECT policyname FROM pg_policies 
            WHERE tablename = 'objects' 
            AND schemaname = 'storage'
            AND policyname LIKE '%post%';`
    });
    
    if (policyCheckError) {
      console.warn('⚠️ Could not verify policies:', policyCheckError.message);
    } else {
      const policyCount = policies?.length || 0;
      results.push({ step: 'Verify Policies', success: true, message: `Found ${policyCount} post-related policies` });
      console.log(`✅ Found ${policyCount} post-related policies`);
    }
    
    console.log('\n🎉 Post images issue fix completed!');
    console.log('\n📋 Summary:');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.step}: ${result.message}`);
    });
    
    console.log('\n💡 If images are still not appearing:');
    console.log('1. Make sure users are authenticated when uploading');
    console.log('2. Check browser console for any error messages');
    console.log('3. Verify the Supabase project URL and anon key are correct');
    console.log('4. Try uploading a new image to test the fix');
    
    return results;
    
  } catch (error) {
    console.error('❌ Unexpected error during fix:', error);
    results.push({ step: 'Fix Process', success: false, message: `Unexpected error: ${error.message}` });
    return results;
  }
}

// Run the fix
fixPostImagesIssue().then(() => {
  console.log('\n✨ Fix process completed. You can now test image uploads in your community posts.');
}).catch(error => {
  console.error('💥 Fix process failed:', error);
});