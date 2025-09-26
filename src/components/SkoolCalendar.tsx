import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Video, MapPin, Users, Plus } from 'lucide-react';

interface SkoolCalendarProps {
  communityId: string;
}

export const SkoolCalendar: React.FC<SkoolCalendarProps> = ({ communityId }) => {
  const events = [
    {
      id: '1',
      title: 'Weekly Mastermind Call',
      date: 'Today',
      time: '2:00 PM - 3:00 PM EST',
      type: 'online',
      attendees: 24,
      host: 'John Davidson'
    },
    {
      id: '2',
      title: 'Growth Hacking Workshop',
      date: 'Tomorrow',
      time: '11:00 AM - 1:00 PM EST',
      type: 'online',
      attendees: 45,
      host: 'Sarah Chen'
    },
    {
      id: '3',
      title: 'Q&A with Industry Experts',
      date: 'Friday, Feb 16',
      time: '4:00 PM - 5:30 PM EST',
      type: 'online',
      attendees: 67,
      host: 'Mike Johnson'
    }
  ];

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

      <div className="space-y-4">
        {events.map((event) => (
          <Card key={event.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{event.date} • {event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.type === 'online' ? (
                        <>
                          <Video className="w-4 h-4" />
                          <span>Online Event</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4" />
                          <span>In-Person</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{event.attendees} attending • Hosted by {event.host}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black text-white">
                  RSVP
                </Button>
                {event.date === 'Today' && (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    Starting Soon
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};