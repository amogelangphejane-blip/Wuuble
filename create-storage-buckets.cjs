const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createStorageBuckets() {
  console.log('🗄️ Creating storage buckets for marketplace...\n');

  try {
    // Check existing buckets first
    console.log('1️⃣ Checking existing buckets...');
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.log('❌ Error listing buckets:', listError.message);
      return;
    }

    console.log('📦 Existing buckets:', existingBuckets.map(b => b.name).join(', '));

    // Create product-files bucket (private - for digital products)
    console.log('\n2️⃣ Creating product-files bucket...');
    const productFilesBucket = existingBuckets.find(b => b.name === 'product-files');
    
    if (productFilesBucket) {
      console.log('✅ product-files bucket already exists');
    } else {
      const { data: filesData, error: filesError } = await supabase.storage.createBucket('product-files', {
        public: false, // Private bucket for digital products
        allowedMimeTypes: [
          'application/pdf',
          'application/zip',
          'application/x-zip-compressed',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'video/mp4',
          'video/webm',
          'audio/mpeg',
          'audio/wav',
          'text/plain',
          'application/json',
          'application/javascript',
          'text/css',
          'text/html'
        ],
        fileSizeLimit: 100 * 1024 * 1024 // 100MB limit
      });

      if (filesError) {
        console.log('❌ Error creating product-files bucket:', filesError.message);
      } else {
        console.log('✅ product-files bucket created successfully');
      }
    }

    // Create product-images bucket (public - for thumbnails and previews)
    console.log('\n3️⃣ Creating product-images bucket...');
    const productImagesBucket = existingBuckets.find(b => b.name === 'product-images');
    
    if (productImagesBucket) {
      console.log('✅ product-images bucket already exists');
    } else {
      const { data: imagesData, error: imagesError } = await supabase.storage.createBucket('product-images', {
        public: true, // Public bucket for thumbnails and preview images
        allowedMimeTypes: [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml'
        ],
        fileSizeLimit: 10 * 1024 * 1024 // 10MB limit for images
      });

      if (imagesError) {
        console.log('❌ Error creating product-images bucket:', imagesError.message);
      } else {
        console.log('✅ product-images bucket created successfully');
      }
    }

    // Set up storage policies
    console.log('\n4️⃣ Setting up storage policies...');
    
    const policies = [
      // Product files policies (private access)
      {
        bucket: 'product-files',
        policy: 'product_files_upload_policy',
        sql: `
          CREATE POLICY "Authenticated users can upload product files" ON storage.objects 
          FOR INSERT WITH CHECK (
            bucket_id = 'product-files' 
            AND auth.role() = 'authenticated'
          );
        `
      },
      {
        bucket: 'product-files',
        policy: 'product_files_download_policy', 
        sql: `
          CREATE POLICY "Users can download purchased products" ON storage.objects
          FOR SELECT USING (
            bucket_id = 'product-files'
            AND (
              auth.uid()::text = (storage.foldername(name))[1]
              OR EXISTS (
                SELECT 1 FROM product_orders 
                WHERE buyer_id = auth.uid() 
                AND status = 'completed'
                AND digital_products.file_url LIKE '%' || name || '%'
              )
            )
          );
        `
      },
      // Product images policies (public access for thumbnails)
      {
        bucket: 'product-images',
        policy: 'product_images_upload_policy',
        sql: `
          CREATE POLICY "Authenticated users can upload product images" ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = 'product-images'
            AND auth.role() = 'authenticated'
          );
        `
      },
      {
        bucket: 'product-images', 
        policy: 'product_images_view_policy',
        sql: `
          CREATE POLICY "Anyone can view product images" ON storage.objects
          FOR SELECT USING (bucket_id = 'product-images');
        `
      }
    ];

    for (const policy of policies) {
      try {
        const { error: policyError } = await supabase.rpc('exec', { sql: policy.sql });
        if (policyError && !policyError.message.includes('already exists')) {
          console.log(`⚠️  Policy ${policy.policy} failed:`, policyError.message);
        } else {
          console.log(`✅ Policy ${policy.policy} applied`);
        }
      } catch (err) {
        console.log(`⚠️  Policy ${policy.policy} failed:`, err.message);
      }
    }

    // Test bucket access
    console.log('\n5️⃣ Testing bucket access...');
    
    // Test product-images bucket (should be accessible)
    const { data: imagesTest, error: imagesTestError } = await supabase.storage
      .from('product-images')
      .list('', { limit: 1 });
      
    if (imagesTestError) {
      console.log('❌ product-images bucket test failed:', imagesTestError.message);
    } else {
      console.log('✅ product-images bucket accessible');
    }

    // Test product-files bucket (should be accessible)
    const { data: filesTest, error: filesTestError } = await supabase.storage
      .from('product-files')
      .list('', { limit: 1 });
      
    if (filesTestError) {
      console.log('❌ product-files bucket test failed:', filesTestError.message);
    } else {
      console.log('✅ product-files bucket accessible');
    }

    // Final status
    console.log('\n📊 Storage Buckets Setup Summary:');
    const { data: finalBuckets } = await supabase.storage.listBuckets();
    const hasProductFiles = finalBuckets?.some(b => b.name === 'product-files');
    const hasProductImages = finalBuckets?.some(b => b.name === 'product-images');
    
    console.log(`📁 product-files: ${hasProductFiles ? '✅ Ready' : '❌ Missing'} (private)`);
    console.log(`🖼️  product-images: ${hasProductImages ? '✅ Ready' : '❌ Missing'} (public)`);
    
    if (hasProductFiles && hasProductImages) {
      console.log('\n🎉 All storage buckets are ready for marketplace use!');
      console.log('   - Users can now upload product files and images');
      console.log('   - Sellers can add products with thumbnails');
      console.log('   - Digital product downloads will work');
    }

  } catch (error) {
    console.error('❌ Storage bucket setup failed:', error.message);
  }
}

createStorageBuckets();