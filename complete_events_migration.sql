-- Complete Events Feature Migration
-- This migration creates all tables and features needed for the events functionality
-- Apply this entire script to your Supabase database via the SQL Editor

-- First, create community_events table for events within communities
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
  cover_image_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;

-- Create policies for community events
CREATE POLICY "Users can view events in accessible communities" 
ON public.community_events 
FOR SELECT 
USING (
  -- Can view if community is public OR user is member OR user created community
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

CREATE POLICY "Users can update their own events" 
ON public.community_events 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events or community admins can delete events" 
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

-- Add foreign key constraint to profiles
ALTER TABLE public.community_events 
ADD CONSTRAINT community_events_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_community_events_updated_at
BEFORE UPDATE ON public.community_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for community events
ALTER TABLE public.community_events REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.community_events;

-- Create indexes for better performance
CREATE INDEX idx_community_events_community_id ON public.community_events(community_id);
CREATE INDEX idx_community_events_event_date ON public.community_events(event_date);
CREATE INDEX idx_community_events_user_id ON public.community_events(user_id);

-- Create event categories table
CREATE TABLE public.event_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#3B82F6', -- Hex color code
  icon VARCHAR(50), -- Lucide icon name
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add category support to events
ALTER TABLE public.community_events 
ADD COLUMN category_id UUID REFERENCES public.event_categories(id) ON DELETE SET NULL,
ADD COLUMN recurring_type VARCHAR(20) CHECK (recurring_type IN ('none', 'daily', 'weekly', 'monthly', 'yearly')) DEFAULT 'none',
ADD COLUMN recurring_end_date DATE,
ADD COLUMN tags TEXT[], -- Array of tags for better categorization
ADD COLUMN visibility VARCHAR(20) CHECK (visibility IN ('public', 'members_only', 'private')) DEFAULT 'members_only',
ADD COLUMN requires_approval BOOLEAN DEFAULT false,
ADD COLUMN external_url VARCHAR(500), -- For virtual events or external links
ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';

-- Create event RSVPs table
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

-- Create event notifications table
CREATE TABLE public.event_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.community_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  notification_type VARCHAR(30) NOT NULL CHECK (notification_type IN ('reminder', 'update', 'cancellation', 'rsvp_change')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  message TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user event preferences table
CREATE TABLE public.user_event_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  default_reminder_time INTEGER DEFAULT 60, -- Minutes before event
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  preferred_categories UUID[], -- Array of preferred category IDs
  auto_rsvp_own_events BOOLEAN DEFAULT true,
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event shares table for social sharing tracking
CREATE TABLE public.event_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.community_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform VARCHAR(50) NOT NULL, -- 'facebook', 'twitter', 'linkedin', 'email', 'copy_link'
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all new tables
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_event_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_shares ENABLE ROW LEVEL SECURITY;

-- Policies for event_categories
CREATE POLICY "Users can view categories in accessible communities" 
ON public.event_categories 
FOR SELECT 
USING (
  community_id IS NULL OR -- Default categories
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

CREATE POLICY "Community admins can manage categories" 
ON public.event_categories 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.communities c 
    WHERE c.id = event_categories.community_id 
    AND c.creator_id = auth.uid()
  )
);

-- Policies for event_rsvps
CREATE POLICY "Users can view RSVPs for accessible events" 
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

CREATE POLICY "Users can manage their own RSVPs" 
ON public.event_rsvps 
FOR ALL 
USING (auth.uid() = user_id);

-- Policies for event_notifications
CREATE POLICY "Users can view their own notifications" 
ON public.event_notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.event_notifications 
FOR INSERT 
WITH CHECK (true); -- Allow system to create notifications

-- Policies for user_event_preferences
CREATE POLICY "Users can manage their own preferences" 
ON public.user_event_preferences 
FOR ALL 
USING (auth.uid() = user_id);

-- Policies for event_shares
CREATE POLICY "Users can view shares for accessible events" 
ON public.event_shares 
FOR SELECT 
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

CREATE POLICY "Users can create shares for accessible events" 
ON public.event_shares 
FOR INSERT 
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

-- Insert default event categories
INSERT INTO public.event_categories (name, color, icon, community_id, is_default) VALUES
('General', '#3B82F6', 'Calendar', NULL, true),
('Meeting', '#10B981', 'Users', NULL, true),
('Workshop', '#8B5CF6', 'BookOpen', NULL, true),
('Social', '#F59E0B', 'Coffee', NULL, true),
('Sports', '#EF4444', 'Trophy', NULL, true),
('Entertainment', '#EC4899', 'Music', NULL, true),
('Education', '#6366F1', 'GraduationCap', NULL, true),
('Business', '#374151', 'Briefcase', NULL, true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_event_categories_updated_at
BEFORE UPDATE ON public.event_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_rsvps_updated_at
BEFORE UPDATE ON public.event_rsvps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_event_preferences_updated_at
BEFORE UPDATE ON public.user_event_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for new tables
ALTER TABLE public.event_categories REPLICA IDENTITY FULL;
ALTER TABLE public.event_rsvps REPLICA IDENTITY FULL;
ALTER TABLE public.event_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.user_event_preferences REPLICA IDENTITY FULL;
ALTER TABLE public.event_shares REPLICA IDENTITY FULL;

ALTER publication supabase_realtime ADD TABLE public.event_categories;
ALTER publication supabase_realtime ADD TABLE public.event_rsvps;
ALTER publication supabase_realtime ADD TABLE public.event_notifications;
ALTER publication supabase_realtime ADD TABLE public.user_event_preferences;
ALTER publication supabase_realtime ADD TABLE public.event_shares;

-- Create indexes for better performance
CREATE INDEX idx_event_categories_community_id ON public.event_categories(community_id);
CREATE INDEX idx_event_rsvps_event_id ON public.event_rsvps(event_id);
CREATE INDEX idx_event_rsvps_user_id ON public.event_rsvps(user_id);
CREATE INDEX idx_event_notifications_user_id ON public.event_notifications(user_id);
CREATE INDEX idx_event_notifications_scheduled_for ON public.event_notifications(scheduled_for);
CREATE INDEX idx_event_shares_event_id ON public.event_shares(event_id);
CREATE INDEX idx_community_events_category_id ON public.community_events(category_id);
CREATE INDEX idx_community_events_tags ON public.community_events USING GIN(tags);

-- Function to automatically create user preferences when a user is created
CREATE OR REPLACE FUNCTION create_default_user_event_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_event_preferences (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create preferences (assuming profiles table exists)
CREATE TRIGGER create_user_event_preferences_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION create_default_user_event_preferences();

-- Add comment for documentation
COMMENT ON COLUMN public.community_events.cover_image_url IS 'URL for event cover image to make events more visually appealing';

-- Migration completed successfully
-- All events functionality should now be available