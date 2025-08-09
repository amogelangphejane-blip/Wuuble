-- Update profile-pictures bucket to add file size limit and allowed MIME types
UPDATE storage.buckets 
SET 
  file_size_limit = 5242880,  -- 5MB limit
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'profile-pictures';

-- Ensure RLS is enabled on storage.objects (should already be enabled but let's be sure)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;