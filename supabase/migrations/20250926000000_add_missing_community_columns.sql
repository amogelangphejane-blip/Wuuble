-- Add missing columns to communities table that are used in the frontend

-- Add category column
ALTER TABLE public.communities 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add tags column as JSON array
ALTER TABLE public.communities 
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Create index on category for better performance
CREATE INDEX IF NOT EXISTS idx_communities_category ON public.communities(category);

-- Create index on tags for better performance
CREATE INDEX IF NOT EXISTS idx_communities_tags ON public.communities USING GIN(tags);

-- Update existing RLS policies to work with new columns (if needed)
-- The existing policies should already work fine with these additions