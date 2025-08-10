import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { EventNotification, CommunityEvent } from '@/types/events';
import { addMinutes, format, parseISO } from 'date-fns';

export const useEventNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<EventNotification[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's event notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: notificationsData, error } = await supabase
        .from('event_notifications')
        .select(`
          *,
          event:community_events(
            title,
            event_date,
            start_time,
            community:communities(name)
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(notificationsData || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create notification for an event
  const createNotification = async (
    eventId: string,
    notificationType: EventNotification['notification_type'],
    scheduledFor: Date,
    message?: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('event_notifications')
        .insert({
          event_id: eventId,
          user_id: user.id,
          notification_type: notificationType,
          scheduled_for: scheduledFor.toISOString(),
          message,
          is_active: true,
        });

      if (error) {
        console.error('Error creating notification:', error);
        return false;
      }

      await fetchNotifications();
      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  };

  // Schedule automatic reminders for an event
  const scheduleEventReminders = async (
    event: CommunityEvent,
    reminderTimes: number[] = [60] // Default to 1 hour before
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const eventDateTime = new Date(`${event.event_date}T${event.start_time || '00:00'}:00`);
      
      const notifications = reminderTimes.map(minutes => ({
        event_id: event.id,
        user_id: user.id,
        notification_type: 'reminder' as const,
        scheduled_for: addMinutes(eventDateTime, -minutes).toISOString(),
        message: `Reminder: "${event.title}" starts in ${minutes} minute${minutes !== 1 ? 's' : ''}`,
        is_active: true,
      }));

      const { error } = await supabase
        .from('event_notifications')
        .insert(notifications);

      if (error) {
        console.error('Error scheduling reminders:', error);
        return false;
      }

      await fetchNotifications();
      return true;
    } catch (error) {
      console.error('Error scheduling reminders:', error);
      return false;
    }
  };

  // Cancel notification
  const cancelNotification = async (notificationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('event_notifications')
        .update({ is_active: false })
        .eq('id', notificationId);

      if (error) {
        console.error('Error canceling notification:', error);
        return false;
      }

      await fetchNotifications();
      return true;
    } catch (error) {
      console.error('Error canceling notification:', error);
      return false;
    }
  };

  // Mark notification as sent
  const markNotificationSent = async (notificationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('event_notifications')
        .update({ 
          sent_at: new Date().toISOString(),
          is_active: false 
        })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as sent:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking notification as sent:', error);
      return false;
    }
  };

  // Get due notifications (for client-side notification system)
  const getDueNotifications = useCallback(() => {
    const now = new Date();
    return notifications.filter(notification => {
      const scheduledTime = parseISO(notification.scheduled_for);
      return scheduledTime <= now && !notification.sent_at;
    });
  }, [notifications]);

  // Process due notifications
  const processDueNotifications = useCallback(async () => {
    const dueNotifications = getDueNotifications();
    
    for (const notification of dueNotifications) {
      try {
        // Show browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`Event Reminder`, {
            body: notification.message || `Reminder for your upcoming event`,
            icon: '/favicon.ico',
            tag: `event-${notification.event_id}`,
          });
        }

        // Show toast notification
        toast({
          title: "Event Reminder",
          description: notification.message || "You have an upcoming event",
        });

        // Mark as sent
        await markNotificationSent(notification.id);
      } catch (error) {
        console.error('Error processing notification:', error);
      }
    }
  }, [getDueNotifications, markNotificationSent, toast]);

  // Request notification permission
  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  // Auto-schedule reminders when user RSVPs to an event
  const autoScheduleReminders = async (
    event: CommunityEvent,
    userPreferences?: { default_reminder_time: number }
  ): Promise<boolean> => {
    if (!user) return false;

    const reminderTime = userPreferences?.default_reminder_time || 60;
    return await scheduleEventReminders(event, [reminderTime]);
  };

  // Initialize notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
      requestNotificationPermission();
    }
  }, [user, fetchNotifications]);

  // Check for due notifications every minute
  useEffect(() => {
    const interval = setInterval(() => {
      processDueNotifications();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [processDueNotifications]);

  return {
    notifications,
    loading,
    fetchNotifications,
    createNotification,
    scheduleEventReminders,
    cancelNotification,
    markNotificationSent,
    getDueNotifications,
    requestNotificationPermission,
    autoScheduleReminders,
  };
};

// Hook for managing event reminder settings
export const useEventReminders = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const createReminderNotifications = async (
    eventId: string,
    eventDateTime: Date,
    reminderTimes: number[]
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const notifications = reminderTimes.map(minutes => ({
        event_id: eventId,
        user_id: user.id,
        notification_type: 'reminder' as const,
        scheduled_for: addMinutes(eventDateTime, -minutes).toISOString(),
        message: `Reminder: Your event starts in ${minutes} minute${minutes !== 1 ? 's' : ''}`,
        is_active: true,
      }));

      const { error } = await supabase
        .from('event_notifications')
        .insert(notifications);

      if (error) {
        console.error('Error creating reminder notifications:', error);
        toast({
          title: "Error",
          description: "Failed to set up event reminders",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: `${reminderTimes.length} reminder${reminderTimes.length !== 1 ? 's' : ''} set`,
      });

      return true;
    } catch (error) {
      console.error('Error creating reminder notifications:', error);
      return false;
    }
  };

  const updateEventReminders = async (
    eventId: string,
    eventDateTime: Date,
    newReminderTimes: number[]
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      // Delete existing reminder notifications
      await supabase
        .from('event_notifications')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .eq('notification_type', 'reminder');

      // Create new reminders
      return await createReminderNotifications(eventId, eventDateTime, newReminderTimes);
    } catch (error) {
      console.error('Error updating event reminders:', error);
      return false;
    }
  };

  return {
    createReminderNotifications,
    updateEventReminders,
  };
};