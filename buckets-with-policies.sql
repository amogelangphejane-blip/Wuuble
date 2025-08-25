-- ==========================================
-- COMPLETE BUCKETS + SECURITY POLICIES
-- ==========================================

-- Step 1: Create the buckets
INSERT INTO storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at
) VALUES 
(
  'product-files',
  'product-files', 
  false,                    -- Private
  104857600,                -- 100MB
  ARRAY[
    'application/pdf', 'application/zip', 'application/x-zip-compressed',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav',
    'text/plain', 'application/json'
  ],
  NOW(), NOW()
),
(
  'product-images',
  'product-images',
  true,                     -- Public  
  10485760,                 -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = NOW();

-- Step 2: Drop existing policies (if any)
DROP POLICY IF EXISTS "Upload own product files" ON storage.objects;
DROP POLICY IF EXISTS "Download purchased products" ON storage.objects;
DROP POLICY IF EXISTS "Update own product files" ON storage.objects;
DROP POLICY IF EXISTS "Delete own product files" ON storage.objects;
DROP POLICY IF EXISTS "View product images" ON storage.objects;
DROP POLICY IF EXISTS "Upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Update own product images" ON storage.objects;
DROP POLICY IF EXISTS "Delete own product images" ON storage.objects;

-- Step 3: Create policies for product-files (private)
CREATE POLICY "Upload own product files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-files' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Download purchased products" ON storage.objects
FOR SELECT USING (
  bucket_id = 'product-files'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM product_orders po
      JOIN digital_products dp ON po.product_id = dp.id  
      WHERE po.buyer_id = auth.uid()
      AND po.status = 'completed'
      AND dp.file_url LIKE '%' || name || '%'
    )
  )
);

CREATE POLICY "Update own product files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Delete own product files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Step 4: Create policies for product-images (public)
CREATE POLICY "View product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Upload product images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Update own product images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Delete own product images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Step 5: Verify everything was created
SELECT 
  '✅ BUCKETS CREATED' as status,
  id as bucket_name,
  CASE WHEN public THEN 'Public' ELSE 'Private' END as access,
  ROUND(file_size_limit/1024/1024) || 'MB' as size_limit,
  array_length(allowed_mime_types, 1) as mime_types
FROM storage.buckets 
WHERE id IN ('product-files', 'product-images')
ORDER BY id;

SELECT 
  '✅ POLICIES CREATED' as status,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND (policyname LIKE '%product files%' OR policyname LIKE '%product images%');