-- SIMPLIFIED Events Migration Script
-- Run this in your Supabase SQL Editor

-- Step 1: Create the update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create community_events table
CREATE TABLE IF NOT EXISTS public.community_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
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

-- Step 3: Create event_categories table
CREATE TABLE IF NOT EXISTS public.event_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
  icon VARCHAR(50),
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 4: Add enhanced columns to community_events
ALTER TABLE public.community_events 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.event_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS recurring_type VARCHAR(20) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS recurring_end_date DATE,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'members_only',
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS external_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';

-- Step 5: Add constraints for enhanced columns
ALTER TABLE public.community_events 
ADD CONSTRAINT IF NOT EXISTS chk_recurring_type 
CHECK (recurring_type IN ('none', 'daily', 'weekly', 'monthly', 'yearly'));

ALTER TABLE public.community_events 
ADD CONSTRAINT IF NOT EXISTS chk_visibility 
CHECK (visibility IN ('public', 'members_only', 'private'));

-- Step 6: Create event_rsvps table
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.community_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'going',
  response_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_rsvps 
ADD CONSTRAINT IF NOT EXISTS chk_rsvp_status 
CHECK (status IN ('going', 'maybe', 'not_going', 'waitlist'));

-- Step 7: Create event_notifications table
CREATE TABLE IF NOT EXISTS public.event_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.community_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  notification_type VARCHAR(30) NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  message TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.event_notifications 
ADD CONSTRAINT IF NOT EXISTS chk_notification_type 
CHECK (notification_type IN ('reminder', 'update', 'cancellation', 'rsvp_change'));

-- Step 8: Create user_event_preferences table
CREATE TABLE IF NOT EXISTS public.user_event_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  default_reminder_time INTEGER DEFAULT 60,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  preferred_categories UUID[],
  auto_rsvp_own_events BOOLEAN DEFAULT true,
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 9: Create event_shares table
CREATE TABLE IF NOT EXISTS public.event_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.community_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 10: Enable Row Level Security
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_event_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_shares ENABLE ROW LEVEL SECURITY;

-- Step 11: Create RLS Policies

-- Policies for community_events
DROP POLICY IF EXISTS "Users can view events in accessible communities" ON public.community_events;
CREATE POLICY "Users can view events in accessible communities" 
ON public.community_events FOR SELECT 
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
ON public.community_events FOR INSERT 
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
ON public.community_events FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own events or community admins can delete events" ON public.community_events;
CREATE POLICY "Users can delete their own events or community admins can delete events" 
ON public.community_events FOR DELETE 
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.communities c 
    WHERE c.id = community_events.community_id 
    AND c.creator_id = auth.uid()
  )
);

-- Policies for event_categories
DROP POLICY IF EXISTS "Users can view categories in accessible communities" ON public.event_categories;
CREATE POLICY "Users can view categories in accessible communities" 
ON public.event_categories FOR SELECT 
USING (
  community_id IS NULL OR
  EXISTS (
    SELECT 1 FROM public.communities c 
    WHERE c.id = event_categories.community_id 
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

DROP POLICY IF EXISTS "Community admins can manage categories" ON public.event_categories;
CREATE POLICY "Community admins can manage categories" 
ON public.event_categories FOR ALL 
USING (
  community_id IS NULL OR
  EXISTS (
    SELECT 1 FROM public.communities c 
    WHERE c.id = event_categories.community_id 
    AND c.creator_id = auth.uid()
  )
);

-- Policies for event_rsvps
DROP POLICY IF EXISTS "Users can view RSVPs for accessible events" ON public.event_rsvps;
CREATE POLICY "Users can view RSVPs for accessible events" 
ON public.event_rsvps FOR SELECT 
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

DROP POLICY IF EXISTS "Users can manage their own RSVPs" ON public.event_rsvps;
CREATE POLICY "Users can manage their own RSVPs" 
ON public.event_rsvps FOR ALL 
USING (auth.uid() = user_id);

-- Policies for event_notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.event_notifications;
CREATE POLICY "Users can view their own notifications" 
ON public.event_notifications FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON public.event_notifications;
CREATE POLICY "System can create notifications" 
ON public.event_notifications FOR INSERT 
WITH CHECK (true);

-- Policies for user_event_preferences
DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_event_preferences;
CREATE POLICY "Users can manage their own preferences" 
ON public.user_event_preferences FOR ALL 
USING (auth.uid() = user_id);

-- Policies for event_shares
DROP POLICY IF EXISTS "Users can view shares for accessible events" ON public.event_shares;
CREATE POLICY "Users can view shares for accessible events" 
ON public.event_shares FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.community_events ce
    JOIN public.communities c ON c.id = ce.community_id
    WHERE ce.id = event_shares.event_id 
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

DROP POLICY IF EXISTS "Users can create shares for accessible events" ON public.event_shares;
CREATE POLICY "Users can create shares for accessible events" 
ON public.event_shares FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.community_events ce
    JOIN public.communities c ON c.id = ce.community_id
    WHERE ce.id = event_shares.event_id 
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

-- Step 12: Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_community_events_updated_at ON public.community_events;
CREATE TRIGGER update_community_events_updated_at
BEFORE UPDATE ON public.community_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_categories_updated_at ON public.event_categories;
CREATE TRIGGER update_event_categories_updated_at
BEFORE UPDATE ON public.event_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_rsvps_updated_at ON public.event_rsvps;
CREATE TRIGGER update_event_rsvps_updated_at
BEFORE UPDATE ON public.event_rsvps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_event_preferences_updated_at ON public.user_event_preferences;
CREATE TRIGGER update_user_event_preferences_updated_at
BEFORE UPDATE ON public.user_event_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Step 13: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_events_community_id ON public.community_events(community_id);
CREATE INDEX IF NOT EXISTS idx_community_events_event_date ON public.community_events(event_date);
CREATE INDEX IF NOT EXISTS idx_community_events_user_id ON public.community_events(user_id);
CREATE INDEX IF NOT EXISTS idx_community_events_category_id ON public.community_events(category_id);
CREATE INDEX IF NOT EXISTS idx_event_categories_community_id ON public.event_categories(community_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON public.event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON public.event_rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_event_notifications_user_id ON public.event_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_event_shares_event_id ON public.event_shares(event_id);

-- Step 14: Function to create default user preferences
CREATE OR REPLACE FUNCTION create_default_user_event_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_event_preferences (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 15: Create trigger for auto-creating user preferences
DROP TRIGGER IF EXISTS create_user_event_preferences_trigger ON public.profiles;
CREATE TRIGGER create_user_event_preferences_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION create_default_user_event_preferences();

-- Step 16: Insert default event categories
INSERT INTO public.event_categories (name, color, icon, community_id, is_default) 
SELECT * FROM (VALUES
  ('General', '#3B82F6', 'Calendar', NULL, true),
  ('Meeting', '#10B981', 'Users', NULL, true),
  ('Workshop', '#8B5CF6', 'BookOpen', NULL, true),
  ('Social', '#F59E0B', 'Coffee', NULL, true),
  ('Sports', '#EF4444', 'Trophy', NULL, true),
  ('Entertainment', '#EC4899', 'Music', NULL, true),
  ('Education', '#6366F1', 'GraduationCap', NULL, true),
  ('Business', '#374151', 'Briefcase', NULL, true)
) AS v(name, color, icon, community_id, is_default)
WHERE NOT EXISTS (SELECT 1 FROM public.event_categories WHERE is_default = true);

-- Step 17: Success message
SELECT 'Events migration completed successfully! All tables, policies, and default data have been created.' AS result;