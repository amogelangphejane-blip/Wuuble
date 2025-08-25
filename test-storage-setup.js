// Test script to verify storage bucket setup
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorageSetup() {
  console.log('🧪 Testing storage bucket setup...\n');
  
  try {
    // Test 1: List all buckets
    console.log('📋 Checking available buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Failed to list buckets:', bucketsError.message);
      return;
    }
    
    const expectedBuckets = [
      'stream-thumbnails',
      'stream-segments', 
      'stream-recordings',
      'stream-chat-attachments',
      'stream-images', // Your existing bucket
      'profile-pictures',
      'community-avatars'
    ];
    
    console.log('Available buckets:', buckets.map(b => b.name));
    
    expectedBuckets.forEach(bucketName => {
      const exists = buckets.find(b => b.name === bucketName);
      if (exists) {
        console.log(`✅ ${bucketName} bucket exists`);
      } else {
        console.log(`⚠️  ${bucketName} bucket missing - needs to be created`);
      }
    });
    
    // Test 2: Check cleanup functions
    console.log('\n🧹 Testing cleanup functions...');
    
    const cleanupFunctions = [
      'cleanup_expired_stream_segments',
      'cleanup_orphaned_chat_attachments', 
      'cleanup_old_recordings',
      'log_storage_usage'
    ];
    
    for (const funcName of cleanupFunctions) {
      try {
        const { data, error } = await supabase.rpc(funcName);
        if (error) {
          console.log(`⚠️  Function ${funcName} failed:`, error.message);
        } else {
          console.log(`✅ Function ${funcName} works`);
        }
      } catch (err) {
        console.log(`❌ Function ${funcName} not found or failed:`, err.message);
      }
    }
    
    // Test 3: Check storage usage logging table
    console.log('\n📊 Checking storage monitoring...');
    try {
      const { data, error } = await supabase
        .from('storage_usage_logs')
        .select('*')
        .limit(1);
        
      if (error) {
        console.log('⚠️  storage_usage_logs table not found or accessible');
      } else {
        console.log('✅ Storage monitoring table exists');
      }
    } catch (err) {
      console.log('❌ Storage monitoring setup incomplete');
    }
    
    // Test 4: Test upload permissions (requires authentication)
    console.log('\n🔐 Testing upload permissions...');
    console.log('ℹ️  Upload permission tests require user authentication');
    console.log('   Run these tests after logging in a user in your app');
    
    console.log('\n🎉 Storage setup test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Create any missing buckets');
    console.log('2. Apply the comprehensive policies SQL script');
    console.log('3. Set up cleanup cron jobs');
    console.log('4. Test with authenticated users');
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
testStorageSetup();