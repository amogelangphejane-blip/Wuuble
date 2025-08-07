-- Create community_posts table for posts within communities
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for community posts
CREATE POLICY "Users can view posts in accessible communities" 
ON public.community_posts 
FOR SELECT 
USING (
  -- Can view if community is public OR user is member OR user created community
  EXISTS (
    SELECT 1 FROM public.communities c 
    WHERE c.id = community_posts.community_id 
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

CREATE POLICY "Users can create posts in communities they belong to" 
ON public.community_posts 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.communities c 
    WHERE c.id = community_posts.community_id 
    AND (
      c.creator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.community_members cm 
        WHERE cm.community_id = c.id AND cm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can update their own posts" 
ON public.community_posts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts or community admins can delete posts" 
ON public.community_posts 
FOR DELETE 
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.communities c 
    WHERE c.id = community_posts.community_id 
    AND c.creator_id = auth.uid()
  )
);

-- Add foreign key constraint to profiles
ALTER TABLE public.community_posts 
ADD CONSTRAINT community_posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_community_posts_updated_at
BEFORE UPDATE ON public.community_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for community posts
ALTER TABLE public.community_posts REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.community_posts;