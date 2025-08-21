-- Add missing visibility column to live_streams table
-- This column is required for the livestream feature to work properly

-- Add the visibility column with default value
ALTER TABLE live_streams 
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'community_only'));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_live_streams_visibility ON live_streams(visibility);

-- Update existing records to have proper visibility
UPDATE live_streams 
SET visibility = CASE 
  WHEN community_id IS NULL THEN 'public'
  ELSE 'community_only'
END
WHERE visibility IS NULL;

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'live_streams' AND column_name = 'visibility';