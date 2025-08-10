import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  Tag, 
  Globe, 
  Lock, 
  Repeat,
  Plus,
  X,
  Search,
  Palette,
  Star
} from 'lucide-react';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { EventFormData, EventCategory, LocationSuggestion } from '@/types/events';

const eventFormSchema = z.object({
  title: z.string().min(1, 'Event title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().optional(),
  eventDate: z.date({ required_error: 'Event date is required' }),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  isVirtual: z.boolean().default(false),
  maxAttendees: z.number().min(1, 'Must allow at least 1 attendee').optional(),
  categoryId: z.string().optional(),
  recurringType: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']).default('none'),
  recurringEndDate: z.date().optional(),
  tags: z.array(z.string()).default([]),
  visibility: z.enum(['public', 'members_only', 'private']).default('members_only'),
  requiresApproval: z.boolean().default(false),
  externalUrl: z.string().url().optional().or(z.literal('')),
  timezone: z.string().default('UTC'),
});

interface EnhancedEventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EventFormData) => Promise<void>;
  communityId: string;
  categories: EventCategory[];
  onCreateCategory: (data: { name: string; color: string; icon?: string }) => Promise<boolean>;
  getLocationSuggestions: (query: string) => Promise<LocationSuggestion[]>;
  isLoading?: boolean;
}

