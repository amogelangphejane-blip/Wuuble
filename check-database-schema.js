import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseSchema() {
  try {
    console.log('🔍 Checking database schema for livestream features...\n');
    
    // Check if live_streams table exists and has display_image_url column
    console.log('📋 Checking live_streams table...');
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .select('id, display_image_url')
        .limit(1);
      
      if (error) {
        console.log('❌ live_streams table issue:', error.message);
      } else {
        console.log('✅ live_streams table exists');
        if (data && data.length === 0) {
          console.log('ℹ️  live_streams table is empty (no test data)');
        } else {
          console.log('✅ display_image_url column accessible');
        }
      }
    } catch (err) {
      console.log('❌ live_streams table not found or not accessible');
    }
    
    // Check if stream_images table exists
    console.log('\n📋 Checking stream_images table...');
    try {
      const { data, error } = await supabase
        .from('stream_images')
        .select('id, stream_id, image_url, image_type, is_active')
        .limit(1);
      
      if (error) {
        console.log('❌ stream_images table issue:', error.message);
      } else {
        console.log('✅ stream_images table exists and is accessible');
        if (data && data.length === 0) {
          console.log('ℹ️  stream_images table is empty (no images uploaded yet)');
        }
      }
    } catch (err) {
      console.log('❌ stream_images table not found or not accessible');
    }
    
    // Check if profiles table exists
    console.log('\n📋 Checking profiles table...');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .limit(1);
      
      if (error) {
        console.log('❌ profiles table issue:', error.message);
      } else {
        console.log('✅ profiles table exists and is accessible');
      }
    } catch (err) {
      console.log('❌ profiles table not found or not accessible');
    }
    
    // Test authentication status
    console.log('\n🔐 Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('ℹ️  No authenticated user (expected for anon key test)');
    } else {
      console.log('✅ User authenticated:', user.email);
    }
    
    console.log('\n🎉 Database schema check completed!');
    console.log('\n📝 Summary:');
    console.log('- If tables are missing, run the migration files in supabase/migrations/');
    console.log('- If storage buckets are missing, run the complete-livestream-storage-setup.sql');
    console.log('- Test with an authenticated user for full functionality');
    
  } catch (error) {
    console.error('💥 Schema check failed:', error.message);
  }
}

checkDatabaseSchema();