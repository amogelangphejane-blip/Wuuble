import React, { useState } from 'react';
import { SimpleCalendar } from './SimpleCalendar';
import { SimpleEventForm, EventFormData } from './SimpleEventForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SkoolCalendarProps {
  communityId: string;
}

export const SkoolCalendar: React.FC<SkoolCalendarProps> = ({ communityId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showEventForm, setShowEventForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleCreateEvent = async (eventData: EventFormData) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create events.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('community_events')
        .insert({
          community_id: communityId,
          created_by: user.id,
          title: eventData.title,
          description: eventData.description || null,
          event_date: eventData.eventDate,
          start_time: eventData.startTime || null,
          end_time: eventData.endTime || null,
          location: eventData.location || null,
          is_virtual: eventData.isVirtual,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Event created!",
        description: "Your event has been added to the calendar.",
      });
      
      // The SimpleCalendar will refresh automatically via its useEffect
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <SimpleCalendar 
        communityId={communityId} 
        onCreateEvent={() => setShowEventForm(true)}
      />
      
      <SimpleEventForm
        isOpen={showEventForm}
        onClose={() => setShowEventForm(false)}
        onSubmit={handleCreateEvent}
        selectedDate={selectedDate}
        loading={loading}
      />
    </div>
  );
};