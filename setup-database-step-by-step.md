# 🔧 Fix "Failed to load conversations" Error

## Step 1: Open Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click on **"SQL Editor"** in the left sidebar

## Step 2: Copy and Run This SQL

**Copy ALL of this SQL and paste it into the SQL Editor, then click "RUN":**

```sql
-- Step 1: Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add unique constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS unique_user_profile;
ALTER TABLE public.profiles ADD CONSTRAINT unique_user_profile UNIQUE (user_id);

-- Step 3: Add foreign key constraint (this might fail if users don't exist, that's OK)
DO $$
BEGIN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Foreign key constraint already exists or users table not accessible';
END $$;

-- Step 4: Create conversations table
CREATE TABLE IF NOT EXISTS public.simple_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL,
  user2_id UUID NOT NULL,
  last_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Add constraints to conversations
ALTER TABLE public.simple_conversations DROP CONSTRAINT IF EXISTS unique_simple_conversation;
ALTER TABLE public.simple_conversations ADD CONSTRAINT unique_simple_conversation UNIQUE (user1_id, user2_id);

ALTER TABLE public.simple_conversations DROP CONSTRAINT IF EXISTS different_users;
ALTER TABLE public.simple_conversations ADD CONSTRAINT different_users CHECK (user1_id != user2_id);

-- Step 6: Create messages table
CREATE TABLE IF NOT EXISTS public.simple_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.simple_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 7: Add message constraint
ALTER TABLE public.simple_messages DROP CONSTRAINT IF EXISTS non_empty_message;
ALTER TABLE public.simple_messages ADD CONSTRAINT non_empty_message CHECK (LENGTH(TRIM(content)) > 0);

-- Step 8: Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_simple_conversations_user1 ON public.simple_conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_simple_conversations_user2 ON public.simple_conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_simple_messages_conversation ON public.simple_messages(conversation_id);

-- Step 9: Enable RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simple_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simple_messages ENABLE ROW LEVEL SECURITY;

-- Step 10: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their conversations" ON public.simple_conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.simple_conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON public.simple_conversations;
DROP POLICY IF EXISTS "Users can view their messages" ON public.simple_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.simple_messages;

-- Step 11: Create policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Step 12: Create policies for conversations
CREATE POLICY "Users can view their conversations" ON public.simple_conversations 
FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create conversations" ON public.simple_conversations 
FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their conversations" ON public.simple_conversations 
FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Step 13: Create policies for messages
CREATE POLICY "Users can view their messages" ON public.simple_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.simple_conversations c
    WHERE c.id = conversation_id AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages" ON public.simple_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.simple_conversations c
    WHERE c.id = conversation_id AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  )
);

-- Step 14: Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.simple_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.simple_messages TO authenticated;

-- Step 15: Success message
SELECT 'Database setup completed! ✅' as result;
```

## Step 3: Verify Setup
After running the SQL, you should see "Database setup completed! ✅" at the bottom.

## Step 4: Test the Connection
1. Go to your app: `http://localhost:5173/messages/test`
2. Click "Run Tests"
3. All tests should pass now

## Step 5: Use Messaging
1. Go to: `http://localhost:5173/messages`
2. The "Failed to load conversations" error should be gone
3. You should see "No conversations yet" instead

## If You Still Get Errors:

### Check 1: Make sure you're logged in
- The messaging system requires authentication
- Sign in to your app first

### Check 2: Check browser console
1. Press F12 to open developer tools
2. Go to Console tab
3. Look for any red error messages
4. Share those errors if you need more help

### Check 3: Verify tables were created
In Supabase:
1. Go to "Table Editor"
2. You should see these tables:
   - `profiles`
   - `simple_conversations`
   - `simple_messages`

## Need More Help?
If it's still not working, check the browser console (F12) and let me know what errors you see there.