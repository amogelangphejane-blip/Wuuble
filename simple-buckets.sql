-- ==========================================
-- SIMPLE BUCKET CREATION - MINIMAL VERSION
-- ==========================================

-- Create product-files bucket (private for digital products)
INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES ('product-files', 'product-files', false, 104857600)
ON CONFLICT (id) DO NOTHING;

-- Create product-images bucket (public for thumbnails)
INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES ('product-images', 'product-images', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Check if buckets were created
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id IN ('product-files', 'product-images');