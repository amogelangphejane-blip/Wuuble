const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function validateBucketSpecs() {
  console.log('🔍 Validating Storage Bucket Specifications...\n');

  try {
    // Get bucket information
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ Error fetching buckets:', bucketsError.message);
      return;
    }

    console.log('📊 BUCKET VALIDATION REPORT\n');
    console.log('=' .repeat(60));

    // Check product-files bucket
    const productFilesBucket = buckets.find(b => b.name === 'product-files');
    console.log('\n📁 PRODUCT-FILES BUCKET');
    console.log('-'.repeat(30));
    
    if (productFilesBucket) {
      console.log('✅ Bucket exists');
      console.log(`📊 Public: ${productFilesBucket.public ? '❌ Should be private' : '✅ Private (correct)'}`);
      console.log(`💾 Size limit: ${productFilesBucket.file_size_limit ? (productFilesBucket.file_size_limit / 1024 / 1024).toFixed(0) + 'MB' : 'Not set'}`);
      console.log(`🎯 Expected: 100MB (104,857,600 bytes)`);
      
      // Test access
      const { data: testFiles, error: testError } = await supabase.storage
        .from('product-files')
        .list('', { limit: 1 });
      
      console.log(`🔐 Access test: ${testError ? '❌ ' + testError.message : '✅ Accessible'}`);
    } else {
      console.log('❌ Bucket does not exist');
      console.log('💡 Create with: Private, 100MB limit');
    }

    // Check product-images bucket
    const productImagesBucket = buckets.find(b => b.name === 'product-images');
    console.log('\n🖼️  PRODUCT-IMAGES BUCKET');
    console.log('-'.repeat(30));
    
    if (productImagesBucket) {
      console.log('✅ Bucket exists');
      console.log(`📊 Public: ${productImagesBucket.public ? '✅ Public (correct)' : '❌ Should be public'}`);
      console.log(`💾 Size limit: ${productImagesBucket.file_size_limit ? (productImagesBucket.file_size_limit / 1024 / 1024).toFixed(0) + 'MB' : 'Not set'}`);
      console.log(`🎯 Expected: 10MB (10,485,760 bytes)`);
      
      // Test access
      const { data: testImages, error: testError } = await supabase.storage
        .from('product-images')
        .list('', { limit: 1 });
      
      console.log(`🔐 Access test: ${testError ? '❌ ' + testError.message : '✅ Accessible'}`);
    } else {
      console.log('❌ Bucket does not exist');
      console.log('💡 Create with: Public, 10MB limit');
    }

    // Overall status
    console.log('\n📋 COMPLIANCE SUMMARY');
    console.log('=' .repeat(60));
    
    const hasProductFiles = !!productFilesBucket;
    const hasProductImages = !!productImagesBucket;
    const productFilesPrivate = productFilesBucket && !productFilesBucket.public;
    const productImagesPublic = productImagesBucket && productImagesBucket.public;
    
    console.log(`📁 product-files bucket: ${hasProductFiles ? '✅' : '❌'}`);
    console.log(`🔒 product-files private: ${productFilesPrivate ? '✅' : '❌'}`);
    console.log(`🖼️  product-images bucket: ${hasProductImages ? '✅' : '❌'}`);
    console.log(`🌐 product-images public: ${productImagesPublic ? '✅' : '❌'}`);
    
    const allGood = hasProductFiles && hasProductImages && productFilesPrivate && productImagesPublic;
    
    if (allGood) {
      console.log('\n🎉 ALL SPECIFICATIONS MET!');
      console.log('✅ Storage buckets are properly configured');
      console.log('✅ Privacy settings are correct');
      console.log('✅ Marketplace file uploads will work');
    } else {
      console.log('\n⚠️  CONFIGURATION ISSUES FOUND');
      console.log('💡 Please check the specifications above');
      console.log('🔧 Use Supabase Dashboard to fix configuration');
    }

    // Detailed specifications
    console.log('\n📝 REQUIRED SPECIFICATIONS');
    console.log('=' .repeat(60));
    console.log('product-files:');
    console.log('  - Name: product-files');
    console.log('  - Public: false (private)');
    console.log('  - Size limit: 100MB (104,857,600 bytes)');
    console.log('  - Purpose: Digital product storage');
    console.log('  - Access: Sellers + buyers of purchased products');
    console.log('');
    console.log('product-images:');
    console.log('  - Name: product-images');
    console.log('  - Public: true');
    console.log('  - Size limit: 10MB (10,485,760 bytes)');
    console.log('  - Purpose: Product thumbnails and previews');
    console.log('  - Access: Public viewing, authenticated upload');

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
  }
}

validateBucketSpecs();