const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucketsSimple() {
  console.log('🗄️ Creating storage buckets (simplified approach)...\n');

  try {
    // Check existing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.log('❌ Error listing buckets:', listError.message);
      return;
    }

    console.log('📦 Current buckets:', buckets.map(b => `${b.name} (${b.public ? 'public' : 'private'})`).join(', '));

    // Create product-files bucket (simple approach)
    console.log('\n1️⃣ Creating product-files bucket...');
    const hasProductFiles = buckets.some(b => b.name === 'product-files');
    
    if (hasProductFiles) {
      console.log('✅ product-files bucket already exists');
    } else {
      const { data: filesData, error: filesError } = await supabase.storage.createBucket('product-files', {
        public: false
      });

      if (filesError) {
        console.log('❌ Error creating product-files bucket:', filesError.message);
        console.log('💡 This might need to be created manually in Supabase Dashboard');
      } else {
        console.log('✅ product-files bucket created successfully');
      }
    }

    // Create product-images bucket (simple approach)
    console.log('\n2️⃣ Creating product-images bucket...');
    const hasProductImages = buckets.some(b => b.name === 'product-images');
    
    if (hasProductImages) {
      console.log('✅ product-images bucket already exists');
    } else {
      const { data: imagesData, error: imagesError } = await supabase.storage.createBucket('product-images', {
        public: true
      });

      if (imagesError) {
        console.log('❌ Error creating product-images bucket:', imagesError.message);
        console.log('💡 This might need to be created manually in Supabase Dashboard');
      } else {
        console.log('✅ product-images bucket created successfully');
      }
    }

    // Test final state
    console.log('\n3️⃣ Checking final bucket state...');
    const { data: finalBuckets, error: finalError } = await supabase.storage.listBuckets();
    
    if (finalError) {
      console.log('❌ Error checking final state:', finalError.message);
      return;
    }

    const productFilesBucket = finalBuckets.find(b => b.name === 'product-files');
    const productImagesBucket = finalBuckets.find(b => b.name === 'product-images');

    console.log('\n📊 Final Storage Status:');
    console.log(`📁 product-files: ${productFilesBucket ? '✅ Exists' : '❌ Missing'} ${productFilesBucket ? `(${productFilesBucket.public ? 'public' : 'private'})` : ''}`);
    console.log(`🖼️  product-images: ${productImagesBucket ? '✅ Exists' : '❌ Missing'} ${productImagesBucket ? `(${productImagesBucket.public ? 'public' : 'private'})` : ''}`);

    if (productFilesBucket && productImagesBucket) {
      console.log('\n🎉 Storage buckets are ready!');
      console.log('✅ Marketplace file uploads will now work');
      console.log('✅ Product thumbnails can be uploaded');
      console.log('✅ Digital product storage is available');
    } else {
      console.log('\n⚠️  Some buckets are missing. Manual creation may be needed.');
      console.log('\n📋 Manual Creation Steps:');
      console.log('1. Go to Supabase Dashboard → Storage');
      console.log('2. Click "Create Bucket"');
      if (!productFilesBucket) {
        console.log('3. Create "product-files" bucket (Private)');
      }
      if (!productImagesBucket) {
        console.log('4. Create "product-images" bucket (Public)');
      }
    }

  } catch (error) {
    console.error('❌ Bucket creation failed:', error.message);
    console.log('\n💡 Alternative: Create buckets manually in Supabase Dashboard');
    console.log('   → Go to your Supabase project');
    console.log('   → Navigate to Storage section');
    console.log('   → Create "product-files" (private) and "product-images" (public) buckets');
  }
}

createBucketsSimple();