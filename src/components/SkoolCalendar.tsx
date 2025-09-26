import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Video, MapPin, Users, Plus, CalendarDays } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface Event {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  location?: string;
  is_online: boolean;
  attendee_count?: number;
  host_id: string;
  host_name?: string;
}

interface SkoolCalendarProps {
  communityId: string;
}

export const SkoolCalendar: React.FC<SkoolCalendarProps> = ({ communityId }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [communityId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('community_events')
        .select(`
          *,
          profiles:created_by (
            username
          )
        `)
        .eq('community_id', communityId)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        return;
      }

      const transformedEvents: Event[] = (data || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        start_time: event.start_time,
        end_time: event.end_time,
        location: event.location,
        is_online: event.is_online || !event.location,
        attendee_count: event.attendee_count || 0,
        host_id: event.created_by,
        host_name: event.profiles?.username || 'Community Host'
      }));

      setEvents(transformedEvents);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-gray-500 text-sm mt-1">Upcoming events and workshops</p>
        </div>
        <Button className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : events.length === 0 ? (
        <Card className="p-8 text-center">
          <CalendarDays className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
          <p className="text-gray-500 mb-4">There are no scheduled events in this community yet.</p>
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Schedule First Event
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-all cursor-pointer">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={event.is_online ? "default" : "secondary"}>
                        {event.is_online ? (
                          <>
                            <Video className="w-3 h-3 mr-1" />
                            Online
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3 h-3 mr-1" />
                            In-Person
                          </>
                        )}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
                    {event.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(event.start_time), 'MMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {format(new Date(event.start_time), 'h:mm a')}
                        {event.end_time && ` - ${format(new Date(event.end_time), 'h:mm a')}`}
                      </div>
                      {event.attendee_count > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {event.attendee_count} attending
                        </div>
                      )}
                    </div>
                    {event.location && !event.is_online && (
                      <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Hosted by {event.host_name}
                    </p>
                  </div>
                  <Button size="sm">RSVP</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};