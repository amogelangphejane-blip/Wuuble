-- Fix Post Creation Issues
-- Run this script in your Supabase SQL editor to resolve common post creation problems

-- 1. Ensure community_posts table has all required columns
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS image_url TEXT NULL,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- 2. Update existing posts to have default category
UPDATE community_posts 
SET category = 'general' 
WHERE category IS NULL;

-- 3. Create storage bucket for community post images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-post-images',
  'Community Post Images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 4. Drop existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects;

-- 5. Create storage policies for community post images
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

-- 6. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_community_id ON community_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts(community_id, category);
CREATE INDEX IF NOT EXISTS idx_community_posts_pinned ON community_posts(community_id, is_pinned, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_image_url ON community_posts(image_url) WHERE image_url IS NOT NULL;

-- 7. Ensure proper RLS policies for community_posts
DROP POLICY IF EXISTS "Users can view posts in accessible communities" ON community_posts;
DROP POLICY IF EXISTS "Users can view posts in communities they have access to" ON community_posts;
DROP POLICY IF EXISTS "Users can create posts in communities they belong to" ON community_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON community_posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON community_posts;
DROP POLICY IF EXISTS "Users can delete their own posts or community admins can delete posts" ON community_posts;

-- Create updated RLS policies
CREATE POLICY "Users can view posts in accessible communities" 
ON community_posts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM communities c 
    WHERE c.id = community_posts.community_id 
    AND (
      NOT c.is_private 
      OR c.creator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM community_members cm 
        WHERE cm.community_id = c.id AND cm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can create posts in communities they belong to" 
ON community_posts 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM communities c 
    WHERE c.id = community_posts.community_id 
    AND (
      c.creator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM community_members cm 
        WHERE cm.community_id = c.id AND cm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can update their own posts" 
ON community_posts 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts or community admins can delete posts" 
ON community_posts 
FOR DELETE 
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM communities c 
    WHERE c.id = community_posts.community_id 
    AND c.creator_id = auth.uid()
  )
);

-- 8. Enable RLS on community_posts if not already enabled
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- 9. Ensure proper grants
GRANT ALL ON community_posts TO authenticated;
GRANT ALL ON community_posts TO service_role;

-- 10. Add comments for documentation
COMMENT ON COLUMN community_posts.image_url IS 'URL of the image attached to the post, stored in community-post-images bucket';
COMMENT ON COLUMN community_posts.category IS 'Post category: general, question, announcement, event, resource, showcase';
COMMENT ON COLUMN community_posts.is_pinned IS 'Whether the post is pinned to the top of the community';

-- 11. Create trigger for automatic timestamp updates if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_community_posts_updated_at ON community_posts;
CREATE TRIGGER update_community_posts_updated_at
BEFORE UPDATE ON community_posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 12. Enable realtime for community posts
ALTER TABLE community_posts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE community_posts;