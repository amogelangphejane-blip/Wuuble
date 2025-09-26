-- Add missing fields to community_posts table
ALTER TABLE public.community_posts 
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Create function to update likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for likes count
DROP TRIGGER IF EXISTS update_post_likes_count_trigger ON community_post_likes;
CREATE TRIGGER update_post_likes_count_trigger
AFTER INSERT OR DELETE ON community_post_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_likes_count();

-- Create function to update comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts 
    SET comments_count = GREATEST(0, comments_count - 1) 
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comments count
DROP TRIGGER IF EXISTS update_post_comments_count_trigger ON community_post_comments;
CREATE TRIGGER update_post_comments_count_trigger
AFTER INSERT OR DELETE ON community_post_comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comments_count();

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON public.community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_is_pinned ON public.community_posts(is_pinned DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_likes_count ON public.community_posts(likes_count DESC);

-- Update existing posts to have default values
UPDATE public.community_posts 
SET 
  title = COALESCE(title, SUBSTRING(content, 1, 50) || '...'),
  category = COALESCE(category, 'General'),
  tags = COALESCE(tags, '{}'),
  is_pinned = COALESCE(is_pinned, FALSE),
  views_count = COALESCE(views_count, 0),
  likes_count = COALESCE(likes_count, 0),
  comments_count = COALESCE(comments_count, 0)
WHERE title IS NULL OR category IS NULL;