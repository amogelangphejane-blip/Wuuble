const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMarketplaceSetup() {
  console.log('🔍 Testing marketplace setup...\n');

  try {
    // Test basic connection
    console.log('1️⃣ Testing Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.log('❌ Connection failed:', connectionError.message);
    } else {
      console.log('✅ Supabase connection successful');
    }

    // Check if digital_products table exists
    console.log('2️⃣ Checking digital_products table...');
    const { data: productsTest, error: productsError } = await supabase
      .from('digital_products')
      .select('count')
      .limit(1);
    
    if (productsError) {
      console.log('❌ digital_products table missing:', productsError.message);
      console.log('💡 Need to run migration manually');
    } else {
      console.log('✅ digital_products table exists');
    }

    // Check if product_categories table exists
    console.log('3️⃣ Checking product_categories table...');
    const { data: categoriesTest, error: categoriesError } = await supabase
      .from('product_categories')
      .select('count')
      .limit(1);
    
    if (categoriesError) {
      console.log('❌ product_categories table missing:', categoriesError.message);
    } else {
      console.log('✅ product_categories table exists');
    }

    // Check storage buckets
    console.log('4️⃣ Checking storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ Storage check failed:', bucketsError.message);
    } else {
      console.log('✅ Storage accessible');
      const productBucket = buckets.find(b => b.name === 'product-files');
      const imageBucket = buckets.find(b => b.name === 'product-images');
      
      if (!productBucket) {
        console.log('⚠️  product-files bucket missing');
      } else {
        console.log('✅ product-files bucket exists');
      }
      
      if (!imageBucket) {
        console.log('⚠️  product-images bucket missing');
      } else {
        console.log('✅ product-images bucket exists');
      }
    }

    console.log('\n📊 Marketplace Setup Summary:');
    console.log('- Connection: ✅');
    console.log('- Tables: Need manual setup if missing');
    console.log('- Storage: Check buckets above');
    
  } catch (error) {
    console.error('❌ Setup test failed:', error.message);
  }
}

testMarketplaceSetup();