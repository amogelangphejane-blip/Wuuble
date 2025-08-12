import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useEvents } from '@/hooks/useEvents';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  Calendar, 
  Plus, 
  Settings,
  Grid3X3,
  List,
  CalendarDays,
  Filter,
  TrendingUp,
  Lock
} from 'lucide-react';
import { EnhancedEventForm } from '@/components/EnhancedEventForm';
import { EventCard } from '@/components/EventCard';
import { EventFiltersComponent } from '@/components/EventFilters';
import { EventPreferences } from '@/components/EventPreferences';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { EventFilters, EventViewMode, CommunityEvent } from '@/types/events';
import { format, parseISO, isAfter, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

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

const EnhancedCommunityCalendar = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({});
  const [viewMode, setViewMode] = useState<EventViewMode>({ type: 'list' });
  const [searchQuery, setSearchQuery] = useState('');

  // Use the enhanced events hook
  const {
    events,
    categories,
    userPreferences,
    eventsLoading,
    createEvent,
    rsvpToEvent,
    createCategory,
    updateUserPreferences,
    shareEvent,
    getLocationSuggestions,
    downloadCalendarFile,
  } = useEvents(id);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) {
      fetchCommunityDetails();
    }
  }, [user, id]);

  // Handle deep linking to specific events
  useEffect(() => {
    const eventId = searchParams.get('event');
    if (eventId && events.length > 0) {
      // Scroll to or highlight specific event
      const eventElement = document.getElementById(`event-${eventId}`);
      if (eventElement) {
        eventElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [searchParams, events]);

  const fetchCommunityDetails = async () => {
    if (!id || !user) return;

    try {
      // Try to fetch community details directly first
      // If it fails due to RLS, we'll handle it gracefully
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
        communityError = err;
      }

      // If we can't access the community directly, try through membership
      if (communityError || !communityData) {
        // Check if user is a member first
        const { data: membershipData } = await supabase
          .from('community_members')
          .select(`
            *,
            communities!inner(*)
          `)
          .eq('community_id', id)
          .eq('user_id', user.id)
          .single();

        if (membershipData?.communities) {
          communityData = membershipData.communities;
          setIsMember(true);
        } else {
          // User is not a member and can't access this community
          navigate('/communities');
          return;
        }
      } else {
        // We have community data, now check membership
        const { data: membershipData } = await supabase
          .from('community_members')
          .select('*')
          .eq('community_id', id)
          .eq('user_id', user.id)
          .single();

        setIsMember(!!membershipData);
      }

      setCommunity(communityData);
      setIsCreator(communityData.creator_id === user.id);
    } catch (error) {
      console.error('Error fetching community details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search events
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Apply permission-based filtering first
    filtered = filtered.filter(event => {
      // Public events are visible to everyone
      if (event.visibility === 'public') return true;
      
      // Private events only visible to creator
      if (event.visibility === 'private') {
        return user?.id === event.user_id;
      }
      
      // Members-only events visible to community members and creator
      if (event.visibility === 'members_only') {
        return isMember || isCreator || user?.id === event.user_id;
      }
      
      return false;
    });

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query) ||
        event.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filters
    if (filters.categories?.length) {
      filtered = filtered.filter(event => 
        event.category_id && filters.categories!.includes(event.category_id)
      );
    }

    // Apply date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(event => {
        const eventDate = parseISO(event.event_date);
        return eventDate >= filters.dateRange!.start && eventDate <= filters.dateRange!.end;
      });
    }

    // Apply tag filters
    if (filters.tags?.length) {
      filtered = filtered.filter(event =>
        event.tags?.some(tag => filters.tags!.includes(tag))
      );
    }

    // Apply RSVP status filter
    if (filters.rsvpStatus) {
      filtered = filtered.filter(event =>
        event.user_rsvp?.status === filters.rsvpStatus
      );
    }

    // Apply visibility filter
    if (filters.visibility) {
      filtered = filtered.filter(event => event.visibility === filters.visibility);
    }

    // Apply location filter
    if (filters.location) {
      const locationQuery = filters.location.toLowerCase();
      filtered = filtered.filter(event =>
        event.location?.toLowerCase().includes(locationQuery)
      );
    }

    return filtered;
  }, [events, searchQuery, filters, isMember, isCreator, user]);

  // Get all unique tags for filter options
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    events.forEach(event => {
      event.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [events]);

  // Get upcoming events count
  const upcomingEventsCount = useMemo(() => {
    return events.filter(event => isAfter(parseISO(event.event_date), new Date())).length;
  }, [events]);

  // Get events by week for calendar view
  const weeklyEvents = useMemo(() => {
    if (viewMode.type !== 'calendar') return {};
    
    const grouped: { [key: string]: CommunityEvent[] } = {};
    filteredEvents.forEach(event => {
      const eventDate = parseISO(event.event_date);
      const weekStart = startOfWeek(eventDate);
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      
      if (!grouped[weekKey]) {
        grouped[weekKey] = [];
      }
      grouped[weekKey].push(event);
    });
    
    return grouped;
  }, [filteredEvents, viewMode.type]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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

  const renderEvents = () => {
    if (filteredEvents.length === 0) {
      return (
        <Card className="col-span-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {events.length === 0 ? 'No events scheduled yet' : 'No events match your filters'}
            </h3>
            <p className="text-gray-500 text-center mb-4">
              {events.length === 0 
                ? 'Create your first event to get started!'
                : 'Try adjusting your filters or search terms'
              }
            </p>
            {events.length === 0 && (
              <Button onClick={() => setShowEventForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Event
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    if (viewMode.type === 'calendar') {
      return (
        <div className="space-y-6">
          {Object.entries(weeklyEvents).map(([weekKey, weekEvents]) => {
            const weekStart = parseISO(weekKey);
            const weekEnd = endOfWeek(weekStart);
            const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
            
            return (
              <Card key={weekKey}>
                <CardHeader>
                  <CardTitle>
                    {format(weekStart, 'MMMM d')} - {format(weekEnd, 'MMMM d, yyyy')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map(day => {
                      const dayEvents = weekEvents.filter(event =>
                        format(parseISO(event.event_date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                      );
                      
                      return (
                        <div key={format(day, 'yyyy-MM-dd')} className="min-h-[120px] border rounded p-2">
                          <div className="text-sm font-medium mb-2">
                            {format(day, 'EEE d')}
                          </div>
                          <div className="space-y-1">
                            {dayEvents.map(event => (
                              <div
                                key={event.id}
                                className="text-xs p-1 rounded cursor-pointer hover:shadow-sm"
                                style={{ 
                                  backgroundColor: event.category?.color ? `${event.category.color}20` : '#f3f4f6',
                                  borderLeft: `3px solid ${event.category?.color || '#6b7280'}`
                                }}
                                onClick={() => {
                                  // Handle event click in calendar view
                                }}
                              >
                                <div className="font-medium truncate">{event.title}</div>
                                {event.start_time && (
                                  <div className="text-gray-600">{event.start_time}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      );
    }

    if (viewMode.type === 'grid') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onRSVP={rsvpToEvent}
              onShare={shareEvent}
              onDownloadCalendar={downloadCalendarFile}
              userCanManageEvent={user?.id === event.user_id || isCreator}
              viewMode="card"
            />
          ))}
        </div>
      );
    }

    // List view (default)
    return (
      <div className="space-y-4">
        {filteredEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onRSVP={rsvpToEvent}
            onShare={shareEvent}
            onDownloadCalendar={downloadCalendarFile}
            userCanManageEvent={user?.id === event.user_id || isCreator}
            viewMode="list"
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/communities/${id}`)}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to {community.name}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Preferences
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Event Preferences</DialogTitle>
                  </DialogHeader>
                  <EventPreferences
                    preferences={userPreferences}
                    categories={categories}
                    onUpdatePreferences={updateUserPreferences}
                  />
                </DialogContent>
              </Dialog>
              {(isMember || isCreator) && (
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                  onClick={() => setShowEventForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Events Calendar</h1>
              <p className="text-gray-600">
                Discover and manage events in {community.name}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{events.length}</div>
                <div className="text-sm text-gray-600">Total Events</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{upcomingEventsCount}</div>
                <div className="text-sm text-gray-600">Upcoming</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{categories.length}</div>
                <div className="text-sm text-gray-600">Categories</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {events.filter(e => e.user_rsvp?.status === 'going').length}
                </div>
                <div className="text-sm text-gray-600">My Events</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="xl:col-span-1">
            <EventFiltersComponent
              categories={categories}
              filters={filters}
              onFiltersChange={setFilters}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              availableTags={availableTags}
            />
          </div>

          {/* Events Display */}
          <div className="xl:col-span-3">
            {/* View Mode Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">
                  {filteredEvents.length} Event{filteredEvents.length !== 1 ? 's' : ''}
                  {searchQuery && ` matching "${searchQuery}"`}
                </h2>
                {Object.keys(filters).length > 0 && (
                  <Badge variant="secondary">
                    <Filter className="h-3 w-3 mr-1" />
                    {Object.keys(filters).length} filter{Object.keys(filters).length !== 1 ? 's' : ''} active
                  </Badge>
                )}
              </div>
              
              {/* Desktop View Mode Toggle */}
              <div className="hidden md:flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm">
                <Button
                  variant={viewMode.type === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode({ type: 'list' })}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode.type === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode({ type: 'grid' })}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode.type === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode({ type: 'calendar' })}
                >
                  <CalendarDays className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Events List/Grid/Calendar */}
            {eventsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading events...</p>
                </div>
              </div>
            ) : (isMember || isCreator) ? (
              renderEvents()
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Join to see events</h3>
                  <p className="text-muted-foreground mb-6">
                    Become a member to discover and participate in community events.
                  </p>
                  <Button onClick={() => navigate(`/communities/${id}`)}>
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Back to Community
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Event Form Modal */}
      <EnhancedEventForm
        isOpen={showEventForm}
        onClose={() => setShowEventForm(false)}
        onSubmit={createEvent}
        communityId={id || ''}
        categories={categories}
        onCreateCategory={createCategory}
        getLocationSuggestions={getLocationSuggestions}
        isLoading={eventsLoading}
      />
    </div>
  );
};

export default EnhancedCommunityCalendar;