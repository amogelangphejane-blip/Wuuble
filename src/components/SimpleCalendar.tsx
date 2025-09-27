import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, parseISO } from 'date-fns';

interface Event {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  is_virtual: boolean;
}

interface SimpleCalendarProps {
  communityId: string;
  onCreateEvent?: () => void;
}

export const SimpleCalendar: React.FC<SimpleCalendarProps> = ({ communityId, onCreateEvent }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');

  useEffect(() => {
    fetchEvents();
  }, [communityId, currentDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('community_events')
        .select('*')
        .eq('community_id', communityId)
        .gte('event_date', format(startOfMonth(currentDate), 'yyyy-MM-dd'))
        .lte('event_date', format(endOfMonth(currentDate), 'yyyy-MM-dd'))
        .order('event_date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        return;
      }

      setEvents(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      isSameDay(parseISO(event.event_date), date)
    );
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Community Events</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                view === 'calendar' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                view === 'list' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
          </div>
          
          <Button onClick={onCreateEvent} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar View */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth('prev')}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth('next')}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Today
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Day labels */}
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                      <div>Sun</div>
                      <div>Mon</div>
                      <div>Tue</div>
                      <div>Wed</div>
                      <div>Thu</div>
                      <div>Fri</div>
                      <div>Sat</div>
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {monthDays.map((day) => {
                        const dayEvents = getEventsForDate(day);
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const isCurrentDay = isToday(day);
                        
                        return (
                          <button
                            key={day.toISOString()}
                            onClick={() => setSelectedDate(day)}
                            className={`
                              relative h-20 p-2 text-left border rounded-lg transition-colors
                              ${isSelected 
                                ? 'bg-blue-50 border-blue-200' 
                                : 'border-gray-200 hover:bg-gray-50'
                              }
                              ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}
                              ${!isSameMonth(day, currentDate) ? 'opacity-30' : ''}
                            `}
                          >
                            <div className={`
                              text-sm font-medium
                              ${isCurrentDay ? 'text-blue-600' : 'text-gray-900'}
                            `}>
                              {format(day, 'd')}
                            </div>
                            
                            {dayEvents.length > 0 && (
                              <div className="mt-1 space-y-1">
                                {dayEvents.slice(0, 2).map((event) => (
                                  <div
                                    key={event.id}
                                    className="text-xs bg-blue-100 text-blue-800 rounded px-1 py-0.5 truncate"
                                  >
                                    {event.title}
                                  </div>
                                ))}
                                {dayEvents.length > 2 && (
                                  <div className="text-xs text-gray-500">
                                    +{dayEvents.length - 2} more
                                  </div>
                                )}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Selected Date Events */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedDate 
                    ? format(selectedDate, 'MMM d, yyyy') 
                    : 'Select a Date'
                  }
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                {selectedDate ? (
                  selectedDateEvents.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDateEvents.map((event) => (
                        <div key={event.id} className="p-3 border rounded-lg">
                          <h4 className="font-medium text-sm">{event.title}</h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            {event.start_time && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {event.start_time}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.is_virtual ? 'Virtual' : (event.location || 'TBA')}
                            </div>
                          </div>
                          {event.description && (
                            <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No events scheduled</p>
                  )
                ) : (
                  <p className="text-sm text-gray-500">Click on a date to view events</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* List View */
        <Card>
          <CardHeader>
            <CardTitle>All Events - {format(currentDate, 'MMMM yyyy')}</CardTitle>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-shrink-0 w-12 text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {format(parseISO(event.event_date), 'd')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(parseISO(event.event_date), 'MMM')}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">{event.title}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        {event.start_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {event.start_time}
                            {event.end_time && ` - ${event.end_time}`}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.is_virtual ? 'Virtual' : (event.location || 'TBA')}
                        </div>
                      </div>
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No events this month</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};