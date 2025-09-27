import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Calendar, Plus, Clock, MapPin, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { EventForm } from '@/components/EventForm';
import { EventCreationFix } from '@/components/EventCreationFix';
import { SimpleEventButton } from '@/components/SimpleEventButton';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

export const CalendarFeatureFix = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  // Removed showEventForm state - using EventCreationFix component instead
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

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
    if (!id || !user) return;

    try {
      setError(null);
      
      // Try to fetch community details directly first
      let communityData = null;
      let communityError = null;

      try {
        const result = await supabase
          .from('communities')
          .select('*')
          .eq('id', id)
          .single();
        
        communityData = result.data;
        communityError = result.error;
      } catch (err) {
        console.log('Direct community fetch failed, trying through membership...');
        communityError = err;
      }

      // If we can't access the community directly, try through membership
      if (communityError || !communityData) {
        try {
          const { data: membershipData, error: memberError } = await supabase
            .from('community_members')
            .select(`
              *,
              communities!inner(*)
            `)
            .eq('community_id', id)
            .eq('user_id', user.id)
            .single();

          if (memberError) {
            console.error('Membership fetch error:', memberError);
            setError('Unable to access this community. You may not be a member.');
            return;
          }

          if (membershipData?.communities) {
            communityData = membershipData.communities as Community;
          } else {
            setError('Community not found or you do not have access.');
            return;
          }
        } catch (membershipErr) {
          console.error('Membership check failed:', membershipErr);
          setError('Failed to verify community membership.');
          return;
        }
      }

      setCommunity(communityData);
    } catch (error) {
      console.error('Error fetching community details:', error);
      setError('An unexpected error occurred while loading the community.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    if (!id) return;

    try {
      setEventsLoading(true);
      setError(null);
      
      const { data: eventsData, error } = await supabase
        .from('community_events')
        .select('*')
        .eq('community_id', id)
        .order('event_date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        setError('Failed to load events. Please try refreshing the page.');
        return;
      }

      setEvents(eventsData || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('An unexpected error occurred while loading events.');
    } finally {
      setEventsLoading(false);
    }
  };

  const handleCreateEvent = async (eventData: any) => {
    if (!id || !user) return;

    try {
      setEventsLoading(true);
      setError(null);
      
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
        toast({
          title: "Error",
          description: "Failed to create event. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Event created successfully!",
      });

      // Refresh events after creation
      await fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
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

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Unable to Load Calendar</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
              <Button variant="outline" onClick={() => navigate('/communities')}>
                Back to Communities
              </Button>
            </div>
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
                onClick={() => navigate(`/community/${id}`)}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to {community.name}
              </button>
            </div>
            <div className="flex items-center gap-3">
              {/* Simple button for immediate testing */}
              <SimpleEventButton 
                communityId={id || ''}
                onSuccess={() => {
                  console.log('Simple button success callback');
                }}
              />
              
              {/* Advanced event creation */}
              <EventCreationFix 
                communityId={id || ''}
                onEventCreated={() => {
                  fetchEvents();
                  toast({
                    title: "Success",
                    description: "Event created successfully!",
                  });
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
              <p className="text-gray-600">
                Stay up to date with all {community.name} events and activities.
              </p>
            </div>
          </div>

          {/* Success message if events loaded */}
          {!eventsLoading && events.length > 0 && (
            <Alert className="mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Calendar loaded successfully with {events.length} event{events.length !== 1 ? 's' : ''}.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Events */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Upcoming Events</span>
                  {eventsLoading && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  )}
                </CardTitle>
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
                        <p className="text-lg font-medium mb-2">No events scheduled yet</p>
                        <p className="text-sm mb-4">Create your first event to get started!</p>
                        <EventCreationFix 
                          communityId={id || ''}
                          onEventCreated={() => {
                            fetchEvents();
                          }}
                        />
                      </div>
                    ) : (
                      events
                        .filter(event => {
                          if (!selectedDate) return true;
                          return format(parseISO(event.event_date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                        })
                        .map((event, index) => {
                          const borderColors = [
                            'border-blue-500', 
                            'border-green-500', 
                            'border-purple-500', 
                            'border-orange-500', 
                            'border-pink-500'
                          ];
                          const borderColor = borderColors[index % borderColors.length];
                          
                          return (
                            <div key={event.id} className={`border-l-4 ${borderColor} pl-4 py-3 bg-gray-50 rounded-r-md hover:bg-gray-100 transition-colors`}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
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
                                    {event.max_attendees && (
                                      <div className="flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        <span>Max {event.max_attendees}</span>
                                      </div>
                                    )}
                                  </div>
                                  {event.description && (
                                    <p className="text-sm text-gray-600 line-clamp-2">
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <EventCreationFix 
                  communityId={id || ''}
                  onEventCreated={() => {
                    fetchEvents();
                  }}
                  className="w-full"
                />
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedDate(undefined);
                    fetchEvents();
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Refresh Events
                </Button>
              </CardContent>
            </Card>

            {/* Stats */}
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

            {/* Feature Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Calendar Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Create and manage events</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Virtual and in-person events</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Attendee limits and tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Time and location details</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Event creation now handled by EventCreationFix components above */}
    </div>
  );
};