-- Fix for Messaging RLS Policies
-- The issue is that the get_or_create_conversation function runs with the user's privileges
-- but the RLS policies are too restrictive for the function to work properly

-- First, let's create a more permissive policy for the function
-- We need to allow the function to create conversations even when running as a user

-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;

-- Create more flexible policies that work with the function
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (
    auth.uid() = participant_1_id OR auth.uid() = participant_2_id
  );

-- Allow users to create conversations where they are a participant
-- This policy allows the function to work properly
CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() = participant_1_id OR auth.uid() = participant_2_id
  );

CREATE POLICY "Users can update their own conversations" ON public.conversations
  FOR UPDATE USING (
    auth.uid() = participant_1_id OR auth.uid() = participant_2_id
  );

-- Also fix the get_or_create_conversation function to use SECURITY DEFINER
-- This allows the function to bypass RLS when needed
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID 
LANGUAGE plpgsql
SECURITY DEFINER  -- This is the key change - function runs with owner privileges
AS $$
DECLARE
  conversation_id UUID;
  smaller_id UUID;
  larger_id UUID;
BEGIN
  -- Validate that both users exist (security check)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user1_id) THEN
    RAISE EXCEPTION 'User 1 does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user2_id) THEN
    RAISE EXCEPTION 'User 2 does not exist';
  END IF;
  
  -- Ensure users can't create conversations with themselves
  IF user1_id = user2_id THEN
    RAISE EXCEPTION 'Cannot create conversation with yourself';
  END IF;
  
  -- Ensure consistent ordering to prevent duplicate conversations
  IF user1_id < user2_id THEN
    smaller_id := user1_id;
    larger_id := user2_id;
  ELSE
    smaller_id := user2_id;
    larger_id := user1_id;
  END IF;
  
  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM public.conversations
  WHERE (participant_1_id = smaller_id AND participant_2_id = larger_id)
     OR (participant_1_id = larger_id AND participant_2_id = smaller_id);
  
  -- If no conversation exists, create one
  IF conversation_id IS NULL THEN
    INSERT INTO public.conversations (participant_1_id, participant_2_id)
    VALUES (smaller_id, larger_id)
    RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_or_create_conversation(UUID, UUID) TO authenticated;

-- Also ensure the messages policies are correct
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

-- Messages policies - users can only see messages from conversations they're part of
CREATE POLICY "Users can view messages from their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages to their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (
    auth.uid() = sender_id OR
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

-- Ensure real-time is enabled for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Add some helpful comments
COMMENT ON FUNCTION get_or_create_conversation(UUID, UUID) IS 'Creates or retrieves a conversation between two users. Uses SECURITY DEFINER to bypass RLS during creation.';
COMMENT ON TABLE public.conversations IS 'Stores one-on-one conversations between users with RLS policies.';
COMMENT ON TABLE public.messages IS 'Stores individual messages within conversations with RLS policies.';