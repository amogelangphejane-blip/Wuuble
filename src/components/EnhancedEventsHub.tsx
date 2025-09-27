import { useState } from 'react';
import { 
  Calendar, 
  Users, 
  BarChart3, 
  MessageSquare,
  Settings,
  Download,
  QrCode,
  Repeat,
  FileText,
  Zap,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CommunityEvent, EventRSVP, EventFormData } from '@/types/events';
import { useEvents } from '@/hooks/useEvents';
import { useToast } from '@/hooks/use-toast';

// Import all the enhanced components
import { EventAnalyticsDashboard } from './EventAnalyticsDashboard';
import { EventWaitlistManager } from './EventWaitlistManager';
import { RecurringEventEngine } from './RecurringEventEngine';
import { EventCheckInSystem } from './EventCheckInSystem';
import { EventAttendeeMessaging } from './EventAttendeeMessaging';
import { EventTemplateManager } from './EventTemplateManager';
import { EventDataExporter } from './EventDataExporter';
import { EnhancedEventForm } from './EnhancedEventForm';
import { EventCard } from './EventCard';

interface EnhancedEventsHubProps {
  communityId: string;
  userPermissions: {
    canCreateEvents: boolean;
    canManageEvents: boolean;
    canViewAnalytics: boolean;
    canSendMessages: boolean;
  };
  className?: string;
}

