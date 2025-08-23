-- Setup Stream Images Storage Bucket
-- This script creates and configures the storage bucket for stream display images

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stream-images',
  'stream-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Set up RLS policies for the stream-images bucket

-- Allow authenticated users to view all stream images
CREATE POLICY "Anyone can view stream images" ON storage.objects
  FOR SELECT USING (bucket_id = 'stream-images');

-- Allow authenticated users to upload stream images
CREATE POLICY "Authenticated users can upload stream images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'stream-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );

-- Allow users to update their own stream images
CREATE POLICY "Users can update their own stream images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'stream-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );

-- Allow users to delete their own stream images
CREATE POLICY "Users can delete their own stream images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'stream-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );

-- Create a function to clean up orphaned images
CREATE OR REPLACE FUNCTION cleanup_orphaned_stream_images()
RETURNS void AS $$
BEGIN
  -- Delete storage objects for streams that no longer exist
  DELETE FROM storage.objects 
  WHERE bucket_id = 'stream-images' 
  AND (storage.foldername(name))[1] NOT IN (
    SELECT id::text FROM live_streams
  );
  
  -- Delete stream_images records for deleted streams
  DELETE FROM stream_images 
  WHERE stream_id NOT IN (
    SELECT id FROM live_streams
  );
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically clean up images when a stream is deleted
CREATE OR REPLACE FUNCTION cleanup_stream_images_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all storage objects for this stream
  DELETE FROM storage.objects 
  WHERE bucket_id = 'stream-images' 
  AND (storage.foldername(name))[1] = OLD.id::text;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS trigger_cleanup_stream_images ON live_streams;
CREATE TRIGGER trigger_cleanup_stream_images
  AFTER DELETE ON live_streams
  FOR EACH ROW EXECUTE FUNCTION cleanup_stream_images_on_delete();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Add helpful comments
COMMENT ON POLICY "Anyone can view stream images" ON storage.objects IS 'Allows public viewing of stream display images';
COMMENT ON POLICY "Authenticated users can upload stream images" ON storage.objects IS 'Allows stream creators to upload images to their own stream folders';
COMMENT ON FUNCTION cleanup_orphaned_stream_images() IS 'Cleans up storage objects and database records for deleted streams';
COMMENT ON FUNCTION cleanup_stream_images_on_delete() IS 'Automatically cleans up stream images when a stream is deleted';