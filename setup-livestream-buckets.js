import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupLivestreamBuckets() {
  try {
    console.log('🚀 Setting up livestream storage buckets...');
    
    // Check existing buckets
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError.message);
      return;
    }

    console.log('📋 Existing buckets:', existingBuckets.map(b => b.id));

    const buckets = [
      {
        name: 'stream-images',
        config: {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        }
      },
      {
        name: 'stream-thumbnails',
        config: {
          public: true,
          fileSizeLimit: 2097152, // 2MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
        }
      },
      {
        name: 'stream-segments',
        config: {
          public: true,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: ['video/mp4', 'application/vnd.apple.mpegurl', 'application/dash+xml', 'video/mp2t']
        }
      },
      {
        name: 'stream-recordings',
        config: {
          public: false, // Private by default
          fileSizeLimit: 1073741824, // 1GB
          allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime']
        }
      },
      {
        name: 'stream-chat-attachments',
        config: {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
        }
      },
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

    console.log('🎉 Livestream storage setup complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Apply storage policies using the SQL scripts');
    console.log('2. Run database migrations for stream_images table');
    console.log('3. Test image upload functionality');
    
  } catch (error) {
    console.error('💥 Setup failed:', error.message);
  }
}

setupLivestreamBuckets();