-- Complete communities schema fix
-- This ensures all expected columns exist and the table structure matches frontend expectations

-- Add missing columns to communities table if they don't exist
DO $$ 
BEGIN
    -- Add owner_id as alias to creator_id for consistency (if not already added)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'owner_id') THEN
        ALTER TABLE public.communities ADD COLUMN owner_id UUID;
        UPDATE public.communities SET owner_id = creator_id WHERE owner_id IS NULL;
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
    
    -- Add banner_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'banner_url') THEN
        ALTER TABLE public.communities ADD COLUMN banner_url TEXT;
    END IF;
    
    -- Add is_premium column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'is_premium') THEN
        ALTER TABLE public.communities ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add subscription_price column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'subscription_price') THEN
        ALTER TABLE public.communities ADD COLUMN subscription_price DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Recreate RLS policies to work with both creator_id and owner_id
DROP POLICY IF EXISTS "Users can view public communities" ON public.communities;
DROP POLICY IF EXISTS "Users can create communities" ON public.communities;
DROP POLICY IF EXISTS "Community creators can update their communities" ON public.communities;
DROP POLICY IF EXISTS "Community creators can delete their communities" ON public.communities;

-- Updated RLS policies
CREATE POLICY "Users can view public communities" 
  ON public.communities 
  FOR SELECT 
  USING (
    NOT is_private 
    OR creator_id = auth.uid() 
    OR owner_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.community_members 
      WHERE community_id = communities.id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create communities" 
  ON public.communities 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = creator_id 
    AND auth.uid() = owner_id
  );

CREATE POLICY "Community creators can update their communities" 
  ON public.communities 
  FOR UPDATE 
  USING (
    auth.uid() = creator_id 
    OR auth.uid() = owner_id
  );

CREATE POLICY "Community creators can delete their communities" 
  ON public.communities 
  FOR DELETE 
  USING (
    auth.uid() = creator_id 
    OR auth.uid() = owner_id
  );

-- Ensure community_members table has correct role constraint
ALTER TABLE public.community_members DROP CONSTRAINT IF EXISTS community_members_role_check;
ALTER TABLE public.community_members ADD CONSTRAINT community_members_role_check 
    CHECK (role IN ('owner', 'admin', 'moderator', 'member'));

-- Create some sample communities if none exist (for testing)
INSERT INTO public.communities (name, description, creator_id, owner_id, category, is_private, member_count)
SELECT 
    'Welcome Community',
    'A community for new members to get started and connect with others.',
    auth.uid(),
    auth.uid(),
    'general',
    false,
    1
WHERE NOT EXISTS (SELECT 1 FROM public.communities LIMIT 1)
  AND auth.uid() IS NOT NULL;

-- Grant all necessary permissions
GRANT ALL ON public.communities TO authenticated;
GRANT ALL ON public.communities TO service_role;
GRANT ALL ON public.community_members TO authenticated;
GRANT ALL ON public.community_members TO service_role;