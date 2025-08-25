const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickCheck() {
  console.log('🔍 Quick bucket check...\n');
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    console.log('📦 All buckets found:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    
    const productFiles = buckets.find(b => b.name === 'product-files');
    const productImages = buckets.find(b => b.name === 'product-images');
    
    console.log('\n🎯 Target buckets:');
    console.log(`  product-files: ${productFiles ? '✅ Found' : '❌ Missing'}`);
    console.log(`  product-images: ${productImages ? '✅ Found' : '❌ Missing'}`);
    
    if (productFiles && productImages) {
      console.log('\n🎉 SUCCESS! Both buckets exist!');
      console.log('✅ Marketplace storage is ready');
      console.log('✅ File uploads will now work');
    }
    
  } catch (error) {
    console.log('❌ Check failed:', error.message);
  }
}

quickCheck();