export const EnhancedEventsHub = ({
  communityId,
  userPermissions,
  className
}: EnhancedEventsHubProps) => {
  const { toast } = useToast();
  const {
    events,
    categories,
    userPreferences,
    loading,
    createEvent,
    rsvpToEvent,
    createCategory,
    shareEvent,
    getLocationSuggestions,
    downloadCalendarFile,
  } = useEvents(communityId);

  // State management
  const [activeView, setActiveView] = useState<'events' | 'analytics' | 'templates' | 'messaging'>('events');
  const [selectedEventId, setSelectedEventId] = useState<string>();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for demonstration - in real app, these would come from API
  const mockCheckIns = []; // Check-in records
  const mockMessages = []; // Event messages
  const mockTemplates = []; // Event templates
  const mockWaitlistEntries = []; // Waitlist entries

  const selectedEvent = selectedEventId ? events.find(e => e.id === selectedEventId) : undefined;
  const eventAttendees = selectedEvent ? [] : []; // Would get from API

  const handleCreateEvent = async (eventData: EventFormData) => {
    const success = await createEvent(eventData);
    if (success) {
      setShowCreateDialog(false);
      toast({
        title: "Success",
        description: "Event created successfully",
      });
    }
  };

  const handleCreateRecurringSeries = async (seriesData: any) => {
    // Mock implementation - would integrate with recurring event service
    console.log('Creating recurring series:', seriesData);
    toast({
      title: "Success",
      description: "Recurring event series created successfully",
    });
    setShowRecurringDialog(false);
    return true;
  };

  const handleExportData = async (format: string, data: any[], filename: string) => {
    // Mock implementation - would integrate with export service
    console.log('Exporting data:', { format, data, filename });
    
    // Simulate export process
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  };

  const getQuickStats = () => {
    const totalEvents = events.length;
    const upcomingEvents = events.filter(e => new Date(e.event_date) > new Date()).length;
    const totalRSVPs = events.reduce((acc, event) => acc + (event.rsvp_count || 0), 0);
    const myEvents = events.filter(e => e.user_id === 'current-user-id').length; // Mock user check

    return { totalEvents, upcomingEvents, totalRSVPs, myEvents };
  };

  const stats = getQuickStats();
  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const quickActions = [
    {
      id: 'create-event',
      label: 'Create Event',
      icon: Plus,
      description: 'Create a new event',
      action: () => setShowCreateDialog(true),
      permission: userPermissions.canCreateEvents,
    },
    {
      id: 'recurring-event',
      label: 'Recurring Event',
      icon: Repeat,
      description: 'Set up recurring events',
      action: () => setShowRecurringDialog(true),
      permission: userPermissions.canCreateEvents,
    },
    {
      id: 'export-data',
      label: 'Export Data',
      icon: Download,
      description: 'Export event data',
      action: () => setShowExportDialog(true),
      permission: userPermissions.canManageEvents,
    },
    {
      id: 'check-in-system',
      label: 'Check-in System',
      icon: QrCode,
      description: 'Manage event check-ins',
      action: () => setActiveView('events'), // Would show check-in tab
      permission: userPermissions.canManageEvents,
    },
  ];

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Events Hub</h1>
            <p className="text-gray-600">Manage your community events with advanced features</p>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            {quickActions.filter(action => action.permission).map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                onClick={action.action}
                className="flex items-center gap-2"
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Events</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalEvents}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.upcomingEvents}</p>
                </div>
                <Zap className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total RSVPs</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalRSVPs}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">My Events</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.myEvents}</p>
                </div>
                <Settings className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="messaging" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messaging
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>

            {/* Events Grid */}
            <div className="space-y-4">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-gray-200 rounded mb-4"></div>
                        <div className="h-3 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredEvents.length > 0 ? (
                <div className="space-y-4">
                  {filteredEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onRSVP={rsvpToEvent}
                      onShare={shareEvent}
                      onDownloadCalendar={downloadCalendarFile}
                      viewMode="list"
                      className="hover:shadow-lg transition-shadow"
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {searchQuery ? 'No matching events' : 'No events yet'}
                    </h3>
                    <p className="text-gray-600 text-center mb-6">
                      {searchQuery 
                        ? 'Try adjusting your search or filters'
                        : 'Create your first event to get started'
                      }
                    </p>
                    {userPermissions.canCreateEvents && (
                      <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Event
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Quick Access to Advanced Features */}
            {selectedEvent && (
              <Card>
                <CardHeader>
                  <CardTitle>Event Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {userPermissions.canManageEvents && (
                      <>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="h-20 flex flex-col gap-2">
                              <QrCode className="h-6 w-6" />
                              <span className="text-sm">Check-in System</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-6xl">
                            <EventCheckInSystem
                              event={selectedEvent}
                              rsvpList={eventAttendees}
                              checkInRecords={mockCheckIns}
                              onCheckIn={async () => true}
                              onBulkCheckIn={async () => true}
                              onExportCheckIns={async () => {}}
                              userCanManageCheckIns={userPermissions.canManageEvents}
                            />
                          </DialogContent>
                        </Dialog>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="h-20 flex flex-col gap-2">
                              <Users className="h-6 w-6" />
                              <span className="text-sm">Waitlist</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-6xl">
                            <EventWaitlistManager
                              event={selectedEvent}
                              waitlistEntries={mockWaitlistEntries}
                              onPromoteFromWaitlist={async () => true}
                              onRemoveFromWaitlist={async () => true}
                              onSendNotification={async () => true}
                              onUpdatePriority={async () => true}
                              userCanManageEvent={userPermissions.canManageEvents}
                            />
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <EventAnalyticsDashboard
              events={events}
              selectedEventId={selectedEventId}
              onEventSelect={setSelectedEventId}
              userCanViewAnalytics={userPermissions.canViewAnalytics}
            />
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <EventTemplateManager
              templates={mockTemplates}
              categories={categories}
              onCreateTemplate={async () => true}
              onUpdateTemplate={async () => true}
              onDeleteTemplate={async () => true}
              onUseTemplate={(template) => {
                // Load template data into create form
                setShowCreateDialog(true);
              }}
              userCanManageTemplates={userPermissions.canCreateEvents}
            />
          </TabsContent>

          <TabsContent value="messaging" className="space-y-6">
            {selectedEvent ? (
              <EventAttendeeMessaging
                event={selectedEvent}
                attendees={eventAttendees}
                messages={mockMessages}
                templates={[]}
                onSendMessage={async () => true}
                onSaveTemplate={async () => true}
                userCanSendMessages={userPermissions.canSendMessages}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Select an Event</h3>
                  <p className="text-gray-600">Choose an event to send messages to attendees</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Enhanced Event Creation Dialog */}
        <EnhancedEventForm
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSubmit={handleCreateEvent}
          communityId={communityId}
          categories={categories}
          onCreateCategory={createCategory}
          getLocationSuggestions={getLocationSuggestions}
        />

        {/* Recurring Event Engine */}
        <RecurringEventEngine
          isOpen={showRecurringDialog}
          onClose={() => setShowRecurringDialog(false)}
          onCreateSeries={handleCreateRecurringSeries}
          initialEventData={{}}
        />

        {/* Data Export Dialog */}
        {selectedEvent && (
          <EventDataExporter
            event={selectedEvent}
            attendees={eventAttendees}
            checkIns={mockCheckIns}
            isOpen={showExportDialog}
            onClose={() => setShowExportDialog(false)}
            onExport={handleExportData}
          />
        )}
      </div>
    </div>
  );
};