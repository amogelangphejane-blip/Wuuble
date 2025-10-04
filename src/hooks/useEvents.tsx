import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { 
  CommunityEvent, 
  EventCategory, 
  EventRSVP, 
  EventFormData, 
  EventFilters,
  UserEventPreferences,
  LocationSuggestion,
  EventShare
} from '@/types/events';
import { format } from 'date-fns';

export const useEvents = (communityId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserEventPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const EVENTS_PER_PAGE = 10;

  // Fetch events with enhanced data and pagination
  const fetchEvents = useCallback(async (filters?: EventFilters, pageNum: number = 0, append: boolean = false) => {
    if (!communityId) return;

    try {
      setEventsLoading(true);
      
      // First, get total count
      let countQuery = supabase
        .from('community_events')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId);

      // Apply filters to count query
      if (filters?.categories?.length) {
        countQuery = countQuery.in('category_id', filters.categories);
      }
      if (filters?.dateRange) {
        countQuery = countQuery
          .gte('event_date', format(filters.dateRange.start, 'yyyy-MM-dd'))
          .lte('event_date', format(filters.dateRange.end, 'yyyy-MM-dd'));
      }
      if (filters?.tags?.length) {
        countQuery = countQuery.overlaps('tags', filters.tags);
      }
      if (filters?.visibility) {
        countQuery = countQuery.eq('visibility', filters.visibility);
      }

      const { count } = await countQuery;
      setTotalCount(count || 0);
      
      // Fetch paginated events
      let query = supabase
        .from('community_events')
        .select(`
          *,
          category:event_categories(*),
          creator_profile:profiles!community_events_user_id_fkey(display_name, avatar_url),
          rsvp_count:event_rsvps(count)
        `)
        .eq('community_id', communityId)
        .order('event_date', { ascending: true })
        .range(pageNum * EVENTS_PER_PAGE, (pageNum + 1) * EVENTS_PER_PAGE - 1);

      // Apply filters
      if (filters?.categories?.length) {
        query = query.in('category_id', filters.categories);
      }
      
      if (filters?.dateRange) {
        query = query
          .gte('event_date', format(filters.dateRange.start, 'yyyy-MM-dd'))
          .lte('event_date', format(filters.dateRange.end, 'yyyy-MM-dd'));
      }

      if (filters?.tags?.length) {
        query = query.overlaps('tags', filters.tags);
      }

      if (filters?.visibility) {
        query = query.eq('visibility', filters.visibility);
      }

      const { data: eventsData, error } = await query;

      if (error) {
        console.error('Error fetching events:', error);
        toast({
          title: "Error",
          description: "Failed to load events",
          variant: "destructive",
        });
        return;
      }

      // Fetch user's RSVP status for each event
      let processedEvents: CommunityEvent[] = [];
      if (user && eventsData) {
        const eventIds = eventsData.map(event => event.id);
        const { data: rsvpData } = await supabase
          .from('event_rsvps')
          .select('*')
          .in('event_id', eventIds)
          .eq('user_id', user.id);

        // Merge RSVP data with events
        processedEvents = eventsData.map(event => ({
          ...event,
          user_rsvp: rsvpData?.find(rsvp => rsvp.event_id === event.id),
          rsvp_count: Array.isArray(event.rsvp_count) ? event.rsvp_count.length : 0
        }));
      } else {
        processedEvents = eventsData || [];
      }

      // Update events state (append or replace)
      if (append) {
        setEvents(prev => [...prev, ...processedEvents]);
      } else {
        setEvents(processedEvents);
      }

      // Update hasMore state
      setHasMore((pageNum + 1) * EVENTS_PER_PAGE < (count || 0));
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setEventsLoading(false);
    }
  }, [communityId, user, toast, EVENTS_PER_PAGE]);

  // Fetch event categories
  const fetchCategories = useCallback(async () => {
    try {
      const { data: categoriesData, error } = await supabase
        .from('event_categories')
        .select('*')
        .or(`community_id.is.null,community_id.eq.${communityId}`)
        .order('is_default', { ascending: false })
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, [communityId]);

  // Fetch user preferences
  const fetchUserPreferences = useCallback(async () => {
    if (!user) return;

    try {
      const { data: preferencesData, error } = await supabase
        .from('user_event_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user preferences:', error);
        return;
      }

      setUserPreferences(preferencesData);
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
  }, [user]);

  // Create event
  const createEvent = async (eventData: EventFormData): Promise<boolean> => {
    if (!communityId || !user) return false;

    try {
      setEventsLoading(true);
      
      const { error } = await supabase
        .from('community_events')
        .insert({
          community_id: communityId,
          user_id: user.id,
          title: eventData.title,
          description: eventData.description,
          event_date: format(eventData.eventDate, 'yyyy-MM-dd'),
          start_time: eventData.startTime,
          end_time: eventData.endTime,
          location: eventData.location,
          is_virtual: eventData.isVirtual,
          max_attendees: eventData.maxAttendees,
          category_id: eventData.categoryId,
          recurring_type: eventData.recurringType,
          recurring_end_date: eventData.recurringEndDate ? format(eventData.recurringEndDate, 'yyyy-MM-dd') : null,
          tags: eventData.tags,
          visibility: eventData.visibility,
          requires_approval: eventData.requiresApproval,
          external_url: eventData.externalUrl,
          cover_image_url: eventData.coverImageUrl,
          timezone: eventData.timezone,
        });

      if (error) {
        console.error('Error creating event:', error);
        toast({
          title: "Error",
          description: "Failed to create event",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Event created successfully",
      });

      await fetchEvents(undefined, 0, false);
      return true;
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
      return false;
    } finally {
      setEventsLoading(false);
    }
  };

  // RSVP to event
  const rsvpToEvent = async (eventId: string, status: EventRSVP['status'], note?: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('event_rsvps')
        .upsert({
          event_id: eventId,
          user_id: user.id,
          status,
          response_note: note,
        });

      if (error) {
        console.error('Error updating RSVP:', error);
        toast({
          title: "Error",
          description: "Failed to update RSVP",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "RSVP updated successfully",
      });

      await fetchEvents(undefined, 0, false);
      return true;
    } catch (error) {
      console.error('Error updating RSVP:', error);
      toast({
        title: "Error",
        description: "Failed to update RSVP",
        variant: "destructive",
      });
      return false;
    }
  };

  // Create custom category
  const createCategory = async (categoryData: { name: string; color: string; icon?: string }): Promise<boolean> => {
    if (!communityId || !user) return false;

    try {
      const { error } = await supabase
        .from('event_categories')
        .insert({
          name: categoryData.name,
          color: categoryData.color,
          icon: categoryData.icon,
          community_id: communityId,
          is_default: false,
        });

      if (error) {
        console.error('Error creating category:', error);
        toast({
          title: "Error",
          description: "Failed to create category",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Category created successfully",
      });

      await fetchCategories();
      return true;
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
      return false;
    }
  };

  // Update user preferences
  const updateUserPreferences = async (preferences: Partial<UserEventPreferences>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_event_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
        });

      if (error) {
        console.error('Error updating preferences:', error);
        toast({
          title: "Error",
          description: "Failed to update preferences",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Preferences updated successfully",
      });

      await fetchUserPreferences();
      return true;
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive",
      });
      return false;
    }
  };

  // Share event
  const shareEvent = async (eventId: string, platform: EventShare['platform']): Promise<string | null> => {
    if (!user) return null;

    try {
      // Record the share
      await supabase
        .from('event_shares')
        .insert({
          event_id: eventId,
          user_id: user.id,
          platform,
        });

      // Generate share URL/content based on platform
      const event = events.find(e => e.id === eventId);
      if (!event) return null;

      const baseUrl = window.location.origin;
      const eventUrl = `${baseUrl}/communities/${communityId}/calendar?event=${eventId}`;
      
      const shareText = `Check out this event: ${event.title} on ${format(new Date(event.event_date), 'MMM d, yyyy')}`;

      switch (platform) {
        case 'facebook':
          return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`;
        case 'twitter':
          return `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(eventUrl)}`;
        case 'linkedin':
          return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`;
        case 'email':
          return `mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(`${shareText}\n\n${eventUrl}`)}`;
        case 'copy_link':
          await navigator.clipboard.writeText(eventUrl);
          toast({
            title: "Success",
            description: "Event link copied to clipboard",
          });
          return eventUrl;
        default:
          return eventUrl;
      }
    } catch (error) {
      console.error('Error sharing event:', error);
      toast({
        title: "Error",
        description: "Failed to share event",
        variant: "destructive",
      });
      return null;
    }
  };

  // Get location suggestions using the location service
  const getLocationSuggestions = async (query: string): Promise<LocationSuggestion[]> => {
    try {
      const { searchLocations } = await import('@/services/locationService');
      return await searchLocations(query);
    } catch (error) {
      console.error('Error getting location suggestions:', error);
      return [];
    }
  };

  // Generate calendar export data
  const generateCalendarExport = (event: CommunityEvent) => {
    const startDate = new Date(`${event.event_date}T${event.start_time || '00:00'}:00`);
    const endDate = new Date(`${event.event_date}T${event.end_time || '23:59'}:00`);
    
    const calendarData = {
      title: event.title,
      description: event.description,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      location: event.is_virtual ? (event.external_url || 'Virtual Event') : event.location,
      url: event.external_url,
    };

    // Generate ICS file content
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Community App//Event//EN
BEGIN:VEVENT
UID:${event.id}@communityapp.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${calendarData.location || ''}
${event.external_url ? `URL:${event.external_url}` : ''}
END:VEVENT
END:VCALENDAR`;

    return { calendarData, icsContent };
  };

  // Download ICS file
  const downloadCalendarFile = (event: CommunityEvent) => {
    const { icsContent } = generateCalendarExport(event);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Load more events (for infinite scroll)
  const loadMoreEvents = useCallback(async (filters?: EventFilters) => {
    if (!hasMore || eventsLoading) return;
    await fetchEvents(filters, page + 1, true);
  }, [hasMore, eventsLoading, page, fetchEvents]);

  // Reset and fetch events (for filters change)
  const resetAndFetchEvents = useCallback(async (filters?: EventFilters) => {
    setPage(0);
    setHasMore(true);
    await fetchEvents(filters, 0, false);
  }, [fetchEvents]);

  // Initialize data
  useEffect(() => {
    if (user && communityId) {
      Promise.all([
        fetchEvents(undefined, 0, false),
        fetchCategories(),
        fetchUserPreferences(),
      ]).finally(() => setLoading(false));
    }
  }, [user, communityId, fetchCategories, fetchUserPreferences]);

  return {
    events,
    categories,
    userPreferences,
    loading,
    eventsLoading,
    hasMore,
    totalCount,
    page,
    fetchEvents,
    loadMoreEvents,
    resetAndFetchEvents,
    fetchCategories,
    fetchUserPreferences,
    createEvent,
    rsvpToEvent,
    createCategory,
    updateUserPreferences,
    shareEvent,
    getLocationSuggestions,
    downloadCalendarFile,
    generateCalendarExport,
  };
};

// Hook for managing event RSVPs
export const useEventRSVPs = (eventId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rsvps, setRsvps] = useState<EventRSVP[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRSVPs = useCallback(async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      const { data: rsvpData, error } = await supabase
        .from('event_rsvps')
        .select(`
          *,
          user_profile:profiles!event_rsvps_user_id_fkey(display_name, avatar_url)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching RSVPs:', error);
        return;
      }

      setRsvps(rsvpData || []);
    } catch (error) {
      console.error('Error fetching RSVPs:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      fetchRSVPs();
    }
  }, [eventId, fetchRSVPs]);

  return {
    rsvps,
    loading,
    fetchRSVPs,
  };
};