import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, Plus, Video, Globe, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEvents } from '@/hooks/useEvents';
import { EventCard } from './EventCard';
import { EventFilters as EventFiltersType } from '@/types/events';

interface CommunityEventsProps {
  communityId: string;
  isOwner: boolean;
  isModerator?: boolean;
}

export const CommunityEvents: React.FC<CommunityEventsProps> = ({
  communityId,
  isOwner,
  isModerator = false
}) => {
  const {
    events,
    loading,
    eventsLoading,
    hasMore,
    totalCount,
    loadMoreEvents,
    rsvpToEvent,
    shareEvent,
    downloadCalendarFile,
  } = useEvents(communityId);

  const [filters, setFilters] = useState<EventFiltersType>({});
  const observerTarget = useRef<HTMLDivElement>(null);

  // Infinite scroll implementation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !eventsLoading) {
          loadMoreEvents(filters);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, eventsLoading, filters, loadMoreEvents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Upcoming Events</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Join community events and connect with members
            {totalCount > 0 && ` (${totalCount} total events)`}
          </p>
        </div>
        
        {(isOwner || isModerator) && (
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        )}
      </div>

      {events.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onRSVP={rsvpToEvent}
                onShare={shareEvent}
                onDownloadCalendar={downloadCalendarFile}
                userCanManageEvent={isOwner || isModerator}
                viewMode="card"
              />
            ))}
          </div>

          {/* Infinite scroll trigger */}
          <div ref={observerTarget} className="py-4 flex justify-center">
            {eventsLoading && (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading more events...</span>
              </div>
            )}
            {!hasMore && events.length > 0 && (
              <p className="text-gray-500 text-sm">
                You've reached the end of the events list
              </p>
            )}
          </div>
        </>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Check back later for new events
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};