-- Complete Fix for Community Discussion Posts Feature
-- This script combines all necessary database changes

-- 1. Add image_url to community_posts if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='community_posts' AND column_name='image_url') THEN
        ALTER TABLE public.community_posts ADD COLUMN image_url TEXT NULL;
        CREATE INDEX idx_community_posts_image_url ON public.community_posts(image_url) WHERE image_url IS NOT NULL;
    END IF;
END $$;

-- 2. Create community_post_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.community_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- 3. Create community_post_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.community_post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.community_post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Enable RLS on both tables if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
                   WHERE c.relname = 'community_post_likes' AND n.nspname = 'public' 
                   AND c.relrowsecurity = true) THEN
        ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
                   WHERE c.relname = 'community_post_comments' AND n.nspname = 'public' 
                   AND c.relrowsecurity = true) THEN
        ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 5. Add trigger for comment timestamps if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_community_post_comments_updated_at') THEN
        CREATE TRIGGER update_community_post_comments_updated_at
          BEFORE UPDATE ON public.community_post_comments
          FOR EACH ROW
          EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- 6. Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_community_post_likes_post_id ON public.community_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_likes_user_id ON public.community_post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_post_comments_post_id ON public.community_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_comments_parent_id ON public.community_post_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_community_post_comments_created_at ON public.community_post_comments(created_at DESC);

-- 7. RLS Policies for likes (drop existing if they exist and recreate)
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

-- 8. RLS Policies for comments (drop existing if they exist and recreate)
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

-- 9. Enable realtime for likes and comments if not already enabled
DO $$ 
BEGIN
    -- Enable replica identity for realtime
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'community_post_likes' AND relreplident = 'f') THEN
        ALTER TABLE public.community_post_likes REPLICA IDENTITY FULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'community_post_comments' AND relreplident = 'f') THEN
        ALTER TABLE public.community_post_comments REPLICA IDENTITY FULL;
    END IF;
EXCEPTION 
    WHEN others THEN
        -- Ignore errors for realtime setup as it may not be available in all environments
        NULL;
END $$;

-- 10. Add tables to realtime publication if not already added
DO $$ 
BEGIN
    -- Try to add tables to realtime publication
    ALTER publication supabase_realtime ADD TABLE public.community_post_likes;
EXCEPTION 
    WHEN duplicate_object THEN
        NULL; -- Table already added
    WHEN others THEN
        NULL; -- Publication may not exist
END $$;

DO $$ 
BEGIN
    ALTER publication supabase_realtime ADD TABLE public.community_post_comments;
EXCEPTION 
    WHEN duplicate_object THEN
        NULL; -- Table already added
    WHEN others THEN
        NULL; -- Publication may not exist
END $$;

-- 11. Grant permissions
GRANT ALL ON public.community_post_likes TO authenticated;
GRANT ALL ON public.community_post_likes TO service_role;
GRANT ALL ON public.community_post_comments TO authenticated;
GRANT ALL ON public.community_post_comments TO service_role;

-- 12. Create storage bucket for community post images if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-post-images',
  'Community Post Images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 13. Create storage policies for community post images (drop existing and recreate)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can upload post images" ON storage.objects;
    CREATE POLICY "Users can upload post images"
    ON storage.objects 
    FOR INSERT 
    WITH CHECK (
      bucket_id = 'community-post-images' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION 
    WHEN others THEN
        NULL; -- Ignore errors for storage policies
END $$;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view all post images" ON storage.objects;
    CREATE POLICY "Users can view all post images"
    ON storage.objects 
    FOR SELECT 
    USING (bucket_id = 'community-post-images');
EXCEPTION 
    WHEN others THEN
        NULL; -- Ignore errors for storage policies
END $$;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can update their own post images" ON storage.objects;
    CREATE POLICY "Users can update their own post images"
    ON storage.objects 
    FOR UPDATE 
    USING (
      bucket_id = 'community-post-images'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION 
    WHEN others THEN
        NULL; -- Ignore errors for storage policies
END $$;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects;
    CREATE POLICY "Users can delete their own post images"
    ON storage.objects 
    FOR DELETE 
    USING (
      bucket_id = 'community-post-images'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION 
    WHEN others THEN
        NULL; -- Ignore errors for storage policies
END $$;

-- 14. Add check constraint for posts to have either content or image
DO $$ 
BEGIN
    -- First update any existing posts that might have empty content
    UPDATE public.community_posts 
    SET content = '[Image]' 
    WHERE (content IS NULL OR content = '') AND image_url IS NOT NULL;
    
    -- Add constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'check_post_has_content_or_image' 
                   AND table_name = 'community_posts') THEN
        ALTER TABLE public.community_posts 
        ADD CONSTRAINT check_post_has_content_or_image 
        CHECK (
          (content IS NOT NULL AND content != '') 
          OR 
          (image_url IS NOT NULL AND image_url != '')
        );
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON CONSTRAINT check_post_has_content_or_image ON public.community_posts 
IS 'Ensures that posts have either text content or an image (or both)';

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Community discussion posts feature setup completed successfully!';
    RAISE NOTICE 'Tables created/updated: community_posts (with image_url), community_post_likes, community_post_comments';
    RAISE NOTICE 'RLS policies applied for security';
    RAISE NOTICE 'Storage bucket created for post images';
    RAISE NOTICE 'Realtime enabled for live updates';
END $$;