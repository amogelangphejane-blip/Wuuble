-- Ensure community posts discussions schema is complete
-- This script can be run in the Supabase SQL editor

-- First, ensure the community_posts table has all required columns
DO $$ 
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='community_posts' AND column_name='title') THEN
        ALTER TABLE public.community_posts ADD COLUMN title VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='community_posts' AND column_name='category') THEN
        ALTER TABLE public.community_posts ADD COLUMN category VARCHAR(100) DEFAULT 'general';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='community_posts' AND column_name='tags') THEN
        ALTER TABLE public.community_posts ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='community_posts' AND column_name='is_pinned') THEN
        ALTER TABLE public.community_posts ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='community_posts' AND column_name='views_count') THEN
        ALTER TABLE public.community_posts ADD COLUMN views_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='community_posts' AND column_name='likes_count') THEN
        ALTER TABLE public.community_posts ADD COLUMN likes_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='community_posts' AND column_name='comments_count') THEN
        ALTER TABLE public.community_posts ADD COLUMN comments_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='community_posts' AND column_name='image_url') THEN
        ALTER TABLE public.community_posts ADD COLUMN image_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='community_posts' AND column_name='link_url') THEN
        ALTER TABLE public.community_posts ADD COLUMN link_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='community_posts' AND column_name='link_title') THEN
        ALTER TABLE public.community_posts ADD COLUMN link_title TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='community_posts' AND column_name='link_description') THEN
        ALTER TABLE public.community_posts ADD COLUMN link_description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='community_posts' AND column_name='link_image_url') THEN
        ALTER TABLE public.community_posts ADD COLUMN link_image_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='community_posts' AND column_name='link_domain') THEN
        ALTER TABLE public.community_posts ADD COLUMN link_domain TEXT;
    END IF;
END $$;

-- Create community_post_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.community_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create community_post_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.community_post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.community_post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_posts_community_id ON public.community_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON public.community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_is_pinned ON public.community_posts(is_pinned DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_likes_count ON public.community_posts(likes_count DESC);

CREATE INDEX IF NOT EXISTS idx_community_post_likes_post_id ON public.community_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_likes_user_id ON public.community_post_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_community_post_comments_post_id ON public.community_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_comments_user_id ON public.community_post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_community_post_comments_parent_id ON public.community_post_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_community_post_comments_created_at ON public.community_post_comments(created_at DESC);

-- Create or replace function to update post likes count
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

-- Create or replace function to update post comments count
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

-- Create triggers for automatic count updates
DROP TRIGGER IF EXISTS update_post_likes_count_trigger ON community_post_likes;
CREATE TRIGGER update_post_likes_count_trigger
AFTER INSERT OR DELETE ON community_post_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_likes_count();

DROP TRIGGER IF EXISTS update_post_comments_count_trigger ON community_post_comments;
CREATE TRIGGER update_post_comments_count_trigger
AFTER INSERT OR DELETE ON community_post_comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comments_count();

-- RLS Policies for community_posts
DROP POLICY IF EXISTS "Users can view posts in accessible communities" ON public.community_posts;
CREATE POLICY "Users can view posts in accessible communities"
ON public.community_posts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = community_id
    AND (
      NOT c.is_private 
      OR EXISTS (
        SELECT 1 FROM public.community_members cm 
        WHERE cm.community_id = c.id 
        AND cm.user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "Members can create posts in their communities" ON public.community_posts;
CREATE POLICY "Members can create posts in their communities"
ON public.community_posts
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.community_members 
    WHERE community_id = community_posts.community_id 
    AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update their own posts" ON public.community_posts;
CREATE POLICY "Users can update their own posts"
ON public.community_posts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.community_posts;
CREATE POLICY "Users can delete their own posts"
ON public.community_posts
FOR DELETE
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = community_id 
    AND c.owner_id = auth.uid()
  )
);

-- RLS Policies for community_post_likes
DROP POLICY IF EXISTS "Users can view likes" ON public.community_post_likes;
CREATE POLICY "Users can view likes"
ON public.community_post_likes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_posts cp
    WHERE cp.id = post_id
  )
);

DROP POLICY IF EXISTS "Users can like posts" ON public.community_post_likes;
CREATE POLICY "Users can like posts"
ON public.community_post_likes
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.community_posts cp
    JOIN public.communities c ON c.id = cp.community_id
    WHERE cp.id = post_id
    AND (
      NOT c.is_private 
      OR EXISTS (
        SELECT 1 FROM public.community_members cm 
        WHERE cm.community_id = c.id 
        AND cm.user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "Users can remove their own likes" ON public.community_post_likes;
CREATE POLICY "Users can remove their own likes"
ON public.community_post_likes
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for community_post_comments
DROP POLICY IF EXISTS "Users can view comments" ON public.community_post_comments;
CREATE POLICY "Users can view comments"
ON public.community_post_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_posts cp
    WHERE cp.id = post_id
  )
);

DROP POLICY IF EXISTS "Users can create comments" ON public.community_post_comments;
CREATE POLICY "Users can create comments"
ON public.community_post_comments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.community_posts cp
    JOIN public.communities c ON c.id = cp.community_id
    WHERE cp.id = post_id
    AND (
      NOT c.is_private 
      OR EXISTS (
        SELECT 1 FROM public.community_members cm 
        WHERE cm.community_id = c.id 
        AND cm.user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "Users can update their own comments" ON public.community_post_comments;
CREATE POLICY "Users can update their own comments"
ON public.community_post_comments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.community_post_comments;
CREATE POLICY "Users can delete their own comments"
ON public.community_post_comments
FOR DELETE
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.community_posts cp
    JOIN public.communities c ON c.id = cp.community_id
    WHERE cp.id = post_id 
    AND c.owner_id = auth.uid()
  )
);

-- Enable realtime for tables
ALTER TABLE public.community_posts REPLICA IDENTITY FULL;
ALTER TABLE public.community_post_likes REPLICA IDENTITY FULL;
ALTER TABLE public.community_post_comments REPLICA IDENTITY FULL;

-- Grant permissions
GRANT ALL ON public.community_posts TO authenticated;
GRANT ALL ON public.community_post_likes TO authenticated;
GRANT ALL ON public.community_post_comments TO authenticated;

GRANT ALL ON public.community_posts TO service_role;
GRANT ALL ON public.community_post_likes TO service_role;
GRANT ALL ON public.community_post_comments TO service_role;

-- Update existing posts to have default values where needed
UPDATE public.community_posts 
SET 
  title = COALESCE(title, SUBSTRING(content, 1, 50) || '...'),
  category = COALESCE(category, 'general'),
  tags = COALESCE(tags, '{}'),
  is_pinned = COALESCE(is_pinned, FALSE),
  views_count = COALESCE(views_count, 0),
  likes_count = COALESCE(likes_count, 0),
  comments_count = COALESCE(comments_count, 0)
WHERE title IS NULL OR category IS NULL OR likes_count IS NULL OR comments_count IS NULL;

SELECT 'Discussion schema setup complete!' as status;