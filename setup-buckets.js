const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupBuckets() {
  try {
    console.log('🚀 Setting up storage buckets...');
    
    // Check existing buckets
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError.message);
      return;
    }

    console.log('📋 Existing buckets:', existingBuckets.map(b => b.id));

    const buckets = [
      {
        name: 'profile-pictures',
        config: {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        }
      },
      {
        name: 'community-avatars',
        config: {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        }
      },
      {
        name: 'community-post-images',
        config: {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        }
      }
    ];

    for (const bucket of buckets) {
      const exists = existingBuckets.some(b => b.id === bucket.name);
      
      if (!exists) {
        console.log(`📸 Creating ${bucket.name} bucket...`);
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

    console.log('🎉 Storage setup complete!');
    
  } catch (error) {
    console.error('💥 Setup failed:', error.message);
  }
}

setupBuckets();
