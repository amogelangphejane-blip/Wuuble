-- Run this SQL in your Supabase SQL Editor to fix the community creation issue
-- This adds the missing columns that the frontend expects

-- Add category column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'communities' AND column_name = 'category') THEN
        ALTER TABLE public.communities ADD COLUMN category TEXT;
        CREATE INDEX idx_communities_category ON public.communities(category);
    END IF;
END $$;

-- Add tags column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'communities' AND column_name = 'tags') THEN
        ALTER TABLE public.communities ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;
        CREATE INDEX idx_communities_tags ON public.communities USING GIN(tags);
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'communities' 
ORDER BY ordinal_position;