import { useState } from 'react';
import { Check, X, Clock, Users, UserCheck, UserX, MessageSquare, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { CommunityEvent, EventRSVP } from '@/types/events';
import { useEventRSVPs } from '@/hooks/useEvents';
import { CalendarExportMenu } from './CalendarExportMenu';
import { EventReminderSystem } from './EventReminderSystem';

interface EventRSVPManagerProps {
  event: CommunityEvent;
  onRSVP: (eventId: string, status: EventRSVP['status'], note?: string) => Promise<boolean>;
  onDownloadCalendar: (event: CommunityEvent) => void;
  userCanManageEvent?: boolean;
}

export const EventRSVPManager = ({ 
  event, 
  onRSVP, 
  onDownloadCalendar,
  userCanManageEvent = false 
}: EventRSVPManagerProps) => {
  const { rsvps, loading } = useEventRSVPs(event.id);
  const [rsvpNote, setRsvpNote] = useState('');
  const [showRSVPDialog, setShowRSVPDialog] = useState(false);
  const [selectedRSVPStatus, setSelectedRSVPStatus] = useState<EventRSVP['status']>('going');

  const getRSVPCounts = () => {
    const counts = {
      going: rsvps.filter(rsvp => rsvp.status === 'going').length,
      maybe: rsvps.filter(rsvp => rsvp.status === 'maybe').length,
      not_going: rsvps.filter(rsvp => rsvp.status === 'not_going').length,
      waitlist: rsvps.filter(rsvp => rsvp.status === 'waitlist').length,
    };
    return counts;
  };

  const handleRSVP = async (status: EventRSVP['status']) => {
    setSelectedRSVPStatus(status);
    setShowRSVPDialog(true);
  };

  const submitRSVP = async () => {
    const success = await onRSVP(event.id, selectedRSVPStatus, rsvpNote);
    if (success) {
      setShowRSVPDialog(false);
      setRsvpNote('');
    }
  };

  const getStatusIcon = (status: EventRSVP['status']) => {
    switch (status) {
      case 'going':
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'maybe':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'not_going':
        return <UserX className="h-4 w-4 text-red-600" />;
      case 'waitlist':
        return <Users className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: EventRSVP['status']) => {
    switch (status) {
      case 'going':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'maybe':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'not_going':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'waitlist':
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const counts = getRSVPCounts();
  const totalAttending = counts.going + counts.maybe;
  const isEventFull = event.max_attendees && totalAttending >= event.max_attendees;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Event Attendance
          </CardTitle>
          <div className="flex gap-2">
            <CalendarExportMenu event={event} />
            <EventReminderSystem event={event} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* RSVP Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{counts.going}</div>
            <div className="text-sm text-green-700">Going</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{counts.maybe}</div>
            <div className="text-sm text-yellow-700">Maybe</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{counts.not_going}</div>
            <div className="text-sm text-red-700">Not Going</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{counts.waitlist}</div>
            <div className="text-sm text-blue-700">Waitlist</div>
          </div>
        </div>

        {/* Capacity Indicator */}
        {event.max_attendees && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Capacity</span>
              <span>{totalAttending} / {event.max_attendees}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  isEventFull ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min((totalAttending / event.max_attendees) * 100, 100)}%` }}
              />
            </div>
            {isEventFull && (
              <p className="text-sm text-red-600">Event is at capacity. New RSVPs will be added to waitlist.</p>
            )}
          </div>
        )}

        {/* RSVP Actions */}
        <div className="space-y-3">
          <h4 className="font-medium">Your Response</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              variant={event.user_rsvp?.status === 'going' ? 'default' : 'outline'}
              onClick={() => handleRSVP(isEventFull ? 'waitlist' : 'going')}
              className="flex items-center gap-2"
            >
              <UserCheck className="h-4 w-4" />
              {isEventFull ? 'Join Waitlist' : 'Going'}
            </Button>
            <Button
              variant={event.user_rsvp?.status === 'maybe' ? 'default' : 'outline'}
              onClick={() => handleRSVP('maybe')}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Maybe
            </Button>
            <Button
              variant={event.user_rsvp?.status === 'not_going' ? 'default' : 'outline'}
              onClick={() => handleRSVP('not_going')}
              className="flex items-center gap-2"
            >
              <UserX className="h-4 w-4" />
              Not Going
            </Button>
            {event.user_rsvp && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add RSVP Note</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Add a note about your attendance..."
                      value={rsvpNote}
                      onChange={(e) => setRsvpNote(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button onClick={submitRSVP}>Save Note</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* RSVP Dialog */}
        <Dialog open={showRSVPDialog} onOpenChange={setShowRSVPDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm RSVP</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(selectedRSVPStatus)}
                <span className="font-medium">
                  {selectedRSVPStatus === 'going' ? 'Going' : 
                   selectedRSVPStatus === 'maybe' ? 'Maybe' :
                   selectedRSVPStatus === 'not_going' ? 'Not Going' : 'Join Waitlist'}
                </span>
              </div>
              <Textarea
                placeholder="Add a note (optional)"
                value={rsvpNote}
                onChange={(e) => setRsvpNote(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={submitRSVP}>Confirm</Button>
                <Button variant="outline" onClick={() => setShowRSVPDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Attendees List */}
        {rsvps.length > 0 && (
          <div className="space-y-4">
            <Separator />
            <Tabs defaultValue="going" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="going" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Going ({counts.going})
                </TabsTrigger>
                <TabsTrigger value="maybe" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Maybe ({counts.maybe})
                </TabsTrigger>
                <TabsTrigger value="waitlist" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Waitlist ({counts.waitlist})
                </TabsTrigger>
                <TabsTrigger value="not_going" className="flex items-center gap-2">
                  <UserX className="h-4 w-4" />
                  Not Going ({counts.not_going})
                </TabsTrigger>
              </TabsList>

              {(['going', 'maybe', 'waitlist', 'not_going'] as const).map((status) => (
                <TabsContent key={status} value={status} className="space-y-2">
                  {rsvps
                    .filter(rsvp => rsvp.status === status)
                    .map((rsvp) => (
                      <div key={rsvp.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={rsvp.user_profile?.avatar_url || ''} />
                            <AvatarFallback>
                              {rsvp.user_profile?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {rsvp.user_profile?.display_name || 'Anonymous User'}
                            </div>
                            {rsvp.response_note && (
                              <div className="text-sm text-gray-600">{rsvp.response_note}</div>
                            )}
                          </div>
                        </div>
                        <Badge className={getStatusColor(status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(status)}
                            {status.replace('_', ' ').toUpperCase()}
                          </div>
                        </Badge>
                      </div>
                    ))}
                  {rsvps.filter(rsvp => rsvp.status === status).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No {status.replace('_', ' ')} responses yet</p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}

        {/* Event Management Actions (for event creators) */}
        {userCanManageEvent && (
          <div className="space-y-4">
            <Separator />
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Event Management</h4>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message Attendees
                </Button>
                <Button variant="outline" size="sm">
                  Export Attendee List
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};