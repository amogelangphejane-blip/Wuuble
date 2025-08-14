-- Add category and pinned status to community posts
-- This migration adds support for post categories and pinned posts

-- Add category column to community_posts table
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- Create index for better performance on category filtering
CREATE INDEX IF NOT EXISTS idx_community_posts_category 
ON community_posts(community_id, category);

-- Create index for pinned posts
CREATE INDEX IF NOT EXISTS idx_community_posts_pinned 
ON community_posts(community_id, is_pinned, created_at DESC);

-- Update existing posts to have the default category
UPDATE community_posts 
SET category = 'general' 
WHERE category IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN community_posts.category IS 'Post category: general, question, announcement, event, resource, showcase';
COMMENT ON COLUMN community_posts.is_pinned IS 'Whether the post is pinned to the top of the community';