export const EnhancedEventForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  communityId, 
  categories,
  onCreateCategory,
  getLocationSuggestions,
  isLoading = false 
}: EnhancedEventFormProps) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [recurringCalendarOpen, setRecurringCalendarOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');

  const form = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      isVirtual: false,
      recurringType: 'none',
      tags: [],
      visibility: 'members_only',
      requiresApproval: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({
    control: form.control,
    name: "tags",
  });

  // Handle location search
  useEffect(() => {
    const searchLocations = async () => {
      if (locationQuery.length > 2) {
        const suggestions = await getLocationSuggestions(locationQuery);
        setLocationSuggestions(suggestions);
        setShowLocationSuggestions(true);
      } else {
        setShowLocationSuggestions(false);
      }
    };

    const timeoutId = setTimeout(searchLocations, 300);
    return () => clearTimeout(timeoutId);
  }, [locationQuery, getLocationSuggestions]);

  const handleSubmit = async (data: z.infer<typeof eventFormSchema>) => {
    try {
      await onSubmit(data as EventFormData);
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleClose = () => {
    form.reset();
    setNewTag('');
    setLocationQuery('');
    setShowLocationSuggestions(false);
    setShowCategoryForm(false);
    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && !tagFields.some(field => field.value === newTag.trim())) {
      appendTag(newTag.trim());
      setNewTag('');
    }
  };

  const selectLocationSuggestion = (suggestion: LocationSuggestion) => {
    form.setValue('location', suggestion.address);
    setLocationQuery(suggestion.address);
    setShowLocationSuggestions(false);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    const success = await onCreateCategory({
      name: newCategoryName,
      color: newCategoryColor,
      icon: newCategoryIcon,
    });

    if (success) {
      setShowCategoryForm(false);
      setNewCategoryName('');
      setNewCategoryColor('#3B82F6');
      setNewCategoryIcon('');
    }
  };

  const popularIcons = [
    'Calendar', 'Users', 'BookOpen', 'Coffee', 'Trophy', 'Music', 
    'GraduationCap', 'Briefcase', 'Heart', 'Star', 'Zap', 'Target'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Schedule a new event for your community with advanced options and customization.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter event title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category */}
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <div className="flex gap-2">
                        <FormControl className="flex-1">
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: category.color }}
                                    />
                                    {category.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCategoryForm(!showCategoryForm)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* New Category Form */}
                {showCategoryForm && (
                  <Card className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        <span className="font-medium">Create New Category</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Category name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                        />
                        <div className="flex gap-1">
                          <Input
                            type="color"
                            value={newCategoryColor}
                            onChange={(e) => setNewCategoryColor(e.target.value)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            placeholder="Icon"
                            value={newCategoryIcon}
                            onChange={(e) => setNewCategoryIcon(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {popularIcons.map((icon) => (
                          <Button
                            key={icon}
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setNewCategoryIcon(icon)}
                            className="h-8 px-2"
                          >
                            {icon}
                          </Button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleCreateCategory}
                          disabled={!newCategoryName.trim()}
                        >
                          Create
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCategoryForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Description */}
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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type="time" {...field} />
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
                            <Input type="time" {...field} />
                            <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                {/* Virtual Event Toggle */}
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
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Location with suggestions */}
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
                            value={locationQuery}
                            onChange={(e) => {
                              setLocationQuery(e.target.value);
                              field.onChange(e.target.value);
                            }}
                          />
                          <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          
                          {/* Location Suggestions */}
                          {showLocationSuggestions && locationSuggestions.length > 0 && (
                            <Card className="absolute top-full left-0 right-0 z-50 mt-1">
                              <CardContent className="p-2">
                                {locationSuggestions.map((suggestion) => (
                                  <button
                                    key={suggestion.id}
                                    type="button"
                                    className="w-full text-left p-2 hover:bg-gray-100 rounded flex items-center gap-2"
                                    onClick={() => selectLocationSuggestion(suggestion)}
                                  >
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    <div>
                                      <div className="font-medium">{suggestion.name}</div>
                                      <div className="text-sm text-gray-500">{suggestion.address}</div>
                                      {suggestion.rating && (
                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                          <Star className="h-3 w-3 fill-current" />
                                          {suggestion.rating}
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </CardContent>
                            </Card>
                          )}
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

                {/* External URL for virtual events */}
                {form.watch('isVirtual') && (
                  <FormField
                    control={form.control}
                    name="externalUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://zoom.us/j/..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Direct link to join the virtual event
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Max Attendees */}
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
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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

                {/* Tags */}
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {tagFields.map((field, index) => (
                        <Badge key={field.id} variant="secondary" className="flex items-center gap-1">
                          {field.value}
                          <button
                            type="button"
                            onClick={() => removeTag(index)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={addTag}>
                        <Tag className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <FormDescription>
                    Add tags to help people find your event
                  </FormDescription>
                </FormItem>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                {/* Visibility */}
                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Visibility</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Public - Anyone can see
                              </div>
                            </SelectItem>
                            <SelectItem value="members_only">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Members Only
                              </div>
                            </SelectItem>
                            <SelectItem value="private">
                              <div className="flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                Private - Invite only
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Requires Approval */}
                <FormField
                  control={form.control}
                  name="requiresApproval"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Require RSVP Approval</FormLabel>
                        <FormDescription>
                          Manually approve attendees before they can join
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

                {/* Recurring Event */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="recurringType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recurring Event</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="h-4 w-4" />
                                  One-time event
                                </div>
                              </SelectItem>
                              <SelectItem value="daily">
                                <div className="flex items-center gap-2">
                                  <Repeat className="h-4 w-4" />
                                  Daily
                                </div>
                              </SelectItem>
                              <SelectItem value="weekly">
                                <div className="flex items-center gap-2">
                                  <Repeat className="h-4 w-4" />
                                  Weekly
                                </div>
                              </SelectItem>
                              <SelectItem value="monthly">
                                <div className="flex items-center gap-2">
                                  <Repeat className="h-4 w-4" />
                                  Monthly
                                </div>
                              </SelectItem>
                              <SelectItem value="yearly">
                                <div className="flex items-center gap-2">
                                  <Repeat className="h-4 w-4" />
                                  Yearly
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Recurring End Date */}
                  {form.watch('recurringType') !== 'none' && (
                    <FormField
                      control={form.control}
                      name="recurringEndDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Recurring Until</FormLabel>
                          <Popover open={recurringCalendarOpen} onOpenChange={setRecurringCalendarOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Select end date</span>
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
                                  field.onChange(date);
                                  setRecurringCalendarOpen(false);
                                }}
                                disabled={(date) =>
                                  date < (form.getValues('eventDate') || new Date())
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            When should the recurring event stop?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Event'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};