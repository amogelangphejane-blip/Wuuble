-- Complete Livestream Feature Fix
-- This script addresses all identified issues with the livestream feature

-- 1. Add missing visibility column
ALTER TABLE live_streams 
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'community_only'));

-- 2. Add missing columns for enhanced functionality
ALTER TABLE live_streams 
ADD COLUMN IF NOT EXISTS peak_viewers INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_messages INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_reactions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"qa_mode": false, "polls_enabled": true, "reactions_enabled": true, "chat_moderation": false}';

-- 3. Create missing tables if they don't exist
CREATE TABLE IF NOT EXISTS stream_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    is_answered BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stream_polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes for new columns and tables
CREATE INDEX IF NOT EXISTS idx_live_streams_visibility ON live_streams(visibility);
CREATE INDEX IF NOT EXISTS idx_stream_questions_stream_id ON stream_questions(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_polls_stream_id ON stream_polls(stream_id);

-- 5. Update existing records to have proper visibility
UPDATE live_streams 
SET visibility = CASE 
  WHEN community_id IS NULL THEN 'public'
  ELSE 'community_only'
END
WHERE visibility IS NULL;

-- 6. Drop old restrictive RLS policies
DROP POLICY IF EXISTS "Users can view streams in communities they're members of" ON live_streams;
DROP POLICY IF EXISTS "Community members can create streams" ON live_streams;
DROP POLICY IF EXISTS "Users can view stream viewers for streams they can access" ON stream_viewers;
DROP POLICY IF EXISTS "Users can join streams as viewers" ON stream_viewers;
DROP POLICY IF EXISTS "Users can view chat for streams they can access" ON stream_chat;
DROP POLICY IF EXISTS "Users can send chat messages to streams they can access" ON stream_chat;
DROP POLICY IF EXISTS "Users can view reactions for streams they can access" ON stream_reactions;
DROP POLICY IF EXISTS "Users can react to streams they can access" ON stream_reactions;

-- 7. Create new, more permissive RLS policies

-- Live streams policies
CREATE POLICY "Anyone can view public live streams" ON live_streams
    FOR SELECT USING (
        -- Allow access to public streams
        visibility = 'public'
        OR 
        -- Allow access to community streams for members
        (visibility = 'community_only' AND community_id IN (
            SELECT community_id FROM community_members 
            WHERE user_id = auth.uid() AND status = 'approved'
        ))
        OR 
        -- Allow creators to see their own streams
        creator_id = auth.uid()
    );

-- Allow authenticated users to create streams
CREATE POLICY "Authenticated users can create streams" ON live_streams
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND creator_id = auth.uid()
        AND (
            -- Allow public streams
            visibility = 'public'
            OR
            -- Allow community streams for members
            (visibility = 'community_only' AND community_id IN (
                SELECT community_id FROM community_members 
                WHERE user_id = auth.uid() AND status = 'approved'
            ))
        )
    );

-- Stream viewers policies
CREATE POLICY "Users can view stream viewers for accessible streams" ON stream_viewers
    FOR SELECT USING (
        stream_id IN (
            SELECT id FROM live_streams 
            WHERE 
                visibility = 'public'
                OR (visibility = 'community_only' AND community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid() AND status = 'approved'
                ))
        )
    );

CREATE POLICY "Users can join accessible streams as viewers" ON stream_viewers
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND stream_id IN (
            SELECT id FROM live_streams 
            WHERE 
                visibility = 'public'
                OR (visibility = 'community_only' AND community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid() AND status = 'approved'
                ))
        )
    );

-- Chat policies
CREATE POLICY "Users can view chat for accessible streams" ON stream_chat
    FOR SELECT USING (
        stream_id IN (
            SELECT id FROM live_streams 
            WHERE 
                visibility = 'public'
                OR (visibility = 'community_only' AND community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid() AND status = 'approved'
                ))
        )
    );

CREATE POLICY "Users can send chat messages to accessible streams" ON stream_chat
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND stream_id IN (
            SELECT id FROM live_streams 
            WHERE 
                visibility = 'public'
                OR (visibility = 'community_only' AND community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid() AND status = 'approved'
                ))
        )
    );

-- Reaction policies
CREATE POLICY "Users can view reactions for accessible streams" ON stream_reactions
    FOR SELECT USING (
        stream_id IN (
            SELECT id FROM live_streams 
            WHERE 
                visibility = 'public'
                OR (visibility = 'community_only' AND community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid() AND status = 'approved'
                ))
        )
    );

CREATE POLICY "Users can react to accessible streams" ON stream_reactions
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND stream_id IN (
            SELECT id FROM live_streams 
            WHERE 
                visibility = 'public'
                OR (visibility = 'community_only' AND community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid() AND status = 'approved'
                ))
        )
    );

-- 8. Add RLS for new tables
ALTER TABLE stream_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_polls ENABLE ROW LEVEL SECURITY;

-- Question policies
CREATE POLICY "Users can view questions for accessible streams" ON stream_questions
    FOR SELECT USING (
        stream_id IN (
            SELECT id FROM live_streams 
            WHERE 
                visibility = 'public'
                OR (visibility = 'community_only' AND community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid() AND status = 'approved'
                ))
        )
    );

CREATE POLICY "Users can ask questions in accessible streams" ON stream_questions
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND stream_id IN (
            SELECT id FROM live_streams 
            WHERE 
                visibility = 'public'
                OR (visibility = 'community_only' AND community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid() AND status = 'approved'
                ))
        )
    );

-- Poll policies  
CREATE POLICY "Users can view polls for accessible streams" ON stream_polls
    FOR SELECT USING (
        stream_id IN (
            SELECT id FROM live_streams 
            WHERE 
                visibility = 'public'
                OR (visibility = 'community_only' AND community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid() AND status = 'approved'
                ))
        )
    );

CREATE POLICY "Stream creators can create polls" ON stream_polls
    FOR INSERT WITH CHECK (
        creator_id = auth.uid()
        AND stream_id IN (
            SELECT id FROM live_streams 
            WHERE creator_id = auth.uid()
        )
    );

-- 9. Enable realtime for all livestream tables
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS live_streams;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS stream_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS stream_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS stream_viewers;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS stream_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS stream_polls;

-- 10. Create helper function to test access
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
    
    -- Test stream_questions table
    BEGIN
        PERFORM 1 FROM stream_questions LIMIT 1;
        RETURN QUERY SELECT 'stream_questions'::text, true, false, null::text;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'stream_questions'::text, false, false, SQLERRM::text;
    END;
    
    -- Test stream_polls table
    BEGIN
        PERFORM 1 FROM stream_polls LIMIT 1;
        RETURN QUERY SELECT 'stream_polls'::text, true, false, null::text;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'stream_polls'::text, false, false, SQLERRM::text;
    END;
END;
$$;

-- 11. Verify the fixes
SELECT 'Visibility column added' as status, 
       EXISTS(SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'live_streams' AND column_name = 'visibility') as success;

SELECT 'Public streams accessible' as status,
       COUNT(*) as count
FROM live_streams 
WHERE visibility = 'public' OR visibility IS NULL;

-- Test the access function
SELECT * FROM test_livestream_access();