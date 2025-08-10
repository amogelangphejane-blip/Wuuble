import { useState, useEffect } from 'react';
import { 
  Bell, 
  Clock, 
  Plus, 
  X, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CommunityEvent, EventNotification } from '@/types/events';
import { useEventNotifications, useEventReminders } from '@/hooks/useEventNotifications';
import { format, parseISO, addMinutes, differenceInMinutes } from 'date-fns';

interface EventReminderSystemProps {
  event: CommunityEvent;
  className?: string;
}

export const EventReminderSystem = ({ event, className }: EventReminderSystemProps) => {
  const { 
    notifications, 
    scheduleEventReminders, 
    cancelNotification,
    autoScheduleReminders 
  } = useEventNotifications();
  
  const { createReminderNotifications, updateEventReminders } = useEventReminders();
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReminderTimes, setSelectedReminderTimes] = useState<number[]>([60]);
  const [autoRemindersEnabled, setAutoRemindersEnabled] = useState(true);
  const [customReminderTime, setCustomReminderTime] = useState<number>(60);

  // Get existing reminders for this event
  const eventReminders = notifications.filter(
    notification => 
      notification.event_id === event.id && 
      notification.notification_type === 'reminder'
  );

  const reminderTimeOptions = [
    { value: 5, label: '5 minutes before' },
    { value: 15, label: '15 minutes before' },
    { value: 30, label: '30 minutes before' },
    { value: 60, label: '1 hour before' },
    { value: 120, label: '2 hours before' },
    { value: 1440, label: '1 day before' },
    { value: 2880, label: '2 days before' },
    { value: 10080, label: '1 week before' },
  ];

  const handleScheduleReminders = async () => {
    const eventDateTime = new Date(`${event.event_date}T${event.start_time || '00:00'}:00`);
    const success = await createReminderNotifications(event.id, eventDateTime, selectedReminderTimes);
    
    if (success) {
      setIsOpen(false);
    }
  };

  const handleUpdateReminders = async () => {
    const eventDateTime = new Date(`${event.event_date}T${event.start_time || '00:00'}:00`);
    const success = await updateEventReminders(event.id, eventDateTime, selectedReminderTimes);
    
    if (success) {
      setIsOpen(false);
    }
  };

  const handleCancelReminder = async (notificationId: string) => {
    await cancelNotification(notificationId);
  };

  const addCustomReminderTime = () => {
    if (!selectedReminderTimes.includes(customReminderTime)) {
      setSelectedReminderTimes([...selectedReminderTimes, customReminderTime]);
    }
  };

  const removeReminderTime = (timeToRemove: number) => {
    setSelectedReminderTimes(selectedReminderTimes.filter(time => time !== timeToRemove));
  };

  const getReminderStatus = (reminder: EventNotification) => {
    const now = new Date();
    const scheduledTime = parseISO(reminder.scheduled_for);
    
    if (reminder.sent_at) {
      return { status: 'sent', color: 'text-green-600', icon: CheckCircle };
    } else if (scheduledTime <= now) {
      return { status: 'due', color: 'text-orange-600', icon: AlertCircle };
    } else {
      return { status: 'scheduled', color: 'text-blue-600', icon: Clock };
    }
  };

  const formatReminderTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
  };

  // Auto-schedule reminders when component mounts if none exist
  useEffect(() => {
    if (autoRemindersEnabled && eventReminders.length === 0) {
      autoScheduleReminders(event);
    }
  }, [event.id, autoRemindersEnabled, eventReminders.length, autoScheduleReminders, event]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Bell className="h-4 w-4 mr-2" />
          Reminders
          {eventReminders.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {eventReminders.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Event Reminders
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Info */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="font-semibold">{event.title}</h3>
                <div className="text-sm text-gray-600">
                  {format(parseISO(event.event_date), 'EEEE, MMMM d, yyyy')}
                  {event.start_time && ` at ${event.start_time}`}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Existing Reminders */}
          {eventReminders.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Active Reminders</h4>
              <div className="space-y-2">
                {eventReminders.map((reminder) => {
                  const { status, color, icon: StatusIcon } = getReminderStatus(reminder);
                  const eventDateTime = new Date(`${event.event_date}T${event.start_time || '00:00'}:00`);
                  const scheduledTime = parseISO(reminder.scheduled_for);
                  const minutesBefore = differenceInMinutes(eventDateTime, scheduledTime);
                  
                  return (
                    <div key={reminder.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <StatusIcon className={`h-4 w-4 ${color}`} />
                        <div>
                          <div className="font-medium text-sm">
                            {formatReminderTime(minutesBefore)} before
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(scheduledTime, 'MMM d, h:mm a')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={color}>
                          {status}
                        </Badge>
                        {!reminder.sent_at && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelReminder(reminder.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Separator />

          {/* Reminder Setup */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Set Up Reminders</h4>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Auto-reminders</span>
                <Switch
                  checked={autoRemindersEnabled}
                  onCheckedChange={setAutoRemindersEnabled}
                />
              </div>
            </div>

            {/* Quick Reminder Options */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Quick Options</label>
              <div className="grid grid-cols-2 gap-2">
                {reminderTimeOptions.slice(0, 6).map((option) => (
                  <Button
                    key={option.value}
                    variant={selectedReminderTimes.includes(option.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (selectedReminderTimes.includes(option.value)) {
                        removeReminderTime(option.value);
                      } else {
                        setSelectedReminderTimes([...selectedReminderTimes, option.value]);
                      }
                    }}
                    className="text-xs"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Reminder Time */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Custom Reminder</label>
              <div className="flex gap-2">
                <Select
                  value={customReminderTime.toString()}
                  onValueChange={(value) => setCustomReminderTime(parseInt(value))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reminderTimeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addCustomReminderTime}
                  disabled={selectedReminderTimes.includes(customReminderTime)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Selected Reminders Preview */}
            {selectedReminderTimes.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Selected Reminders</label>
                <div className="flex flex-wrap gap-2">
                  {selectedReminderTimes
                    .sort((a, b) => a - b)
                    .map((time) => (
                      <Badge
                        key={time}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        {formatReminderTime(time)} before
                        <button
                          onClick={() => removeReminderTime(time)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              {eventReminders.length > 0 ? (
                <Button
                  onClick={handleUpdateReminders}
                  disabled={selectedReminderTimes.length === 0}
                  className="flex-1"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Update Reminders
                </Button>
              ) : (
                <Button
                  onClick={handleScheduleReminders}
                  disabled={selectedReminderTimes.length === 0}
                  className="flex-1"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Schedule Reminders
                </Button>
              )}
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>
          </div>

          {/* Reminder Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-medium text-blue-900">How Reminders Work</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Browser notifications (if enabled)</li>
                  <li>• In-app toast notifications</li>
                  <li>• Email reminders (if enabled in preferences)</li>
                  <li>• Automatic scheduling for your RSVP'd events</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Component for displaying notification center
export const EventNotificationCenter = () => {
  const { notifications, loading, markNotificationSent } = useEventNotifications();
  const [showAll, setShowAll] = useState(false);

  const upcomingNotifications = notifications.filter(
    notification => !notification.sent_at && parseISO(notification.scheduled_for) > new Date()
  );

  const recentNotifications = notifications.filter(
    notification => notification.sent_at
  ).slice(0, 5);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
          {upcomingNotifications.length > 0 && (
            <Badge variant="secondary">
              {upcomingNotifications.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upcoming Notifications */}
        {upcomingNotifications.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Upcoming Reminders</h4>
            <div className="space-y-2">
              {upcomingNotifications.slice(0, showAll ? undefined : 3).map((notification) => {
                const scheduledTime = parseISO(notification.scheduled_for);
                const now = new Date();
                const timeUntil = differenceInMinutes(scheduledTime, now);
                
                return (
                  <div key={notification.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium text-sm">
                          {notification.message || 'Event reminder'}
                        </div>
                        <div className="text-xs text-gray-600">
                          {timeUntil > 0 ? `In ${formatReminderTime(timeUntil)}` : 'Due now'}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markNotificationSent(notification.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
            {upcomingNotifications.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="w-full"
              >
                {showAll ? 'Show Less' : `Show ${upcomingNotifications.length - 3} More`}
              </Button>
            )}
          </div>
        )}

        {/* Recent Notifications */}
        {recentNotifications.length > 0 && (
          <div className="space-y-3">
            <Separator />
            <h4 className="font-medium text-sm">Recent</h4>
            <div className="space-y-2">
              {recentNotifications.map((notification) => {
                const sentTime = notification.sent_at ? parseISO(notification.sent_at) : null;
                
                return (
                  <div key={notification.id} className="flex items-center gap-3 p-2 opacity-75">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {notification.message || 'Event reminder'}
                      </div>
                      {sentTime && (
                        <div className="text-xs text-gray-500">
                          Sent {format(sentTime, 'MMM d, h:mm a')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {upcomingNotifications.length === 0 && recentNotifications.length === 0 && (
          <div className="text-center py-6">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No notifications yet</p>
            <p className="text-gray-400 text-xs">RSVP to events to receive reminders</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Utility function to format reminder time
const formatReminderTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours}h ${remainingMinutes}m`;
    }
  } else {
    const days = Math.floor(minutes / 1440);
    const remainingHours = Math.floor((minutes % 1440) / 60);
    if (remainingHours === 0) {
      return `${days} day${days !== 1 ? 's' : ''}`;
    } else {
      return `${days}d ${remainingHours}h`;
    }
  }
};