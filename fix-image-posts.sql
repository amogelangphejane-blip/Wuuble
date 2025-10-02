-- Fix for Discussion Image Posts Issue
-- This script ensures the database schema and storage are properly configured

-- 1. Ensure the image_url column exists in community_posts table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'community_posts' 
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.community_posts 
    ADD COLUMN image_url TEXT NULL;
    
    RAISE NOTICE 'Added image_url column to community_posts table';
  ELSE
    RAISE NOTICE 'image_url column already exists in community_posts table';
  END IF;
END $$;

-- 2. Create storage bucket for community post images if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-post-images',
  'Community Post Images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 3. Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects;

-- 4. Create storage policies for community post images
CREATE POLICY "Users can upload post images"
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'community-post-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view all post images"
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'community-post-images');

CREATE POLICY "Users can update their own post images"
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'community-post-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own post images"
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'community-post-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Add index for better performance (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'community_posts'
    AND indexname = 'idx_community_posts_image_url'
  ) THEN
    CREATE INDEX idx_community_posts_image_url ON public.community_posts(image_url) 
    WHERE image_url IS NOT NULL;
    
    RAISE NOTICE 'Created index on image_url column';
  ELSE
    RAISE NOTICE 'Index on image_url already exists';
  END IF;
END $$;

-- 6. Fix any existing posts that have placeholder text as content
-- Update them to have empty content if they have an image_url or link_url
UPDATE public.community_posts
SET content = ''
WHERE content IN ('[Image Post]', '[Image]', '[Link Post]', '[Link]', '[Post]')
AND (image_url IS NOT NULL OR link_url IS NOT NULL);

-- Report the results
DO $$
DECLARE
  post_count INTEGER;
  bucket_exists BOOLEAN;
BEGIN
  -- Check if posts with images exist
  SELECT COUNT(*) INTO post_count
  FROM public.community_posts
  WHERE image_url IS NOT NULL;
  
  -- Check if bucket exists
  SELECT EXISTS(
    SELECT 1 FROM storage.buckets WHERE id = 'community-post-images'
  ) INTO bucket_exists;
  
  RAISE NOTICE '=== SETUP COMPLETE ===';
  RAISE NOTICE 'Posts with images: %', post_count;
  RAISE NOTICE 'Storage bucket exists: %', bucket_exists;
  RAISE NOTICE 'Image posts feature is now ready to use!';
END $$;
