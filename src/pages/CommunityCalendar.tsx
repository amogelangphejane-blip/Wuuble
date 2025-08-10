import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Calendar, Plus, Clock, MapPin } from 'lucide-react';
import { EventForm } from '@/components/EventForm';
import { format, parseISO } from 'date-fns';

interface Community {
  id: string;
  name: string;
  description: string;
  avatar_url?: string | null;
  is_private: boolean;
  member_count: number;
  creator_id: string;
  created_at: string;
}

interface CommunityEvent {
  id: string;
  community_id: string;
  user_id: string;
  title: string;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  is_virtual: boolean;
  max_attendees?: number;
  created_at: string;
  updated_at: string;
}

const CommunityCalendar = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) {
      fetchCommunityDetails();
      fetchEvents();
    }
  }, [user, id]);

  const fetchCommunityDetails = async () => {
    if (!id) return;

    try {
      const { data: communityData, error } = await supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        navigate('/communities');
        return;
      }

      setCommunity(communityData);
    } catch (error) {
      console.error('Error fetching community details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    if (!id) return;

    try {
      setEventsLoading(true);
      const { data: eventsData, error } = await supabase
        .from('community_events')
        .select('*')
        .eq('community_id', id)
        .order('event_date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        return;
      }

      setEvents(eventsData || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleCreateEvent = async (eventData: any) => {
    if (!id || !user) return;

    try {
      setEventsLoading(true);
      const { error } = await supabase
        .from('community_events')
        .insert({
          community_id: id,
          user_id: user.id,
          title: eventData.title,
          description: eventData.description,
          event_date: format(eventData.eventDate, 'yyyy-MM-dd'),
          start_time: eventData.startTime,
          end_time: eventData.endTime,
          location: eventData.location,
          is_virtual: eventData.isVirtual,
          max_attendees: eventData.maxAttendees,
        });

      if (error) {
        console.error('Error creating event:', error);
        return;
      }

      // Refresh events list
      await fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading calendar...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Community not found</h3>
            <Button onClick={() => navigate('/communities')}>
              Back to Communities
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/communities/${id}`)}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to {community.name}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowEventForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          </div>
          <p className="text-gray-600">
            Stay up to date with all {community.name} events and activities.
          </p>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Events */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No events scheduled yet.</p>
                        <p className="text-sm">Create your first event to get started!</p>
                      </div>
                    ) : (
                      events
                        .filter(event => {
                          if (!selectedDate) return true;
                          return format(parseISO(event.event_date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                        })
                        .map((event, index) => {
                          const borderColors = ['border-blue-500', 'border-green-500', 'border-purple-500', 'border-orange-500', 'border-pink-500'];
                          const borderColor = borderColors[index % borderColors.length];
                          
                          return (
                            <div key={event.id} className={`border-l-4 ${borderColor} pl-4 py-3`}>
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold text-gray-900">{event.title}</h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      <span>
                                        {format(parseISO(event.event_date), 'MMM d, yyyy')}
                                        {event.start_time && `, ${event.start_time}`}
                                        {event.end_time && ` - ${event.end_time}`}
                                      </span>
                                    </div>
                                    {event.location && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        <span>{event.is_virtual ? 'Virtual' : event.location}</span>
                                      </div>
                                    )}
                                  </div>
                                  {event.description && (
                                    <p className="text-sm text-gray-600 mt-2">
                                      {event.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Mini Calendar & Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setShowEventForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setSelectedDate(undefined)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  View All Events
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filter by Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="w-full"
                  modifiers={{
                    hasEvent: events.map(event => parseISO(event.event_date))
                  }}
                  modifiersStyles={{
                    hasEvent: { 
                      backgroundColor: 'rgb(59 130 246)', 
                      color: 'white',
                      fontWeight: 'bold'
                    }
                  }}
                />
                {selectedDate && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2">
                      Showing events for {format(selectedDate, 'MMM d, yyyy')}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedDate(undefined)}
                      className="w-full"
                    >
                      Clear Filter
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-blue-600">
                    {events.filter(event => {
                      const eventDate = parseISO(event.event_date);
                      const now = new Date();
                      return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
                    }).length}
                  </div>
                  <div className="text-sm text-gray-600">Events Scheduled</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Event Form Modal */}
      <EventForm
        isOpen={showEventForm}
        onClose={() => setShowEventForm(false)}
        onSubmit={handleCreateEvent}
        communityId={id || ''}
        isLoading={eventsLoading}
      />
    </div>
  );
};

export default CommunityCalendar;