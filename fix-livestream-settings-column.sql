-- Fix Live Streams Settings Column Issue
-- This script ensures the settings column exists and refreshes the schema cache

-- First, check if the settings column exists and add it if missing
DO $$ 
BEGIN
    -- Check if the settings column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'live_streams' 
        AND column_name = 'settings'
        AND table_schema = 'public'
    ) THEN
        -- Add the settings column if it doesn't exist
        ALTER TABLE live_streams ADD COLUMN settings JSONB DEFAULT '{"qa_mode": false, "polls_enabled": true, "reactions_enabled": true, "chat_moderation": false}';
        RAISE NOTICE 'Added settings column to live_streams table';
    ELSE
        RAISE NOTICE 'Settings column already exists in live_streams table';
    END IF;
END $$;

-- Ensure all existing live_streams have proper settings values
UPDATE live_streams 
SET settings = '{"qa_mode": false, "polls_enabled": true, "reactions_enabled": true, "chat_moderation": false}'::jsonb
WHERE settings IS NULL OR settings = '{}'::jsonb;

-- Verify the column exists and has proper data
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'live_streams' 
AND column_name = 'settings'
AND table_schema = 'public';

-- Show a sample of the settings column to verify it's working
SELECT 
    id, 
    title, 
    settings,
    created_at
FROM live_streams 
ORDER BY created_at DESC 
LIMIT 5;

-- Refresh the schema cache by updating the updated_at timestamp
-- This helps ensure the schema changes are properly recognized
UPDATE live_streams SET updated_at = NOW() WHERE id IN (
    SELECT id FROM live_streams LIMIT 1
);

RAISE NOTICE 'Live streams settings column fix completed successfully';