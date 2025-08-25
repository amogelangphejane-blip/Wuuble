-- Create storage buckets for marketplace
-- This SQL should be run in Supabase SQL Editor or Dashboard

-- Create product-files bucket (private for digital products)
INSERT INTO storage.buckets (id, name, owner, public, avif_autodetection, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES (
  'product-files',
  'product-files', 
  NULL,
  false,
  false,
  104857600, -- 100MB limit
  ARRAY[
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
    'application/json'
  ],
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create product-images bucket (public for thumbnails)
INSERT INTO storage.buckets (id, name, owner, public, avif_autodetection, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES (
  'product-images',
  'product-images',
  NULL, 
  true,
  true,
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ],
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for product-files (private access)
CREATE POLICY "Users can upload their own product files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-files' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can view their own product files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'product-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own product files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own product files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for product-images (public access)
CREATE POLICY "Anyone can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own product images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own product images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);