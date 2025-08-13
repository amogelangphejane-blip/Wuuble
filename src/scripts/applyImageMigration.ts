import { supabase } from '@/integrations/supabase/client';

async function applyImageMigration() {
  try {
    console.log('Applying image migration...');

    // Add image_url column to community_posts table
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'community_posts' 
                        AND column_name = 'image_url') THEN
            ALTER TABLE public.community_posts ADD COLUMN image_url TEXT NULL;
          END IF;
        END $$;
      `
    });

    if (alterError) {
      console.error('Error adding image_url column:', alterError);
    } else {
      console.log('✅ Added image_url column to community_posts');
    }

    // Create storage bucket for community post images
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }

    const bucketExists = buckets.some(b => b.id === 'community-post-images');

    if (!bucketExists) {
      const { error: bucketError } = await supabase.storage.createBucket('community-post-images', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });

      if (bucketError) {
        console.error('Error creating bucket:', bucketError);
      } else {
        console.log('✅ Created community-post-images bucket');
      }
    } else {
      console.log('✅ community-post-images bucket already exists');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
applyImageMigration();