-- Add community post reactions table
-- This replaces the basic likes system with a more comprehensive reaction system
CREATE TABLE public.community_post_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'angry', 'sad', 'thumbsup')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id) -- Users can only have one reaction per post
);

-- Enable RLS on reactions table
ALTER TABLE public.community_post_reactions ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_community_post_reactions_post_id ON public.community_post_reactions(post_id);
CREATE INDEX idx_community_post_reactions_user_id ON public.community_post_reactions(user_id);
CREATE INDEX idx_community_post_reactions_type ON public.community_post_reactions(reaction_type);
CREATE INDEX idx_community_post_reactions_created_at ON public.community_post_reactions(created_at DESC);

-- RLS Policies for reactions
CREATE POLICY "Users can view reactions on posts they can access"
ON public.community_post_reactions
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

CREATE POLICY "Users can react to posts in accessible communities"
ON public.community_post_reactions
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

CREATE POLICY "Users can update their own reactions"
ON public.community_post_reactions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
ON public.community_post_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Create a function to get reaction counts for a post
CREATE OR REPLACE FUNCTION get_post_reaction_counts(post_uuid UUID)
RETURNS JSONB
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    jsonb_object_agg(
      reaction_type, 
      count
    ), 
    '{}'::jsonb
  ) as reactions
  FROM (
    SELECT 
      reaction_type,
      COUNT(*)::int as count
    FROM public.community_post_reactions
    WHERE post_id = post_uuid
    GROUP BY reaction_type
  ) reaction_counts;
$$;

-- Create a function to get user's reaction for a post
CREATE OR REPLACE FUNCTION get_user_post_reaction(post_uuid UUID, user_uuid UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT reaction_type
  FROM public.community_post_reactions
  WHERE post_id = post_uuid AND user_id = user_uuid
  LIMIT 1;
$$;

-- Enable realtime for reactions
ALTER TABLE public.community_post_reactions REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.community_post_reactions;

-- Grant permissions
GRANT ALL ON public.community_post_reactions TO authenticated;
GRANT ALL ON public.community_post_reactions TO service_role;
GRANT EXECUTE ON FUNCTION get_post_reaction_counts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_post_reaction(UUID, UUID) TO authenticated;

-- Add comments to explain the new table
COMMENT ON TABLE public.community_post_reactions IS 'Stores user reactions (emojis) to community posts';
COMMENT ON COLUMN public.community_post_reactions.reaction_type IS 'Type of reaction: like, love, laugh, angry, sad, thumbsup';