-- Create storage bucket for community avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('community-avatars', 'community-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- Enable RLS on the bucket
CREATE POLICY "Community avatars are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-avatars');

-- Policy to allow authenticated users to upload community avatars
CREATE POLICY "Authenticated users can upload community avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'community-avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'communities'
);

-- Policy to allow community creators to update their community avatars
CREATE POLICY "Community creators can update their community avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'community-avatars'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.communities 
    WHERE id = (storage.foldername(name))[2]::uuid 
    AND creator_id = auth.uid()
  )
);

-- Policy to allow community creators to delete their community avatars
CREATE POLICY "Community creators can delete their community avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'community-avatars'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.communities 
    WHERE id = (storage.foldername(name))[2]::uuid 
    AND creator_id = auth.uid()
  )
);