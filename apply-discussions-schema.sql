-- =====================================================
-- Complete Discussion Feature Database Schema
-- =====================================================
-- This script creates all necessary tables and functions
-- for the community discussions feature to work properly
-- 
-- Run this in your Supabase SQL Editor
-- =====================================================

-- First, let's check if the update_updated_at_column function exists
-- If not, create it
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing tables if they exist (BE CAREFUL IN PRODUCTION!)
-- Comment these lines out if you want to preserve existing data
DROP TABLE IF EXISTS public.community_comment_likes CASCADE;
DROP TABLE IF EXISTS public.community_post_views CASCADE;
DROP TABLE IF EXISTS public.community_post_bookmarks CASCADE;
DROP TABLE IF EXISTS public.community_post_comments CASCADE;
DROP TABLE IF EXISTS public.community_post_likes CASCADE;
DROP TABLE IF EXISTS public.community_posts CASCADE;

-- =====================================================
-- MAIN TABLES
-- =====================================================

-- 1. Community Posts Table
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

-- 2. Post Likes Table
CREATE TABLE public.community_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- 3. Post Comments Table
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

-- 4. Post Bookmarks Table
CREATE TABLE public.community_post_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- 5. Post Views Table
CREATE TABLE public.community_post_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- 6. Comment Likes Table
CREATE TABLE public.community_comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.community_post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comment_likes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Posts indexes
CREATE INDEX idx_community_posts_community_id ON public.community_posts(community_id);
CREATE INDEX idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX idx_community_posts_category ON public.community_posts(category);
CREATE INDEX idx_community_posts_is_pinned ON public.community_posts(is_pinned DESC);
CREATE INDEX idx_community_posts_likes_count ON public.community_posts(likes_count DESC);
CREATE INDEX idx_community_posts_last_activity ON public.community_posts(last_activity_at DESC);
CREATE INDEX idx_community_posts_gin_tags ON public.community_posts USING gin(tags);

-- Likes indexes
CREATE INDEX idx_community_post_likes_post_id ON public.community_post_likes(post_id);
CREATE INDEX idx_community_post_likes_user_id ON public.community_post_likes(user_id);

-- Comments indexes
CREATE INDEX idx_community_post_comments_post_id ON public.community_post_comments(post_id);
CREATE INDEX idx_community_post_comments_user_id ON public.community_post_comments(user_id);
CREATE INDEX idx_community_post_comments_parent_id ON public.community_post_comments(parent_comment_id);
CREATE INDEX idx_community_post_comments_created_at ON public.community_post_comments(created_at DESC);

-- Other indexes
CREATE INDEX idx_community_post_bookmarks_user_id ON public.community_post_bookmarks(user_id);
CREATE INDEX idx_community_post_bookmarks_post_id ON public.community_post_bookmarks(post_id);
CREATE INDEX idx_community_post_views_post_id ON public.community_post_views(post_id);
CREATE INDEX idx_community_comment_likes_comment_id ON public.community_comment_likes(comment_id);

-- =====================================================
-- CREATE TRIGGERS FOR TIMESTAMPS
-- =====================================================

CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_post_comments_updated_at
  BEFORE UPDATE ON public.community_post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- AUTOMATIC COUNT UPDATE FUNCTIONS
-- =====================================================

-- Update post likes count
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

-- Update post comments count
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

-- Update comment likes count
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

-- Update post views count
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

-- =====================================================
-- CREATE TRIGGERS FOR COUNT UPDATES
-- =====================================================

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

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Policies for community_posts
CREATE POLICY "Anyone can view posts in public communities"
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

CREATE POLICY "Members can create posts"
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

CREATE POLICY "Users can update own posts"
ON public.community_posts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts or community owner can delete"
ON public.community_posts
FOR DELETE
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = community_id 
    AND c.creator_id = auth.uid()
  )
);

-- Policies for post likes
CREATE POLICY "Anyone can view likes"
ON public.community_post_likes
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like posts"
ON public.community_post_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own likes"
ON public.community_post_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Policies for comments
CREATE POLICY "Anyone can view comments"
ON public.community_post_comments
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create comments"
ON public.community_post_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
ON public.community_post_comments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON public.community_post_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Policies for bookmarks
CREATE POLICY "Users can view own bookmarks"
ON public.community_post_bookmarks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmarks"
ON public.community_post_bookmarks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
ON public.community_post_bookmarks
FOR DELETE
USING (auth.uid() = user_id);

-- Policies for views
CREATE POLICY "Anyone can insert views"
ON public.community_post_views
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view views"
ON public.community_post_views
FOR SELECT
USING (true);

-- Policies for comment likes
CREATE POLICY "Anyone can view comment likes"
ON public.community_comment_likes
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like comments"
ON public.community_comment_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own comment likes"
ON public.community_comment_likes
FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

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

-- =====================================================
-- SAMPLE DATA (Optional - Remove in production)
-- =====================================================

-- Insert welcome posts for existing communities
INSERT INTO public.community_posts (community_id, user_id, title, content, category, tags, is_pinned)
SELECT 
  c.id,
  c.creator_id,
  'Welcome to ' || c.name || '!',
  'This is the first post in our community. Feel free to introduce yourself and share what brings you here! 

We''re excited to have you as part of our community. Here are a few things to get you started:

1. Introduce yourself in the comments
2. Check out our community guidelines
3. Explore the different sections of our community
4. Start engaging with other members

Looking forward to building something great together!',
  'Announcements',
  ARRAY['welcome', 'introduction', 'community'],
  true
FROM public.communities c
WHERE NOT EXISTS (
  SELECT 1 FROM public.community_posts cp 
  WHERE cp.community_id = c.id
)
LIMIT 5;

-- Add sample discussion posts
INSERT INTO public.community_posts (community_id, user_id, title, content, category, tags)
SELECT 
  c.id,
  c.creator_id,
  'Best practices for community engagement',
  'Let''s discuss the best ways to keep our community engaged and active. What strategies have worked for you?',
  'Discussion',
  ARRAY['discussion', 'engagement', 'tips']
FROM public.communities c
WHERE EXISTS (
  SELECT 1 FROM public.community_posts cp 
  WHERE cp.community_id = c.id
)
LIMIT 3;

-- Add sample question posts
INSERT INTO public.community_posts (community_id, user_id, title, content, category, tags)
SELECT 
  c.id,
  c.creator_id,
  'How do you stay motivated?',
  'I''m curious about everyone''s motivation strategies. What keeps you going when things get tough?',
  'Question',
  ARRAY['question', 'motivation', 'advice']
FROM public.communities c
WHERE EXISTS (
  SELECT 1 FROM public.community_posts cp 
  WHERE cp.community_id = c.id
)
LIMIT 3;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Discussion feature database schema created successfully!';
  RAISE NOTICE 'Tables created: community_posts, community_post_likes, community_post_comments, community_post_bookmarks, community_post_views, community_comment_likes';
  RAISE NOTICE 'All triggers, functions, and policies have been set up.';
  RAISE NOTICE 'Sample data has been inserted for testing.';
END $$;