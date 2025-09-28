-- Simple Private Messaging System Schema
-- Just the basics: users can send private messages to each other

-- Create simple conversations table
CREATE TABLE IF NOT EXISTS public.simple_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate conversations
  CONSTRAINT unique_simple_conversation UNIQUE (user1_id, user2_id),
  -- Users can't message themselves
  CONSTRAINT different_users CHECK (user1_id != user2_id)
);

-- Create simple messages table
CREATE TABLE IF NOT EXISTS public.simple_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.simple_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Message can't be empty
  CONSTRAINT non_empty_message CHECK (LENGTH(TRIM(content)) > 0)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_simple_conversations_user1 ON public.simple_conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_simple_conversations_user2 ON public.simple_conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_simple_conversations_updated ON public.simple_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_simple_messages_conversation ON public.simple_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_simple_messages_created ON public.simple_messages(created_at ASC);

-- Enable Row Level Security
ALTER TABLE public.simple_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simple_messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies - users can only see their own conversations
CREATE POLICY "Users can view their conversations" ON public.simple_conversations
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create conversations" ON public.simple_conversations
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their conversations" ON public.simple_conversations
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages policies - users can only see messages from their conversations
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

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.simple_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.simple_messages TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;