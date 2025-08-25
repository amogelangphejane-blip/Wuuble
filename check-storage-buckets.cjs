const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorageBuckets() {
  console.log('🗄️ Checking storage buckets...\n');

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.log('❌ Storage check failed:', error.message);
      return;
    }

    console.log('📦 Available buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });

    const requiredBuckets = ['product-files', 'product-images'];
    console.log('\n🔍 Checking required marketplace buckets:');
    
    for (const bucketName of requiredBuckets) {
      const bucket = buckets.find(b => b.name === bucketName);
      if (bucket) {
        console.log(`  ✅ ${bucketName} - exists`);
      } else {
        console.log(`  ❌ ${bucketName} - missing`);
        console.log(`     💡 Create this bucket in Supabase Dashboard > Storage`);
      }
    }

    console.log('\n🎯 Marketplace Storage Status:');
    const hasProductFiles = buckets.some(b => b.name === 'product-files');
    const hasProductImages = buckets.some(b => b.name === 'product-images');
    
    if (hasProductFiles && hasProductImages) {
      console.log('✅ All required storage buckets are available');
    } else {
      console.log('⚠️  Some storage buckets are missing');
      console.log('   This will prevent file uploads in the marketplace');
    }

  } catch (error) {
    console.error('❌ Error checking storage:', error.message);
  }
}

checkStorageBuckets();