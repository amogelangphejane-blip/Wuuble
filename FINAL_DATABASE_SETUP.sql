-- ===================================================================
-- FINAL DATABASE SETUP FOR SIMPLE MESSAGING SYSTEM
-- Copy and paste this ENTIRE file into Supabase SQL Editor and run it
-- ===================================================================

-- 1. Create profiles table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_user_profile' 
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT unique_user_profile UNIQUE (user_id);
  END IF;
END $$;

-- 2. Create simple conversations table
CREATE TABLE IF NOT EXISTS public.simple_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraints if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_simple_conversation' 
    AND conrelid = 'public.simple_conversations'::regclass
  ) THEN
    ALTER TABLE public.simple_conversations ADD CONSTRAINT unique_simple_conversation UNIQUE (user1_id, user2_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'different_users' 
    AND conrelid = 'public.simple_conversations'::regclass
  ) THEN
    ALTER TABLE public.simple_conversations ADD CONSTRAINT different_users CHECK (user1_id != user2_id);
  END IF;
END $$;

-- 3. Create simple messages table
CREATE TABLE IF NOT EXISTS public.simple_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.simple_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'non_empty_message' 
    AND conrelid = 'public.simple_messages'::regclass
  ) THEN
    ALTER TABLE public.simple_messages ADD CONSTRAINT non_empty_message CHECK (LENGTH(TRIM(content)) > 0);
  END IF;
END $$;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_simple_conversations_user1 ON public.simple_conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_simple_conversations_user2 ON public.simple_conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_simple_conversations_updated ON public.simple_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_simple_messages_conversation ON public.simple_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_simple_messages_created ON public.simple_messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_simple_messages_sender ON public.simple_messages(sender_id);

-- 5. Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simple_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simple_messages ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their conversations" ON public.simple_conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.simple_conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON public.simple_conversations;
DROP POLICY IF EXISTS "Users can view their messages" ON public.simple_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.simple_messages;

-- 7. Create RLS policies for profiles table
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Create RLS policies for conversations table
CREATE POLICY "Users can view their conversations" ON public.simple_conversations
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create conversations" ON public.simple_conversations
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their conversations" ON public.simple_conversations
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 9. Create RLS policies for messages table
CREATE POLICY "Users can view their messages" ON public.simple_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.simple_conversations c
      WHERE c.id = conversation_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages" ON public.simple_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.simple_conversations c
      WHERE c.id = conversation_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

-- 10. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.simple_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.simple_messages TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 11. Create function to update conversation timestamp when new message is sent
CREATE OR REPLACE FUNCTION update_simple_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.simple_conversations 
  SET updated_at = NOW(), last_message = NEW.content
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger to automatically update conversation timestamp
DROP TRIGGER IF EXISTS trigger_update_simple_conversation_timestamp ON public.simple_messages;
CREATE TRIGGER trigger_update_simple_conversation_timestamp
  AFTER INSERT ON public.simple_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_simple_conversation_timestamp();

-- 13. Create helper function to create user profile automatically
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, created_at)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User ' || SUBSTRING(NEW.id::text, 1, 8)),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. Create trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();

-- ===================================================================
-- SETUP COMPLETE!
-- ===================================================================

-- Test the setup by running these queries:
-- SELECT * FROM public.profiles LIMIT 5;
-- SELECT * FROM public.simple_conversations LIMIT 5;
-- SELECT * FROM public.simple_messages LIMIT 5;

-- If you see no errors above, your database is ready for messaging!
-- Next steps:
-- 1. Go to http://localhost:5173/messages/test to test the system
-- 2. If tests pass, go to http://localhost:5173/messages to use it
-- 3. Create conversations by entering other users' IDs

SELECT 'Database setup completed successfully! 🎉' as status;