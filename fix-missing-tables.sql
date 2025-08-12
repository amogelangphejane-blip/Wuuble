-- Fix for missing community discussion tables
-- Run this SQL in your Supabase Dashboard > SQL Editor

-- Add community post likes table
CREATE TABLE IF NOT EXISTS public.community_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Add community post comments table
CREATE TABLE IF NOT EXISTS public.community_post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.community_post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;

-- Add trigger for comment timestamps (only if the function exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE TRIGGER update_community_post_comments_updated_at
      BEFORE UPDATE ON public.community_post_comments
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_post_likes_post_id ON public.community_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_likes_user_id ON public.community_post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_post_comments_post_id ON public.community_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_comments_parent_id ON public.community_post_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_community_post_comments_created_at ON public.community_post_comments(created_at DESC);

-- RLS Policies for likes
DROP POLICY IF EXISTS "Users can view likes on posts they can access" ON public.community_post_likes;
CREATE POLICY "Users can view likes on posts they can access"
ON public.community_post_likes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_posts cp
    JOIN public.communities c ON c.id = cp.community_id
    WHERE cp.id = post_id
    AND (
      NOT c.is_private 
      OR c.creator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.community_members cm 
        WHERE cm.community_id = c.id AND cm.user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "Users can like posts in accessible communities" ON public.community_post_likes;
CREATE POLICY "Users can like posts in accessible communities"
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
      OR c.creator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.community_members cm 
        WHERE cm.community_id = c.id AND cm.user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "Users can remove their own likes" ON public.community_post_likes;
CREATE POLICY "Users can remove their own likes"
ON public.community_post_likes
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for comments
DROP POLICY IF EXISTS "Users can view comments on posts they can access" ON public.community_post_comments;
CREATE POLICY "Users can view comments on posts they can access"
ON public.community_post_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_posts cp
    JOIN public.communities c ON c.id = cp.community_id
    WHERE cp.id = post_id
    AND (
      NOT c.is_private 
      OR c.creator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.community_members cm 
        WHERE cm.community_id = c.id AND cm.user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "Users can comment on posts in accessible communities" ON public.community_post_comments;
CREATE POLICY "Users can comment on posts in accessible communities"
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
      OR c.creator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.community_members cm 
        WHERE cm.community_id = c.id AND cm.user_id = auth.uid()
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

DROP POLICY IF EXISTS "Users can delete their own comments or community creators can delete comments" ON public.community_post_comments;
CREATE POLICY "Users can delete their own comments or community creators can delete comments"
ON public.community_post_comments
FOR DELETE
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.community_posts cp
    JOIN public.communities c ON c.id = cp.community_id
    WHERE cp.id = post_id AND c.creator_id = auth.uid()
  )
);

-- Enable realtime for likes and comments
ALTER TABLE public.community_post_likes REPLICA IDENTITY FULL;
ALTER TABLE public.community_post_comments REPLICA IDENTITY FULL;

-- Add tables to realtime publication (this might fail if already added, that's OK)
DO $$
BEGIN
  BEGIN
    ALTER publication supabase_realtime ADD TABLE public.community_post_likes;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    ALTER publication supabase_realtime ADD TABLE public.community_post_comments;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Grant permissions
GRANT ALL ON public.community_post_likes TO authenticated;
GRANT ALL ON public.community_post_likes TO service_role;
GRANT ALL ON public.community_post_comments TO authenticated;
GRANT ALL ON public.community_post_comments TO service_role;

-- Verification queries
SELECT 'Tables created successfully' as status;
SELECT schemaname, tablename FROM pg_tables WHERE tablename IN ('community_post_likes', 'community_post_comments');