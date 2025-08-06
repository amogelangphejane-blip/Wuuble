-- Create storage bucket for community avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-avatars', 'community-avatars', true);

-- Enable RLS on the community-avatars bucket
CREATE POLICY "Community avatars are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'community-avatars');

-- Allow authenticated users to upload community avatars
CREATE POLICY "Authenticated users can upload community avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'community-avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow community creators to update their community avatars
CREATE POLICY "Community creators can update their avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'community-avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow community creators to delete their community avatars
CREATE POLICY "Community creators can delete their avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'community-avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );