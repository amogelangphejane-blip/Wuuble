import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, Plus, Video, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: 'online' | 'in-person';
  attendees: number;
  maxAttendees?: number;
}

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
  const [events] = useState<Event[]>([
    {
      id: '1',
      title: 'Weekly Tech Talk',
      description: 'Join us for our weekly discussion on the latest in technology',
      date: '2024-02-15',
      time: '18:00',
      location: 'Virtual Meeting Room',
      type: 'online',
      attendees: 45,
      maxAttendees: 100
    },
    {
      id: '2',
      title: 'Community Meetup',
      description: 'Monthly in-person meetup for networking and collaboration',
      date: '2024-02-20',
      time: '19:00',
      location: 'Tech Hub, San Francisco',
      type: 'in-person',
      attendees: 32,
      maxAttendees: 50
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Upcoming Events</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Join community events and connect with members
          </p>
        </div>
        
        {(isOwner || isModerator) && (
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {events.map((event) => (
          <Card key={event.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {event.description}
                  </p>
                </div>
                <Badge variant={event.type === 'online' ? 'secondary' : 'default'}>
                  {event.type === 'online' ? (
                    <>
                      <Video className="w-3 h-3 mr-1" />
                      Online
                    </>
                  ) : (
                    <>
                      <Globe className="w-3 h-3 mr-1" />
                      In-Person
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>
                    {event.attendees}
                    {event.maxAttendees && ` / ${event.maxAttendees}`} attending
                  </span>
                </div>
              </div>
              
              <Button className="w-full mt-4" variant="outline">
                RSVP
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {events.length === 0 && (
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