# Fix Livestream Access Denied Issue

## Problem
You're getting "Access denied you may need to be a member of the community to create streams" because the current Row Level Security (RLS) policies require community membership for all stream operations.

## Solution
Apply the following SQL script in your Supabase dashboard to allow personal streams (streams without community association).

## Steps to Fix

### 1. Open Supabase Dashboard
- Go to https://supabase.com/dashboard
- Select your project: `tgmflbglhmnrliredlbn`
- Navigate to the "SQL Editor" tab

### 2. Run the Policy Fix Script
Copy and paste the following SQL script in the SQL Editor and click "Run":

```sql
-- Fix Livestream RLS Policies for Better Public Access
-- This allows users to create personal streams without community membership

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view streams in communities they're members of" ON live_streams;
DROP POLICY IF EXISTS "Users can create streams in communities they're members of" ON live_streams;
DROP POLICY IF EXISTS "Community members can create streams" ON live_streams;

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
```

### 3. Verify the Fix
After running the SQL script, test the livestream functionality:

1. Go to your application
2. Navigate to the livestream page (`/azar-livestreams`)
3. Click "Go Live" 
4. Try creating a personal stream (without selecting a community)

## What This Fix Does

✅ **Allows Personal Streams**: Users can now create streams without being part of any community
✅ **Maintains Community Security**: Community-specific streams still require membership
✅ **Enables Public Discovery**: Anyone can view public streams
✅ **Preserves Privacy**: Private community streams remain restricted
✅ **Fixes Chat & Reactions**: All interactive features work with the new policies

## Alternative: Use the Existing Script

You can also run the existing script that's already in your project:

```bash
# In your Supabase SQL Editor, paste the contents of:
cat fix-livestream-policies.sql
```

This script contains the same fixes and additional testing functions.