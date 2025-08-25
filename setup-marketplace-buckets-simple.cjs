const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Use anon key as fallback

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- VITE_SUPABASE_ANON_KEY');
  console.error('\nPlease set these in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupMarketplaceBuckets() {
  console.log('🚀 Setting up marketplace storage buckets (basic setup)...\n');
  console.log('⚠️  Note: Using anon key - some operations may be limited\n');

  try {
    // Check existing buckets
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError.message);
      console.error('This might be due to insufficient permissions with anon key');
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
          if (error.message.includes('permission') || error.message.includes('unauthorized')) {
            console.error('   This requires SUPABASE_SERVICE_ROLE_KEY for admin operations');
          }
        } else {
          console.log(`✅ ${bucket.name} bucket created successfully`);
        }
      } else {
        console.log(`✅ ${bucket.name} bucket already exists`);
      }
    }

    console.log('\n📝 Next Steps:');
    console.log('1. If buckets were not created, you need to:');
    console.log('   - Get your Service Role Key from Supabase Dashboard > Settings > API');
    console.log('   - Add SUPABASE_SERVICE_ROLE_KEY=your_key_here to your .env file');
    console.log('   - Run: node setup-marketplace-buckets.cjs');
    console.log('');
    console.log('2. Alternatively, create buckets manually in Supabase Dashboard:');
    console.log('   - Go to Storage in your Supabase project');
    console.log('   - Create bucket "product-images" (public, 5MB limit)');
    console.log('   - Create bucket "digital-products" (private, 100MB limit)');
    
  } catch (error) {
    console.error('💥 Setup failed:', error.message);
  }
}

setupMarketplaceBuckets();