-- ==========================================
-- MARKETPLACE STORAGE BUCKETS - SQL SETUP
-- Copy and paste this into Supabase SQL Editor
-- ==========================================

-- Create product-files bucket (PRIVATE)
INSERT INTO storage.buckets (
  id,
  name, 
  public,
  file_size_limit,
  allowed_mime_types
) VALUES (
  'product-files',
  'product-files',
  false,                    -- PRIVATE bucket
  104857600,                -- 100MB limit
  ARRAY[
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/vnd.rar',
    'application/x-rar-compressed',
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
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Create product-images bucket (PUBLIC)
INSERT INTO storage.buckets (
  id,
  name,
  public, 
  file_size_limit,
  allowed_mime_types
) VALUES (
  'product-images',
  'product-images', 
  true,                     -- PUBLIC bucket
  10485760,                 -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png', 
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ]
) ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- SECURITY POLICIES FOR product-files
-- ==========================================

-- Users can upload to their own folder
CREATE POLICY "Upload own product files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-files' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can download purchased products
CREATE POLICY "Download purchased products" ON storage.objects  
FOR SELECT USING (
  bucket_id = 'product-files'
  AND (
    -- Seller can access own files
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Buyer can access purchased products
    EXISTS (
      SELECT 1 FROM product_orders po
      JOIN digital_products dp ON po.product_id = dp.id
      WHERE po.buyer_id = auth.uid()
      AND po.status = 'completed'
      AND dp.file_url LIKE '%' || name || '%'
    )
  )
);

-- Users can update their own files
CREATE POLICY "Update own product files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own files  
CREATE POLICY "Delete own product files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ==========================================
-- SECURITY POLICIES FOR product-images
-- ==========================================

-- Anyone can view product images (public)
CREATE POLICY "View product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Authenticated users can upload images
CREATE POLICY "Upload product images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- Users can update their own images
CREATE POLICY "Update own product images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own images
CREATE POLICY "Delete own product images" ON storage.objects  
FOR DELETE USING (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ==========================================
-- VERIFY BUCKETS WERE CREATED
-- ==========================================

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