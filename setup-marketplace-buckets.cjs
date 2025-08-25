const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease set these in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupMarketplaceBuckets() {
  console.log('🚀 Setting up marketplace storage buckets...\n');

  try {
    // Check existing buckets
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError.message);
      return;
    }

    console.log('📋 Existing buckets:', existingBuckets.map(b => b.id).join(', '));

    const marketplaceBuckets = [
      {
        name: 'product-images',
        config: {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        }
      },
      {
        name: 'digital-products', 
        config: {
          public: false, // Private bucket for downloadable products
          fileSizeLimit: 104857600, // 100MB
          allowedMimeTypes: null // Allow all file types for digital products
        }
      }
    ];

    for (const bucket of marketplaceBuckets) {
      const exists = existingBuckets.some(b => b.id === bucket.name);
      
      if (!exists) {
        console.log(`📦 Creating ${bucket.name} bucket...`);
        const { data, error } = await supabase.storage.createBucket(bucket.name, bucket.config);
        
        if (error) {
          console.error(`❌ Failed to create ${bucket.name}:`, error.message);
        } else {
          console.log(`✅ ${bucket.name} bucket created successfully`);
        }
      } else {
        console.log(`✅ ${bucket.name} bucket already exists`);
      }
    }

    // Set up storage policies for the buckets
    console.log('\n🔐 Setting up storage policies...');

    const policies = [
      // Product Images Bucket Policies
      {
        name: 'product_images_upload_policy',
        sql: `
          CREATE POLICY "Users can upload product images" ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = 'product-images' AND
            auth.uid()::text = (storage.foldername(name))[1]
          );
        `
      },
      {
        name: 'product_images_view_policy', 
        sql: `
          CREATE POLICY "Product images are publicly viewable" ON storage.objects
          FOR SELECT USING (bucket_id = 'product-images');
        `
      },
      {
        name: 'product_images_delete_policy',
        sql: `
          CREATE POLICY "Users can delete their product images" ON storage.objects
          FOR DELETE USING (
            bucket_id = 'product-images' AND
            auth.uid()::text = (storage.foldername(name))[1]
          );
        `
      },
      
      // Digital Products Bucket Policies
      {
        name: 'digital_products_upload_policy',
        sql: `
          CREATE POLICY "Sellers can upload digital products" ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = 'digital-products' AND
            auth.uid()::text = (storage.foldername(name))[1]
          );
        `
      },
      {
        name: 'digital_products_download_policy',
        sql: `
          CREATE POLICY "Buyers can download purchased products" ON storage.objects
          FOR SELECT USING (
            bucket_id = 'digital-products' AND (
              auth.uid()::text = (storage.foldername(name))[1] OR
              EXISTS (
                SELECT 1 FROM digital_product_purchases dpp
                JOIN digital_products dp ON dpp.product_id = dp.id
                WHERE dp.file_url LIKE '%' || name || '%'
                AND dpp.buyer_id = auth.uid()
                AND dpp.status = 'completed'
              )
            )
          );
        `
      },
      {
        name: 'digital_products_delete_policy',
        sql: `
          CREATE POLICY "Sellers can delete their digital products" ON storage.objects
          FOR DELETE USING (
            bucket_id = 'digital-products' AND
            auth.uid()::text = (storage.foldername(name))[1]
          );
        `
      }
    ];

    for (const policy of policies) {
      try {
        const { error } = await supabase.rpc('exec', { sql: policy.sql });
        
        if (error) {
          // Check if policy already exists
          if (error.message.includes('already exists')) {
            console.log(`✅ Policy ${policy.name} already exists`);
          } else {
            console.warn(`⚠️  Policy ${policy.name} failed:`, error.message);
          }
        } else {
          console.log(`✅ Policy ${policy.name} created successfully`);
        }
      } catch (err) {
        console.warn(`⚠️  Policy ${policy.name} error:`, err.message);
      }
    }

    console.log('\n🎉 Marketplace storage setup complete!');
    console.log('\n📝 Summary:');
    console.log('- product-images: For product thumbnails and preview images (public)');
    console.log('- digital-products: For downloadable product files (private)');
    console.log('- Storage policies configured for proper access control');
    
  } catch (error) {
    console.error('💥 Setup failed:', error.message);
  }
}

setupMarketplaceBuckets();