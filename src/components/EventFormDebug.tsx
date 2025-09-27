import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, MapPin, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const eventFormSchema = z.object({
  title: z.string().min(1, 'Event title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().optional(),
  eventDate: z.date({ required_error: 'Event date is required' }),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  isVirtual: z.boolean().default(false),
  maxAttendees: z.number().min(1, 'Must allow at least 1 attendee').optional(),
});

type EventFormData = z.infer<typeof eventFormSchema>;

interface EventFormDebugProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EventFormData) => Promise<void>;
  communityId: string;
  isLoading?: boolean;
}

export const EventFormDebug = ({ isOpen, onClose, onSubmit, communityId, isLoading = false }: EventFormDebugProps) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      isVirtual: false,
    },
  });

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLog(prev => [...prev, `${timestamp}: ${message}`]);
    console.log('🔍 EventForm Debug:', message);
  };

  useEffect(() => {
    if (isOpen) {
      addDebugLog('Dialog opened');
    } else {
      addDebugLog('Dialog closed');
    }
  }, [isOpen]);

  useEffect(() => {
    addDebugLog(`Component mounted with communityId: ${communityId}`);
  }, [communityId]);

  const handleSubmit = async (data: EventFormData) => {
    try {
      addDebugLog('Form submission started');
      addDebugLog(`Form data: ${JSON.stringify(data)}`);
      
      await onSubmit(data);
      
      addDebugLog('Form submission completed successfully');
      form.reset();
      onClose();
    } catch (error: any) {
      addDebugLog(`Form submission error: ${error.message}`);
      console.error('Error creating event:', error);
    }
  };

  const handleClose = () => {
    addDebugLog('Close requested');
    form.reset();
    onClose();
  };

  return (
    <>
      {/* Debug overlay when form is open */}
      {isOpen && (
        <div className="fixed top-20 left-4 bg-blue-500 text-white px-3 py-2 rounded text-sm z-[9999] max-w-xs">
          <div className="font-semibold">🔍 Event Form Debug</div>
          <div className="text-xs mt-1">
            Status: {isOpen ? 'Open' : 'Closed'}
          </div>
          <div className="text-xs">
            Community: {communityId.slice(0, 8)}...
          </div>
          <div className="text-xs max-h-20 overflow-y-auto mt-2">
            {debugLog.slice(-3).map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={(open) => {
        addDebugLog(`Dialog state change: ${open ? 'opening' : 'closing'}`);
        if (!open) {
          handleClose();
        }
      }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Event (Debug Mode)</DialogTitle>
            <DialogDescription>
              Schedule a new event for your community. Debug mode will show real-time information.
              <div className="text-xs text-blue-600 mt-2">
                Community ID: {communityId}
              </div>
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter event title" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          addDebugLog(`Title changed: ${e.target.value}`);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your event..."
                        className="min-h-[100px]"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          addDebugLog(`Description changed`);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eventDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Event Date *</FormLabel>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            onClick={() => {
                              addDebugLog('Date picker clicked');
                              setCalendarOpen(true);
                            }}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            addDebugLog(`Date selected: ${date}`);
                            field.onChange(date);
                            setCalendarOpen(false);
                          }}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Select the date when your event will take place.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="time" 
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              addDebugLog(`Start time: ${e.target.value}`);
                            }}
                          />
                          <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="time" 
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              addDebugLog(`End time: ${e.target.value}`);
                            }}
                          />
                          <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isVirtual"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Virtual Event</FormLabel>
                      <FormDescription>
                        This event will be held online
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          addDebugLog(`Virtual toggle: ${checked}`);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder={form.watch('isVirtual') ? "Meeting link or platform" : "Enter event location"}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            addDebugLog(`Location: ${e.target.value}`);
                          }}
                        />
                        <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </FormControl>
                    <FormDescription>
                      {form.watch('isVirtual') 
                        ? "Provide a meeting link or specify the virtual platform"
                        : "Physical address or venue name"
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxAttendees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Attendees</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="number" 
                          placeholder="No limit"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value ? parseInt(e.target.value) : undefined;
                            field.onChange(value);
                            addDebugLog(`Max attendees: ${value}`);
                          }}
                        />
                        <Users className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Leave empty for unlimited attendees
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    addDebugLog('Cancel button clicked');
                    handleClose();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  onClick={() => addDebugLog('Submit button clicked')}
                >
                  {isLoading ? 'Creating...' : 'Create Event'}
                </Button>
              </DialogFooter>
            </form>
          </Form>

          {/* Debug Info in Dialog */}
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
            <div className="font-semibold mb-2">🔍 Form Debug Log:</div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {debugLog.slice(-5).map((log, i) => (
                <div key={i} className="text-gray-700">{log}</div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};