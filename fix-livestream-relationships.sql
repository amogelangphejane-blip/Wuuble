-- Quick Fix for Live Streams Relationship Issues
-- Run this in your Supabase SQL Editor to fix the foreign key relationships

-- Fix live_streams.creator_id to reference profiles(user_id)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'live_streams_creator_id_fkey' 
        AND table_name = 'live_streams'
    ) THEN
        ALTER TABLE live_streams DROP CONSTRAINT live_streams_creator_id_fkey;
    END IF;
END $$;

ALTER TABLE live_streams 
ADD CONSTRAINT live_streams_creator_id_fkey 
FOREIGN KEY (creator_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Fix stream_viewers.user_id to reference profiles(user_id)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'stream_viewers_user_id_fkey' 
        AND table_name = 'stream_viewers'
    ) THEN
        ALTER TABLE stream_viewers DROP CONSTRAINT stream_viewers_user_id_fkey;
    END IF;
END $$;

ALTER TABLE stream_viewers 
ADD CONSTRAINT stream_viewers_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Fix stream_chat.user_id to reference profiles(user_id)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'stream_chat_user_id_fkey' 
        AND table_name = 'stream_chat'
    ) THEN
        ALTER TABLE stream_chat DROP CONSTRAINT stream_chat_user_id_fkey;
    END IF;
END $$;

ALTER TABLE stream_chat 
ADD CONSTRAINT stream_chat_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Fix stream_reactions.user_id to reference profiles(user_id)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'stream_reactions_user_id_fkey' 
        AND table_name = 'stream_reactions'
    ) THEN
        ALTER TABLE stream_reactions DROP CONSTRAINT stream_reactions_user_id_fkey;
    END IF;
END $$;

ALTER TABLE stream_reactions 
ADD CONSTRAINT stream_reactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Verify the fix worked
SELECT 
    'live_streams' as table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'live_streams' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'creator_id'

UNION ALL

SELECT 
    'stream_viewers' as table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'stream_viewers' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'user_id'

UNION ALL

SELECT 
    'stream_chat' as table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'stream_chat' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'user_id'

UNION ALL

SELECT 
    'stream_reactions' as table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'stream_reactions' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'user_id';