-- Create community posts table for text messaging within communities
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on community posts
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Add trigger to update timestamps
CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_community_posts_community_id ON public.community_posts(community_id);
CREATE INDEX idx_community_posts_created_at ON public.community_posts(created_at DESC);

-- RLS Policies for community posts
CREATE POLICY "Users can view posts in communities they have access to"
ON public.community_posts
FOR SELECT
USING (
  -- User can view posts if the community is public
  (SELECT is_private FROM public.communities WHERE id = community_id) = false
  OR
  -- User can view posts if they are a member of the community
  EXISTS (
    SELECT 1 FROM public.community_members 
    WHERE community_id = community_posts.community_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create posts in communities they belong to"
ON public.community_posts
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND
  EXISTS (
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
USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON public.community_posts TO authenticated;
GRANT ALL ON public.community_posts TO service_role;