-- =====================================================
-- FIX DISCUSSION FEATURE - QUICK SETUP
-- =====================================================
-- This script ensures the discussion feature works properly

-- 1. First, ensure profiles table has the right structure
-- Check if profiles table exists, if not create it
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  username TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 2. Create or update profile for existing users
INSERT INTO public.profiles (user_id, email, username)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (user_id) 
DO UPDATE SET 
  email = EXCLUDED.email,
  username = COALESCE(profiles.username, EXCLUDED.username);

-- 3. Create a function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, username)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Fix the foreign key relationship for community_posts if needed
-- First check if the foreign key exists
DO $$
BEGIN
  -- Check if the constraint exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'community_posts_user_id_fkey'
    AND table_name = 'community_posts'
  ) THEN
    -- Add the foreign key if it doesn't exist
    ALTER TABLE community_posts
    ADD CONSTRAINT community_posts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 5. Create a view that makes it easier to query posts with user info
CREATE OR REPLACE VIEW community_posts_with_profiles AS
SELECT 
  cp.*,
  p.username,
  p.avatar_url,
  COALESCE(p.email, u.email) as user_email
FROM community_posts cp
LEFT JOIN auth.users u ON cp.user_id = u.id
LEFT JOIN profiles p ON p.user_id = cp.user_id;

-- Grant access to the view
GRANT SELECT ON community_posts_with_profiles TO authenticated;

-- 6. Add some test posts if there are none
DO $$
DECLARE
  v_community_id UUID;
  v_user_id UUID;
  v_post_count INT;
BEGIN
  -- Get a community and user
  SELECT id INTO v_community_id FROM communities LIMIT 1;
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  -- Check if there are any posts
  SELECT COUNT(*) INTO v_post_count FROM community_posts;
  
  IF v_community_id IS NOT NULL AND v_user_id IS NOT NULL AND v_post_count = 0 THEN
    -- Insert test posts
    INSERT INTO community_posts (community_id, user_id, title, content, category, tags, is_pinned)
    VALUES 
      (v_community_id, v_user_id, 'Welcome to our Community!', 'This is the first post. Feel free to introduce yourself!', 'Announcements', ARRAY['welcome', 'introduction'], true),
      (v_community_id, v_user_id, 'How to get started', 'Here are some tips for new members...', 'General', ARRAY['tips', 'guide'], false),
      (v_community_id, v_user_id, 'Discussion: Best practices', 'What are your favorite community engagement strategies?', 'Discussion', ARRAY['discussion', 'engagement'], false);
    
    RAISE NOTICE 'Added % test posts', 3;
  END IF;
END $$;

-- 7. Verify everything is set up
SELECT 
  'Setup Complete' as status,
  (SELECT COUNT(*) FROM community_posts) as total_posts,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM communities) as total_communities;