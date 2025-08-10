-- Create community_events table for events within communities
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