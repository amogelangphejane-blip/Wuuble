-- Fix Live Streams Creator Relationship
-- This migration fixes the inconsistent foreign key relationship for creator_id in live_streams table
-- The original migration referenced auth.users(id) but should reference profiles(user_id) for consistency

-- First, let's check if the table exists and drop the old foreign key constraint
DO $$ 
BEGIN
    -- Drop the existing foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'live_streams_creator_id_fkey' 
        AND table_name = 'live_streams'
    ) THEN
        ALTER TABLE live_streams DROP CONSTRAINT live_streams_creator_id_fkey;
    END IF;
END $$;

-- Add the correct foreign key constraint to reference profiles(user_id)
-- This is consistent with other tables in the system like community_group_calls
ALTER TABLE live_streams 
ADD CONSTRAINT live_streams_creator_id_fkey 
FOREIGN KEY (creator_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Also fix the stream_viewers table to be consistent
DO $$ 
BEGIN
    -- Drop the existing foreign key constraint if it exists
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

-- Fix the stream_chat table to be consistent
DO $$ 
BEGIN
    -- Drop the existing foreign key constraint if it exists
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

-- Fix the stream_reactions table to be consistent
DO $$ 
BEGIN
    -- Drop the existing foreign key constraint if it exists
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

-- Fix the enhanced live streams tables that were created with wrong references

-- Fix stream_questions table (this was referencing profiles(id) instead of profiles(user_id))
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'stream_questions_user_id_fkey' 
        AND table_name = 'stream_questions'
    ) THEN
        ALTER TABLE stream_questions DROP CONSTRAINT stream_questions_user_id_fkey;
    END IF;
END $$;

ALTER TABLE stream_questions 
ADD CONSTRAINT stream_questions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Fix answered_by reference as well
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'stream_questions_answered_by_fkey' 
        AND table_name = 'stream_questions'
    ) THEN
        ALTER TABLE stream_questions DROP CONSTRAINT stream_questions_answered_by_fkey;
    END IF;
END $$;

ALTER TABLE stream_questions 
ADD CONSTRAINT stream_questions_answered_by_fkey 
FOREIGN KEY (answered_by) REFERENCES profiles(user_id) ON DELETE SET NULL;

-- Fix stream_polls table
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'stream_polls_creator_id_fkey' 
        AND table_name = 'stream_polls'
    ) THEN
        ALTER TABLE stream_polls DROP CONSTRAINT stream_polls_creator_id_fkey;
    END IF;
END $$;

ALTER TABLE stream_polls 
ADD CONSTRAINT stream_polls_creator_id_fkey 
FOREIGN KEY (creator_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Fix stream_poll_votes table
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'stream_poll_votes_user_id_fkey' 
        AND table_name = 'stream_poll_votes'
    ) THEN
        ALTER TABLE stream_poll_votes DROP CONSTRAINT stream_poll_votes_user_id_fkey;
    END IF;
END $$;

ALTER TABLE stream_poll_votes 
ADD CONSTRAINT stream_poll_votes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Fix stream_highlights table
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'stream_highlights_creator_id_fkey' 
        AND table_name = 'stream_highlights'
    ) THEN
        ALTER TABLE stream_highlights DROP CONSTRAINT stream_highlights_creator_id_fkey;
    END IF;
END $$;

ALTER TABLE stream_highlights 
ADD CONSTRAINT stream_highlights_creator_id_fkey 
FOREIGN KEY (creator_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Fix stream_moderators table
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'stream_moderators_user_id_fkey' 
        AND table_name = 'stream_moderators'
    ) THEN
        ALTER TABLE stream_moderators DROP CONSTRAINT stream_moderators_user_id_fkey;
    END IF;
END $$;

ALTER TABLE stream_moderators 
ADD CONSTRAINT stream_moderators_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'stream_moderators_assigned_by_fkey' 
        AND table_name = 'stream_moderators'
    ) THEN
        ALTER TABLE stream_moderators DROP CONSTRAINT stream_moderators_assigned_by_fkey;
    END IF;
END $$;

ALTER TABLE stream_moderators 
ADD CONSTRAINT stream_moderators_assigned_by_fkey 
FOREIGN KEY (assigned_by) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Fix stream_analytics table
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'stream_analytics_user_id_fkey' 
        AND table_name = 'stream_analytics'
    ) THEN
        ALTER TABLE stream_analytics DROP CONSTRAINT stream_analytics_user_id_fkey;
    END IF;
END $$;

ALTER TABLE stream_analytics 
ADD CONSTRAINT stream_analytics_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE SET NULL;

-- Add a comment to document this fix
COMMENT ON TABLE live_streams IS 'Live streaming functionality for communities. Fixed foreign key relationships to reference profiles(user_id) consistently.';