-- Add image_url column to community_posts table
ALTER TABLE public.community_posts 
ADD COLUMN image_url TEXT NULL;

-- Create storage bucket for community post images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-post-images',
  'Community Post Images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for community post images
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

-- Add index for better performance when querying posts with images
CREATE INDEX idx_community_posts_image_url ON public.community_posts(image_url) WHERE image_url IS NOT NULL;