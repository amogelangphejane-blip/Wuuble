-- Drop existing tables if they exist to start fresh (be careful in production!)
DROP TABLE IF EXISTS public.community_post_comments CASCADE;
DROP TABLE IF EXISTS public.community_post_likes CASCADE;
DROP TABLE IF EXISTS public.community_posts CASCADE;

-- Create comprehensive community posts table
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'General',
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create community post likes table
CREATE TABLE public.community_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create community post comments table
CREATE TABLE public.community_post_comments (
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

-- Create community post bookmarks table
CREATE TABLE public.community_post_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create community post views table for tracking unique views
CREATE TABLE public.community_post_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create comment likes table
CREATE TABLE public.community_comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.community_post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comment_likes ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_community_posts_community_id ON public.community_posts(community_id);
CREATE INDEX idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX idx_community_posts_category ON public.community_posts(category);
CREATE INDEX idx_community_posts_is_pinned ON public.community_posts(is_pinned DESC);
CREATE INDEX idx_community_posts_likes_count ON public.community_posts(likes_count DESC);
CREATE INDEX idx_community_posts_last_activity ON public.community_posts(last_activity_at DESC);
CREATE INDEX idx_community_posts_gin_tags ON public.community_posts USING gin(tags);

CREATE INDEX idx_community_post_likes_post_id ON public.community_post_likes(post_id);
CREATE INDEX idx_community_post_likes_user_id ON public.community_post_likes(user_id);

CREATE INDEX idx_community_post_comments_post_id ON public.community_post_comments(post_id);
CREATE INDEX idx_community_post_comments_user_id ON public.community_post_comments(user_id);
CREATE INDEX idx_community_post_comments_parent_id ON public.community_post_comments(parent_comment_id);
CREATE INDEX idx_community_post_comments_created_at ON public.community_post_comments(created_at DESC);

CREATE INDEX idx_community_post_bookmarks_user_id ON public.community_post_bookmarks(user_id);
CREATE INDEX idx_community_post_bookmarks_post_id ON public.community_post_bookmarks(post_id);

CREATE INDEX idx_community_post_views_post_id ON public.community_post_views(post_id);
CREATE INDEX idx_community_comment_likes_comment_id ON public.community_comment_likes(comment_id);

-- Create triggers for updating timestamps
CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_post_comments_updated_at
  BEFORE UPDATE ON public.community_post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update post likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts 
    SET likes_count = likes_count + 1,
        last_activity_at = now()
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts 
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update post comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts 
    SET comments_count = comments_count + 1,
        last_activity_at = now()
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts 
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update comment likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_post_comments 
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_post_comments 
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update post views count
CREATE OR REPLACE FUNCTION update_post_views_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts 
    SET views_count = views_count + 1
    WHERE id = NEW.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic count updates
CREATE TRIGGER update_post_likes_count_trigger
AFTER INSERT OR DELETE ON community_post_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER update_post_comments_count_trigger
AFTER INSERT OR DELETE ON community_post_comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comments_count();

CREATE TRIGGER update_comment_likes_count_trigger
AFTER INSERT OR DELETE ON community_comment_likes
FOR EACH ROW
EXECUTE FUNCTION update_comment_likes_count();

CREATE TRIGGER update_post_views_count_trigger
AFTER INSERT ON community_post_views
FOR EACH ROW
EXECUTE FUNCTION update_post_views_count();

-- RLS Policies for community_posts
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

CREATE POLICY "Users can update their own posts"
ON public.community_posts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

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
CREATE POLICY "Users can view likes"
ON public.community_post_likes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_posts cp
    WHERE cp.id = post_id
  )
);

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

CREATE POLICY "Users can remove their own likes"
ON public.community_post_likes
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for community_post_comments
CREATE POLICY "Users can view comments"
ON public.community_post_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_posts cp
    WHERE cp.id = post_id
  )
);

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

CREATE POLICY "Users can update their own comments"
ON public.community_post_comments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

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

-- RLS Policies for community_post_bookmarks
CREATE POLICY "Users can view their own bookmarks"
ON public.community_post_bookmarks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmarks"
ON public.community_post_bookmarks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
ON public.community_post_bookmarks
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for community_post_views
CREATE POLICY "Users can insert views"
ON public.community_post_views
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own views"
ON public.community_post_views
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policies for community_comment_likes
CREATE POLICY "Users can view comment likes"
ON public.community_comment_likes
FOR SELECT
USING (true);

CREATE POLICY "Users can like comments"
ON public.community_comment_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own comment likes"
ON public.community_comment_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for tables
ALTER TABLE public.community_posts REPLICA IDENTITY FULL;
ALTER TABLE public.community_post_likes REPLICA IDENTITY FULL;
ALTER TABLE public.community_post_comments REPLICA IDENTITY FULL;
ALTER TABLE public.community_post_bookmarks REPLICA IDENTITY FULL;

-- Grant permissions
GRANT ALL ON public.community_posts TO authenticated;
GRANT ALL ON public.community_post_likes TO authenticated;
GRANT ALL ON public.community_post_comments TO authenticated;
GRANT ALL ON public.community_post_bookmarks TO authenticated;
GRANT ALL ON public.community_post_views TO authenticated;
GRANT ALL ON public.community_comment_likes TO authenticated;

GRANT ALL ON public.community_posts TO service_role;
GRANT ALL ON public.community_post_likes TO service_role;
GRANT ALL ON public.community_post_comments TO service_role;
GRANT ALL ON public.community_post_bookmarks TO service_role;
GRANT ALL ON public.community_post_views TO service_role;
GRANT ALL ON public.community_comment_likes TO service_role;

-- Insert some sample data for testing
INSERT INTO public.community_posts (community_id, user_id, title, content, category, tags, is_pinned)
SELECT 
  c.id,
  c.owner_id,
  'Welcome to ' || c.name || '!',
  'This is the first post in our community. Feel free to introduce yourself and share what brings you here!',
  'Announcements',
  ARRAY['welcome', 'introduction', 'community'],
  true
FROM public.communities c
WHERE NOT EXISTS (
  SELECT 1 FROM public.community_posts cp 
  WHERE cp.community_id = c.id
)
LIMIT 5;

-- Add more sample posts
INSERT INTO public.community_posts (community_id, user_id, title, content, category, tags)
SELECT 
  c.id,
  c.owner_id,
  'Community Guidelines',
  'Please review our community guidelines to ensure a positive experience for all members. We value respect, collaboration, and constructive discussions.',
  'Announcements',
  ARRAY['rules', 'guidelines', 'important']
FROM public.communities c
WHERE EXISTS (
  SELECT 1 FROM public.community_posts cp 
  WHERE cp.community_id = c.id
)
LIMIT 5;