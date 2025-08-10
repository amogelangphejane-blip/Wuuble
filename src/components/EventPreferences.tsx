import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Clock, 
  Palette, 
  Globe,
  Save,
  Settings
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { UserEventPreferences, EventCategory } from '@/types/events';

const preferencesSchema = z.object({
  defaultReminderTime: z.number().min(5).max(10080), // 5 minutes to 1 week
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  preferredCategories: z.array(z.string()).default([]),
  autoRsvpOwnEvents: z.boolean(),
  timezone: z.string(),
});

interface EventPreferencesProps {
  preferences: UserEventPreferences | null;
  categories: EventCategory[];
  onUpdatePreferences: (preferences: Partial<UserEventPreferences>) => Promise<boolean>;
  className?: string;
}

export const EventPreferences = ({
  preferences,
  categories,
  onUpdatePreferences,
  className
}: EventPreferencesProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [reminderTimes, setReminderTimes] = useState<number[]>([60]); // Default 1 hour

  const form = useForm<z.infer<typeof preferencesSchema>>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      defaultReminderTime: preferences?.default_reminder_time || 60,
      emailNotifications: preferences?.email_notifications ?? true,
      pushNotifications: preferences?.push_notifications ?? true,
      preferredCategories: preferences?.preferred_categories || [],
      autoRsvpOwnEvents: preferences?.auto_rsvp_own_events ?? true,
      timezone: preferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  // Update form when preferences change
  useEffect(() => {
    if (preferences) {
      form.reset({
        defaultReminderTime: preferences.default_reminder_time,
        emailNotifications: preferences.email_notifications,
        pushNotifications: preferences.push_notifications,
        preferredCategories: preferences.preferred_categories || [],
        autoRsvpOwnEvents: preferences.auto_rsvp_own_events,
        timezone: preferences.timezone,
      });
    }
  }, [preferences, form]);

  const handleSubmit = async (data: z.infer<typeof preferencesSchema>) => {
    setIsLoading(true);
    try {
      await onUpdatePreferences({
        default_reminder_time: data.defaultReminderTime,
        email_notifications: data.emailNotifications,
        push_notifications: data.pushNotifications,
        preferred_categories: data.preferredCategories,
        auto_rsvp_own_events: data.autoRsvpOwnEvents,
        timezone: data.timezone,
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  const timezoneOptions = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Event Preferences
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Notification Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <h3 className="text-lg font-medium">Notifications</h3>
              </div>
              
              <div className="space-y-4 pl-7">
                <FormField
                  control={form.control}
                  name="emailNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <FormLabel className="text-base">Email Notifications</FormLabel>
                        </div>
                        <FormDescription>
                          Receive event reminders and updates via email
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pushNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          <FormLabel className="text-base">Push Notifications</FormLabel>
                        </div>
                        <FormDescription>
                          Receive push notifications on your device
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="defaultReminderTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Default Reminder Time
                      </FormLabel>
                      <FormControl>
                        <Select 
                          value={field.value?.toString()} 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <SelectTrigger>
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
                      </FormControl>
                      <FormDescription>
                        How far in advance to remind you about events
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Category Preferences */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <h3 className="text-lg font-medium">Preferred Categories</h3>
              </div>
              
              <FormField
                control={form.control}
                name="preferredCategories"
                render={({ field }) => (
                  <FormItem>
                    <FormDescription>
                      Select categories you're most interested in for personalized recommendations
                    </FormDescription>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pl-7">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`pref-category-${category.id}`}
                            checked={field.value?.includes(category.id) || false}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, category.id]);
                              } else {
                                field.onChange(current.filter(id => id !== category.id));
                              }
                            }}
                          />
                          <label
                            htmlFor={`pref-category-${category.id}`}
                            className="flex items-center gap-2 text-sm cursor-pointer"
                          >
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Behavior Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <h3 className="text-lg font-medium">Behavior & Display</h3>
              </div>
              
              <div className="space-y-4 pl-7">
                <FormField
                  control={form.control}
                  name="autoRsvpOwnEvents"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Auto-RSVP to Own Events</FormLabel>
                        <FormDescription>
                          Automatically mark yourself as 'Going' to events you create
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {timezoneOptions.map((tz) => (
                              <SelectItem key={tz} value={tz}>
                                {tz}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Your local timezone for event scheduling
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Additional Reminder Times */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <h3 className="text-lg font-medium">Additional Reminders</h3>
              </div>
              
              <div className="pl-7 space-y-3">
                <p className="text-sm text-gray-600">
                  Set multiple reminder times for important events
                </p>
                <div className="flex flex-wrap gap-2">
                  {reminderTimeOptions.map((option) => (
                    <Badge
                      key={option.value}
                      variant={reminderTimes.includes(option.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (reminderTimes.includes(option.value)) {
                          setReminderTimes(reminderTimes.filter(t => t !== option.value));
                        } else {
                          setReminderTimes([...reminderTimes, option.value]);
                        }
                      }}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};