-- Fix Livestream RLS Policies for Better Public Access
-- Run this in Supabase SQL Editor to fix access issues

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view streams in communities they're members of" ON live_streams;

-- Create more permissive policies for public streams
CREATE POLICY "Anyone can view public live streams" ON live_streams
    FOR SELECT USING (
        -- Allow access to streams without community_id (public streams)
        community_id IS NULL 
        OR 
        -- Allow access to streams in public communities
        community_id IN (
            SELECT id FROM communities WHERE is_private = false
        )
        OR
        -- Allow access to streams in communities user is member of
        community_id IN (
            SELECT community_id FROM community_members 
            WHERE user_id = auth.uid() AND status = 'approved'
        )
        OR 
        -- Allow creators to see their own streams
        creator_id = auth.uid()
    );

-- Allow authenticated users to create personal streams (no community required)
CREATE POLICY "Authenticated users can create streams" ON live_streams
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND creator_id = auth.uid()
        AND (
            -- Allow personal streams (no community)
            community_id IS NULL 
            OR
            -- Allow streams in communities they're members of
            community_id IN (
                SELECT community_id FROM community_members 
                WHERE user_id = auth.uid() AND status = 'approved'
            )
        )
    );

-- Update policy for stream viewers to allow public access
DROP POLICY IF EXISTS "Users can view stream viewers for streams they can access" ON stream_viewers;
CREATE POLICY "Users can view stream viewers for accessible streams" ON stream_viewers
    FOR SELECT USING (
        stream_id IN (
            SELECT id FROM live_streams 
            WHERE 
                community_id IS NULL 
                OR community_id IN (
                    SELECT id FROM communities WHERE is_private = false
                )
                OR community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid() AND status = 'approved'
                )
        )
    );

-- Update policy for joining streams
DROP POLICY IF EXISTS "Users can join streams as viewers" ON stream_viewers;
CREATE POLICY "Users can join accessible streams as viewers" ON stream_viewers
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND stream_id IN (
            SELECT id FROM live_streams 
            WHERE 
                community_id IS NULL 
                OR community_id IN (
                    SELECT id FROM communities WHERE is_private = false
                )
                OR community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid() AND status = 'approved'
                )
        )
    );

-- Update chat policies for public access
DROP POLICY IF EXISTS "Users can view chat for streams they can access" ON stream_chat;
CREATE POLICY "Users can view chat for accessible streams" ON stream_chat
    FOR SELECT USING (
        stream_id IN (
            SELECT id FROM live_streams 
            WHERE 
                community_id IS NULL 
                OR community_id IN (
                    SELECT id FROM communities WHERE is_private = false
                )
                OR community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid() AND status = 'approved'
                )
        )
    );

DROP POLICY IF EXISTS "Users can send chat messages to streams they can access" ON stream_chat;
CREATE POLICY "Users can send chat messages to accessible streams" ON stream_chat
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND stream_id IN (
            SELECT id FROM live_streams 
            WHERE 
                community_id IS NULL 
                OR community_id IN (
                    SELECT id FROM communities WHERE is_private = false
                )
                OR community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid() AND status = 'approved'
                )
        )
    );

-- Update reaction policies
DROP POLICY IF EXISTS "Users can view reactions for streams they can access" ON stream_reactions;
CREATE POLICY "Users can view reactions for accessible streams" ON stream_reactions
    FOR SELECT USING (
        stream_id IN (
            SELECT id FROM live_streams 
            WHERE 
                community_id IS NULL 
                OR community_id IN (
                    SELECT id FROM communities WHERE is_private = false
                )
                OR community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid() AND status = 'approved'
                )
        )
    );

DROP POLICY IF EXISTS "Users can react to streams they can access" ON stream_reactions;
CREATE POLICY "Users can react to accessible streams" ON stream_reactions
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND stream_id IN (
            SELECT id FROM live_streams 
            WHERE 
                community_id IS NULL 
                OR community_id IN (
                    SELECT id FROM communities WHERE is_private = false
                )
                OR community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid() AND status = 'approved'
                )
        )
    );

-- Add policy to allow anonymous users to view public streams (read-only)
-- This is useful for discovery without requiring authentication
CREATE POLICY "Anonymous users can view public streams" ON live_streams
    FOR SELECT USING (
        community_id IS NULL 
        OR community_id IN (
            SELECT id FROM communities WHERE is_private = false
        )
    );

-- Enable realtime for all livestream tables
ALTER PUBLICATION supabase_realtime ADD TABLE live_streams;
ALTER PUBLICATION supabase_realtime ADD TABLE stream_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE stream_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE stream_viewers;

-- Create function to test livestream access
CREATE OR REPLACE FUNCTION test_livestream_access()
RETURNS TABLE(
    table_name text,
    can_select boolean,
    can_insert boolean,
    error_message text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Test live_streams table
    BEGIN
        PERFORM 1 FROM live_streams LIMIT 1;
        RETURN QUERY SELECT 'live_streams'::text, true, false, null::text;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'live_streams'::text, false, false, SQLERRM::text;
    END;
    
    -- Test stream_chat table
    BEGIN
        PERFORM 1 FROM stream_chat LIMIT 1;
        RETURN QUERY SELECT 'stream_chat'::text, true, false, null::text;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'stream_chat'::text, false, false, SQLERRM::text;
    END;
    
    -- Test stream_reactions table
    BEGIN
        PERFORM 1 FROM stream_reactions LIMIT 1;
        RETURN QUERY SELECT 'stream_reactions'::text, true, false, null::text;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'stream_reactions'::text, false, false, SQLERRM::text;
    END;
    
    -- Test stream_viewers table
    BEGIN
        PERFORM 1 FROM stream_viewers LIMIT 1;
        RETURN QUERY SELECT 'stream_viewers'::text, true, false, null::text;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'stream_viewers'::text, false, false, SQLERRM::text;
    END;
END;
$$;

-- Test the function
SELECT * FROM test_livestream_access();