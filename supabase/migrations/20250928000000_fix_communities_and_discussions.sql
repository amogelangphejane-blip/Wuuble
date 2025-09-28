-- Fix communities and discussions schema issues
-- This migration addresses schema inconsistencies and ensures all features work

-- First, drop any conflicting tables and recreate them properly
DROP TABLE IF EXISTS public.community_post_views CASCADE;
DROP TABLE IF EXISTS public.community_post_bookmarks CASCADE;
DROP TABLE IF EXISTS public.community_comment_likes CASCADE;
DROP TABLE IF EXISTS public.community_post_comments CASCADE;
DROP TABLE IF EXISTS public.community_post_likes CASCADE;
DROP TABLE IF EXISTS public.community_posts CASCADE;

-- Add missing columns to communities table if they don't exist
DO $$ 
BEGIN
    -- Add owner_id as alias to creator_id for consistency
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'owner_id') THEN
        ALTER TABLE public.communities ADD COLUMN owner_id UUID;
        UPDATE public.communities SET owner_id = creator_id;
        ALTER TABLE public.communities ALTER COLUMN owner_id SET NOT NULL;
        ALTER TABLE public.communities ADD CONSTRAINT fk_communities_owner_id 
            FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add category column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'category') THEN
        ALTER TABLE public.communities ADD COLUMN category TEXT;
    END IF;
    
    -- Add tags column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'tags') THEN
        ALTER TABLE public.communities ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
    
    -- Add rules column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'rules') THEN
        ALTER TABLE public.communities ADD COLUMN rules TEXT;
    END IF;
END $$;

-- Update RLS policies for communities to work with both creator_id and owner_id
DROP POLICY IF EXISTS "Users can view public communities" ON public.communities;
DROP POLICY IF EXISTS "Users can create communities" ON public.communities;
DROP POLICY IF EXISTS "Community creators can update their communities" ON public.communities;
DROP POLICY IF EXISTS "Community creators can delete their communities" ON public.communities;

CREATE POLICY "Users can view public communities" 
  ON public.communities 
  FOR SELECT 
  USING (NOT is_private OR creator_id = auth.uid() OR owner_id = auth.uid() OR 
         EXISTS (SELECT 1 FROM public.community_members WHERE community_id = id AND user_id = auth.uid()));

CREATE POLICY "Users can create communities" 
  ON public.communities 
  FOR INSERT 
  WITH CHECK (auth.uid() = creator_id OR auth.uid() = owner_id);

CREATE POLICY "Community creators can update their communities" 
  ON public.communities 
  FOR UPDATE 
  USING (auth.uid() = creator_id OR auth.uid() = owner_id);

CREATE POLICY "Community creators can delete their communities" 
  ON public.communities 
  FOR DELETE 
  USING (auth.uid() = creator_id OR auth.uid() = owner_id);

-- Add owner role to community_members table role check
ALTER TABLE public.community_members DROP CONSTRAINT IF EXISTS community_members_role_check;
ALTER TABLE public.community_members ADD CONSTRAINT community_members_role_check 
    CHECK (role IN ('owner', 'admin', 'moderator', 'member'));

-- Create comprehensive community posts table
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  content TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT,
  link_title TEXT,
  link_description TEXT,
  link_image_url TEXT,
  category VARCHAR(100) DEFAULT 'general',
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

-- Enable RLS on all tables
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_bookmarks ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_community_posts_community_id ON public.community_posts(community_id);
CREATE INDEX idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX idx_community_posts_category ON public.community_posts(category);
CREATE INDEX idx_community_posts_is_pinned ON public.community_posts(is_pinned DESC);
CREATE INDEX idx_community_posts_likes_count ON public.community_posts(likes_count DESC);
CREATE INDEX idx_community_posts_last_activity ON public.community_posts(last_activity_at DESC);

CREATE INDEX idx_community_post_likes_post_id ON public.community_post_likes(post_id);
CREATE INDEX idx_community_post_likes_user_id ON public.community_post_likes(user_id);

CREATE INDEX idx_community_post_comments_post_id ON public.community_post_comments(post_id);
CREATE INDEX idx_community_post_comments_user_id ON public.community_post_comments(user_id);
CREATE INDEX idx_community_post_comments_parent_id ON public.community_post_comments(parent_comment_id);
CREATE INDEX idx_community_post_comments_created_at ON public.community_post_comments(created_at DESC);

CREATE INDEX idx_community_post_bookmarks_user_id ON public.community_post_bookmarks(user_id);
CREATE INDEX idx_community_post_bookmarks_post_id ON public.community_post_bookmarks(post_id);

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

-- Create triggers for automatic count updates
CREATE TRIGGER update_post_likes_count_trigger
AFTER INSERT OR DELETE ON community_post_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER update_post_comments_count_trigger
AFTER INSERT OR DELETE ON community_post_comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comments_count();

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

CREATE POLICY "Users can delete their own posts or community owners can delete"
ON public.community_posts
FOR DELETE
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = community_id 
    AND (c.owner_id = auth.uid() OR c.creator_id = auth.uid())
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

CREATE POLICY "Users can delete their own comments or community owners can delete"
ON public.community_post_comments
FOR DELETE
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.community_posts cp
    JOIN public.communities c ON c.id = cp.community_id
    WHERE cp.id = post_id 
    AND (c.owner_id = auth.uid() OR c.creator_id = auth.uid())
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

GRANT ALL ON public.community_posts TO service_role;
GRANT ALL ON public.community_post_likes TO service_role;
GRANT ALL ON public.community_post_comments TO service_role;
GRANT ALL ON public.community_post_bookmarks TO service_role;