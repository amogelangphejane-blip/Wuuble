-- ==========================================
-- COMPLETE STORAGE BUCKETS SETUP
-- Run this in Supabase SQL Editor
-- ==========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- CREATE STORAGE BUCKETS
-- ==========================================

-- Create product-files bucket (private for digital products)
INSERT INTO storage.buckets (
  id, 
  name, 
  owner, 
  public, 
  avif_autodetection, 
  file_size_limit, 
  allowed_mime_types, 
  created_at, 
  updated_at
) VALUES (
  'product-files',
  'product-files', 
  NULL,
  false, -- Private bucket
  false,
  104857600, -- 100MB limit
  ARRAY[
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/vnd.rar',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/avi',
    'video/mov',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/flac',
    'text/plain',
    'text/csv',
    'application/json',
    'application/javascript',
    'text/css',
    'text/html',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ],
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = NOW();

-- Create product-images bucket (public for thumbnails)
INSERT INTO storage.buckets (
  id, 
  name, 
  owner, 
  public, 
  avif_autodetection, 
  file_size_limit, 
  allowed_mime_types, 
  created_at, 
  updated_at
) VALUES (
  'product-images',
  'product-images',
  NULL, 
  true, -- Public bucket
  true, -- Enable AVIF auto-detection
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/avif',
    'image/heic',
    'image/heif'
  ],
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = NOW();

-- ==========================================
-- STORAGE POLICIES FOR product-files BUCKET
-- ==========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own product files" ON storage.objects;
DROP POLICY IF EXISTS "Users can download purchased products" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own product files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own product files" ON storage.objects;

-- 1. Upload Policy - Users can upload to their own folder
CREATE POLICY "Users can upload their own product files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-files' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 2. Download Policy - Complex access control
CREATE POLICY "Users can download purchased products" ON storage.objects
FOR SELECT USING (
  bucket_id = 'product-files'
  AND (
    -- Seller can access their own files
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Buyers can access purchased products
    EXISTS (
      SELECT 1 FROM product_orders po
      JOIN digital_products dp ON po.product_id = dp.id
      WHERE po.buyer_id = auth.uid()
      AND po.status = 'completed'
      AND dp.file_url LIKE '%' || name || '%'
    )
    OR
    -- Admins can access all files
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  )
);

-- 3. Update Policy - Users can update their own files
CREATE POLICY "Users can update their own product files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-files'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  )
);

-- 4. Delete Policy - Users can delete their own files
CREATE POLICY "Users can delete their own product files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-files'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  )
);

-- ==========================================
-- STORAGE POLICIES FOR product-images BUCKET
-- ==========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own product images" ON storage.objects;

-- 1. View Policy - Public access for all images
CREATE POLICY "Anyone can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- 2. Upload Policy - Authenticated users can upload to specific folders
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
  AND (
    -- Users can upload to their own folders
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Users can upload to product folders they own
    EXISTS (
      SELECT 1 FROM digital_products dp
      WHERE dp.seller_id = auth.uid()
      AND (
        name LIKE 'thumbnails/' || dp.id::text || '%'
        OR name LIKE 'previews/' || dp.id::text || '%'
      )
    )
    OR
    -- Allow uploads to general folders with user ID prefix
    name LIKE 'seller_avatars/' || auth.uid()::text || '%'
  )
);

-- 3. Update Policy - Users can update their own images
CREATE POLICY "Users can update their own product images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-images'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    EXISTS (
      SELECT 1 FROM digital_products dp
      WHERE dp.seller_id = auth.uid()
      AND (
        name LIKE 'thumbnails/' || dp.id::text || '%'
        OR name LIKE 'previews/' || dp.id::text || '%'
      )
    )
    OR
    name LIKE 'seller_avatars/' || auth.uid()::text || '%'
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  )
);

-- 4. Delete Policy - Users can delete their own images
CREATE POLICY "Users can delete their own product images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-images'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    EXISTS (
      SELECT 1 FROM digital_products dp
      WHERE dp.seller_id = auth.uid()
      AND (
        name LIKE 'thumbnails/' || dp.id::text || '%'
        OR name LIKE 'previews/' || dp.id::text || '%'
      )
    )
    OR
    name LIKE 'seller_avatars/' || auth.uid()::text || '%'
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  )
);

-- ==========================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- ==========================================

-- Index on storage.objects for faster policy checks
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_name 
ON storage.objects(bucket_id, name);

CREATE INDEX IF NOT EXISTS idx_storage_objects_owner 
ON storage.objects(owner);

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Check if buckets were created successfully
SELECT 
  id,
  name,
  public,
  file_size_limit,
  array_length(allowed_mime_types, 1) as mime_types_count,
  created_at
FROM storage.buckets 
WHERE id IN ('product-files', 'product-images')
ORDER BY name;

-- Check policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%product%'
ORDER BY policyname;

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'product-files') 
     AND EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'product-images') THEN
    RAISE NOTICE '✅ SUCCESS: Both storage buckets created successfully!';
    RAISE NOTICE '📁 product-files: Private bucket for digital products (100MB limit)';
    RAISE NOTICE '🖼️  product-images: Public bucket for thumbnails (10MB limit)';
    RAISE NOTICE '🔒 Security policies applied for both buckets';
    RAISE NOTICE '🚀 Marketplace storage is ready for use!';
  ELSE
    RAISE NOTICE '❌ ERROR: One or both buckets failed to create';
  END IF;
END $$;