-- Events Feature Troubleshooting and Fix
-- Run this SQL in your Supabase SQL Editor to ensure all tables and columns exist

-- Check if community_events table exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_events') THEN
        -- Create community_events table
        CREATE TABLE public.community_events (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
          user_id UUID NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          event_date DATE NOT NULL,
          start_time TIME,
          end_time TIME,
          location VARCHAR(255),
          is_virtual BOOLEAN DEFAULT false,
          max_attendees INTEGER,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );

        -- Enable RLS
        ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Add enhanced columns if they don't exist
DO $$ 
BEGIN
    -- Add category_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'community_events' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE public.community_events ADD COLUMN category_id UUID;
    END IF;

    -- Add recurring_type column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'community_events' AND column_name = 'recurring_type'
    ) THEN
        ALTER TABLE public.community_events 
        ADD COLUMN recurring_type VARCHAR(20) CHECK (recurring_type IN ('none', 'daily', 'weekly', 'monthly', 'yearly')) DEFAULT 'none';
    END IF;

    -- Add recurring_end_date column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'community_events' AND column_name = 'recurring_end_date'
    ) THEN
        ALTER TABLE public.community_events ADD COLUMN recurring_end_date DATE;
    END IF;

    -- Add tags column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'community_events' AND column_name = 'tags'
    ) THEN
        ALTER TABLE public.community_events ADD COLUMN tags TEXT[];
    END IF;

    -- Add visibility column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'community_events' AND column_name = 'visibility'
    ) THEN
        ALTER TABLE public.community_events 
        ADD COLUMN visibility VARCHAR(20) CHECK (visibility IN ('public', 'members_only', 'private')) DEFAULT 'members_only';
    END IF;

    -- Add requires_approval column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'community_events' AND column_name = 'requires_approval'
    ) THEN
        ALTER TABLE public.community_events ADD COLUMN requires_approval BOOLEAN DEFAULT false;
    END IF;

    -- Add external_url column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'community_events' AND column_name = 'external_url'
    ) THEN
        ALTER TABLE public.community_events ADD COLUMN external_url VARCHAR(500);
    END IF;

    -- Add cover_image_url column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'community_events' AND column_name = 'cover_image_url'
    ) THEN
        ALTER TABLE public.community_events ADD COLUMN cover_image_url VARCHAR(500);
    END IF;

    -- Add timezone column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'community_events' AND column_name = 'timezone'
    ) THEN
        ALTER TABLE public.community_events ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';
    END IF;
END $$;

-- Create event_categories table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_categories') THEN
        CREATE TABLE public.event_categories (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
          icon VARCHAR(50),
          community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
          is_default BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );

        -- Enable RLS
        ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;

        -- Add some default categories
        INSERT INTO public.event_categories (name, color, icon, is_default) VALUES
        ('Meeting', '#3B82F6', 'Users', true),
        ('Workshop', '#8B5CF6', 'GraduationCap', true),
        ('Social', '#EC4899', 'Heart', true),
        ('Webinar', '#10B981', 'Video', true),
        ('Conference', '#F59E0B', 'Briefcase', true);
    END IF;
END $$;

-- Create event_rsvps table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_rsvps') THEN
        CREATE TABLE public.event_rsvps (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          event_id UUID NOT NULL REFERENCES public.community_events(id) ON DELETE CASCADE,
          user_id UUID NOT NULL,
          status VARCHAR(20) NOT NULL CHECK (status IN ('going', 'maybe', 'not_going', 'waitlist')) DEFAULT 'going',
          response_note TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          UNIQUE(event_id, user_id)
        );

        -- Enable RLS
        ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create or update RLS policies for community_events
DROP POLICY IF EXISTS "Users can view events in accessible communities" ON public.community_events;
CREATE POLICY "Users can view events in accessible communities" 
ON public.community_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.communities c 
    WHERE c.id = community_events.community_id 
    AND (
      NOT c.is_private 
      OR c.creator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.community_members cm 
        WHERE cm.community_id = c.id AND cm.user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "Users can create events in communities they belong to" ON public.community_events;
CREATE POLICY "Users can create events in communities they belong to" 
ON public.community_events 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.communities c 
    WHERE c.id = community_events.community_id 
    AND (
      c.creator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.community_members cm 
        WHERE cm.community_id = c.id AND cm.user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "Users can update their own events" ON public.community_events;
CREATE POLICY "Users can update their own events" 
ON public.community_events 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own events" ON public.community_events;
CREATE POLICY "Users can delete their own events" 
ON public.community_events 
FOR DELETE 
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.communities c 
    WHERE c.id = community_events.community_id 
    AND c.creator_id = auth.uid()
  )
);

-- RLS policies for event_categories
DROP POLICY IF EXISTS "Anyone can view event categories" ON public.event_categories;
CREATE POLICY "Anyone can view event categories" 
ON public.event_categories 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Community owners can create categories" ON public.event_categories;
CREATE POLICY "Community owners can create categories" 
ON public.event_categories 
FOR INSERT 
WITH CHECK (
  community_id IS NULL -- Global categories
  OR EXISTS (
    SELECT 1 FROM public.communities c 
    WHERE c.id = event_categories.community_id 
    AND c.creator_id = auth.uid()
  )
);

-- RLS policies for event_rsvps
DROP POLICY IF EXISTS "Users can view RSVPs for events they can see" ON public.event_rsvps;
CREATE POLICY "Users can view RSVPs for events they can see" 
ON public.event_rsvps 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.community_events ce
    JOIN public.communities c ON c.id = ce.community_id
    WHERE ce.id = event_rsvps.event_id
    AND (
      NOT c.is_private 
      OR c.creator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.community_members cm 
        WHERE cm.community_id = c.id AND cm.user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "Users can create their own RSVPs" ON public.event_rsvps;
CREATE POLICY "Users can create their own RSVPs" 
ON public.event_rsvps 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own RSVPs" ON public.event_rsvps;
CREATE POLICY "Users can update their own RSVPs" 
ON public.event_rsvps 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own RSVPs" ON public.event_rsvps;
CREATE POLICY "Users can delete their own RSVPs" 
ON public.event_rsvps 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_events_community_id ON public.community_events(community_id);
CREATE INDEX IF NOT EXISTS idx_community_events_event_date ON public.community_events(event_date);
CREATE INDEX IF NOT EXISTS idx_community_events_user_id ON public.community_events(user_id);
CREATE INDEX IF NOT EXISTS idx_community_events_category_id ON public.community_events(category_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON public.event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON public.event_rsvps(user_id);

-- Verify the setup
SELECT 
    'community_events' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'community_events'
UNION ALL
SELECT 
    'event_categories' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'event_categories'
UNION ALL
SELECT 
    'event_rsvps' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'event_rsvps';
