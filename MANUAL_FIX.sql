-- MANUAL FIX FOR COMMUNITIES LOADING ISSUE
-- Copy and paste this entire SQL into your Supabase dashboard
-- Go to: https://supabase.com/dashboard/project/[your-project]/sql

-- Step 1: Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view public communities" ON public.communities;
DROP POLICY IF EXISTS "Users can create communities" ON public.communities;
DROP POLICY IF EXISTS "Community creators can update their communities" ON public.communities;
DROP POLICY IF EXISTS "Community creators can delete their communities" ON public.communities;
DROP POLICY IF EXISTS "Enable read for public communities and members" ON public.communities;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.communities;
DROP POLICY IF EXISTS "Enable update for owners" ON public.communities;
DROP POLICY IF EXISTS "Enable delete for owners" ON public.communities;

-- Step 2: Create simple, working RLS policies
CREATE POLICY "communities_select_policy"
ON public.communities
FOR SELECT
USING (
  -- Everyone can see public communities
  (NOT is_private)
  OR
  -- Owners can see their communities
  (creator_id = auth.uid())
  OR
  (owner_id = auth.uid())
);

CREATE POLICY "communities_insert_policy"
ON public.communities
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND creator_id = auth.uid()
  AND owner_id = auth.uid()
);

CREATE POLICY "communities_update_policy"
ON public.communities
FOR UPDATE
USING (creator_id = auth.uid() OR owner_id = auth.uid())
WITH CHECK (creator_id = auth.uid() OR owner_id = auth.uid());

CREATE POLICY "communities_delete_policy"
ON public.communities
FOR DELETE
USING (creator_id = auth.uid() OR owner_id = auth.uid());

-- Step 3: Make sure we have the required columns
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Step 4: Update owner_id for existing communities
UPDATE public.communities SET owner_id = creator_id WHERE owner_id IS NULL;

-- Step 5: Create a sample community for testing (optional)
INSERT INTO public.communities (name, description, creator_id, owner_id, is_private, member_count)
VALUES (
  'Welcome Community',
  'A place for everyone to get started!',
  auth.uid(),
  auth.uid(),
  false,
  1
)
ON CONFLICT DO NOTHING;