import { useState, useEffect } from 'react';
import { 
  Repeat, 
  Calendar, 
  Clock, 
  Plus, 
  Trash, 
  Edit,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CommunityEvent, EventFormData } from '@/types/events';
import { addDays, addWeeks, addMonths, addYears, format, isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every N days/weeks/months/years
  byWeekday?: number[]; // 0-6, Sunday = 0
  byMonthDay?: number[]; // 1-31
  byMonth?: number[]; // 1-12
  bySetPos?: number; // nth occurrence (-1 for last)
  count?: number; // Number of occurrences
  until?: Date; // End date
}

interface RecurringEventSeries {
  id: string;
  baseEvent: Partial<EventFormData>;
  recurrenceRule: RecurrenceRule;
  exceptions: Date[]; // Dates to skip
  modifications: { [key: string]: Partial<EventFormData> }; // Date-specific modifications
  createdEvents: string[]; // IDs of created events
  status: 'draft' | 'active' | 'paused' | 'completed';
}

interface RecurringEventEngineProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSeries: (series: Omit<RecurringEventSeries, 'id' | 'createdEvents' | 'status'>) => Promise<boolean>;
  initialEventData?: Partial<EventFormData>;
  className?: string;
}

export const RecurringEventEngine = ({
  isOpen,
  onClose,
  onCreateSeries,
  initialEventData = {},
  className
}: RecurringEventEngineProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<'pattern' | 'preview' | 'exceptions'>('pattern');
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>({
    frequency: 'weekly',
    interval: 1,
    byWeekday: initialEventData.eventDate ? [initialEventData.eventDate.getDay()] : [1], // Monday default
  });
  const [exceptions, setExceptions] = useState<Date[]>([]);
  const [modifications, setModifications] = useState<{ [key: string]: Partial<EventFormData> }>({});
  const [endType, setEndType] = useState<'never' | 'after' | 'on'>('after');
  const [endCount, setEndCount] = useState(10);
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);

  // Generate preview events
  const generatePreviewEvents = (): Date[] => {
    if (!initialEventData.eventDate) return [];
    
    const events: Date[] = [];
    let currentDate = new Date(initialEventData.eventDate);
    const maxEvents = 50; // Safety limit
    let count = 0;

    while (events.length < maxEvents && count < 1000) { // Safety counter
      count++;
      
      if (isValidRecurrenceDate(currentDate)) {
        if (!exceptions.some(exception => isSameDay(exception, currentDate))) {
          events.push(new Date(currentDate));
        }
      }

      if (endType === 'after' && events.length >= endCount) break;
      if (endType === 'on' && endDate && currentDate > endDate) break;

      currentDate = getNextOccurrence(currentDate);
    }

    return events.slice(0, endType === 'after' ? endCount : undefined);
  };

  const isValidRecurrenceDate = (date: Date): boolean => {
    switch (recurrenceRule.frequency) {
      case 'weekly':
        return !recurrenceRule.byWeekday || recurrenceRule.byWeekday.includes(date.getDay());
      case 'monthly':
        if (recurrenceRule.byMonthDay?.length) {
          return recurrenceRule.byMonthDay.includes(date.getDate());
        }
        return true;
      case 'yearly':
        if (recurrenceRule.byMonth?.length) {
          return recurrenceRule.byMonth.includes(date.getMonth() + 1);
        }
        return true;
      default:
        return true;
    }
  };

  const getNextOccurrence = (currentDate: Date): Date => {
    switch (recurrenceRule.frequency) {
      case 'daily':
        return addDays(currentDate, recurrenceRule.interval);
      case 'weekly':
        return addWeeks(currentDate, recurrenceRule.interval);
      case 'monthly':
        return addMonths(currentDate, recurrenceRule.interval);
      case 'yearly':
        return addYears(currentDate, recurrenceRule.interval);
      default:
        return addDays(currentDate, 1);
    }
  };

  const handleFrequencyChange = (frequency: RecurrenceRule['frequency']) => {
    const newRule: RecurrenceRule = { ...recurrenceRule, frequency };
    
    // Set smart defaults based on frequency
    switch (frequency) {
      case 'weekly':
        newRule.byWeekday = initialEventData.eventDate ? [initialEventData.eventDate.getDay()] : [1];
        break;
      case 'monthly':
        newRule.byMonthDay = initialEventData.eventDate ? [initialEventData.eventDate.getDate()] : [1];
        break;
      case 'yearly':
        newRule.byMonth = initialEventData.eventDate ? [initialEventData.eventDate.getMonth() + 1] : [1];
        break;
    }
    
    setRecurrenceRule(newRule);
  };

  const handleWeekdayToggle = (day: number) => {
    const currentWeekdays = recurrenceRule.byWeekday || [];
    const newWeekdays = currentWeekdays.includes(day)
      ? currentWeekdays.filter(d => d !== day)
      : [...currentWeekdays, day].sort();
    
    setRecurrenceRule({ ...recurrenceRule, byWeekday: newWeekdays });
  };

  const addException = (date: Date) => {
    setExceptions([...exceptions, date]);
  };

  const removeException = (date: Date) => {
    setExceptions(exceptions.filter(ex => !isSameDay(ex, date)));
  };

  const handleCreateSeries = async () => {
    const series: Omit<RecurringEventSeries, 'id' | 'createdEvents' | 'status'> = {
      baseEvent: initialEventData,
      recurrenceRule: {
        ...recurrenceRule,
        count: endType === 'after' ? endCount : undefined,
        until: endType === 'on' ? endDate : undefined,
      },
      exceptions,
      modifications,
    };

    const success = await onCreateSeries(series);
    if (success) {
      onClose();
      toast({
        title: "Success",
        description: "Recurring event series created successfully",
      });
    }
  };

  const previewEvents = generatePreviewEvents();
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];

  const getRecurrenceDescription = (): string => {
    const { frequency, interval, byWeekday, byMonthDay } = recurrenceRule;
    
    let description = `Every ${interval > 1 ? `${interval} ` : ''}`;
    
    switch (frequency) {
      case 'daily':
        description += interval > 1 ? 'days' : 'day';
        break;
      case 'weekly':
        description += interval > 1 ? 'weeks' : 'week';
        if (byWeekday?.length) {
          description += ` on ${byWeekday.map(day => weekdays[day]).join(', ')}`;
        }
        break;
      case 'monthly':
        description += interval > 1 ? 'months' : 'month';
        if (byMonthDay?.length) {
          description += ` on the ${byMonthDay.join(', ')}${byMonthDay.length === 1 ? getOrdinalSuffix(byMonthDay[0]) : ''}`;
        }
        break;
      case 'yearly':
        description += interval > 1 ? 'years' : 'year';
        break;
    }

    if (endType === 'after') {
      description += `, ending after ${endCount} occurrences`;
    } else if (endType === 'on' && endDate) {
      description += `, ending on ${format(endDate, 'MMM d, yyyy')}`;
    }

    return description;
  };

  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Create Recurring Event Series
          </DialogTitle>
        </DialogHeader>

        <Tabs value={step} onValueChange={(value) => setStep(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pattern">Recurrence Pattern</TabsTrigger>
            <TabsTrigger value="preview">Preview ({previewEvents.length})</TabsTrigger>
            <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
          </TabsList>

          <TabsContent value="pattern" className="space-y-6 mt-6">
            {/* Frequency Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Repeat Frequency</Label>
              <RadioGroup
                value={recurrenceRule.frequency}
                onValueChange={handleFrequencyChange}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="daily" id="daily" />
                  <Label htmlFor="daily">Daily</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekly" id="weekly" />
                  <Label htmlFor="weekly">Weekly</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <Label htmlFor="monthly">Monthly</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yearly" id="yearly" />
                  <Label htmlFor="yearly">Yearly</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Interval */}
            <div className="space-y-2">
              <Label htmlFor="interval">Repeat Every</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="interval"
                  type="number"
                  min="1"
                  max="99"
                  value={recurrenceRule.interval}
                  onChange={(e) => setRecurrenceRule({
                    ...recurrenceRule,
                    interval: parseInt(e.target.value) || 1
                  })}
                  className="w-20"
                />
                <span className="text-sm text-gray-600">
                  {recurrenceRule.frequency === 'daily' && (recurrenceRule.interval > 1 ? 'days' : 'day')}
                  {recurrenceRule.frequency === 'weekly' && (recurrenceRule.interval > 1 ? 'weeks' : 'week')}
                  {recurrenceRule.frequency === 'monthly' && (recurrenceRule.interval > 1 ? 'months' : 'month')}
                  {recurrenceRule.frequency === 'yearly' && (recurrenceRule.interval > 1 ? 'years' : 'year')}
                </span>
              </div>
            </div>

            {/* Weekly Options */}
            {recurrenceRule.frequency === 'weekly' && (
              <div className="space-y-3">
                <Label>Repeat On</Label>
                <div className="flex flex-wrap gap-2">
                  {weekdays.map((day, index) => (
                    <Badge
                      key={day}
                      variant={recurrenceRule.byWeekday?.includes(index) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleWeekdayToggle(index)}
                    >
                      {day.slice(0, 3)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Options */}
            {recurrenceRule.frequency === 'monthly' && (
              <div className="space-y-3">
                <Label>Monthly Options</Label>
                <RadioGroup 
                  value={recurrenceRule.byMonthDay ? 'byDate' : 'byWeekday'} 
                  onValueChange={(value) => {
                    if (value === 'byDate') {
                      setRecurrenceRule({
                        ...recurrenceRule,
                        byMonthDay: [initialEventData.eventDate?.getDate() || 1],
                        byWeekday: undefined,
                        bySetPos: undefined
                      });
                    } else {
                      setRecurrenceRule({
                        ...recurrenceRule,
                        byMonthDay: undefined,
                        byWeekday: [initialEventData.eventDate?.getDay() || 1],
                        bySetPos: 1
                      });
                    }
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="byDate" id="byDate" />
                    <Label htmlFor="byDate">On the same date each month</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="byWeekday" id="byWeekday" />
                    <Label htmlFor="byWeekday">On the same weekday each month</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* End Conditions */}
            <div className="space-y-3">
              <Label>End Condition</Label>
              <RadioGroup value={endType} onValueChange={(value) => setEndType(value as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="never" id="never" />
                  <Label htmlFor="never">Never ends</Label>
                </div>
                <div className="flex items-center space-x-2 gap-2">
                  <RadioGroupItem value="after" id="after" />
                  <Label htmlFor="after">Ends after</Label>
                  <Input
                    type="number"
                    min="1"
                    value={endCount}
                    onChange={(e) => setEndCount(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">occurrences</span>
                </div>
                <div className="flex items-center space-x-2 gap-2">
                  <RadioGroupItem value="on" id="on" />
                  <Label htmlFor="on">Ends on</Label>
                  <Input
                    type="date"
                    value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                    className="w-36"
                  />
                </div>
              </RadioGroup>
            </div>

            {/* Advanced Settings */}
            <Collapsible open={advancedSettingsOpen} onOpenChange={setAdvancedSettingsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0">
                  <span>Advanced Settings</span>
                  {advancedSettingsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Advanced settings allow for complex recurrence patterns. Most events won't need these options.
                  </AlertDescription>
                </Alert>
                
                {/* Additional options could go here */}
                <div className="text-sm text-gray-600">
                  More advanced options will be available in future updates.
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Description Preview */}
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Pattern:</strong> {getRecurrenceDescription()}
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Event Preview</h3>
                <Badge variant="outline">
                  {previewEvents.length} events
                </Badge>
              </div>

              {previewEvents.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {previewEvents.slice(0, 20).map((date, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{format(date, 'EEEE, MMMM d, yyyy')}</div>
                            {initialEventData.startTime && (
                              <div className="text-sm text-gray-600">{initialEventData.startTime}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(date, 'MMM d')}
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {previewEvents.length > 20 && (
                    <div className="text-center text-sm text-gray-500 py-2">
                      ... and {previewEvents.length - 20} more events
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No events match the current recurrence pattern. Please adjust your settings.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="exceptions" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Skip Dates</h3>
                <Badge variant="outline">
                  {exceptions.length} exceptions
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="exception-date">Add Exception Date</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="exception-date"
                      type="date"
                      onChange={(e) => {
                        if (e.target.value) {
                          const newDate = new Date(e.target.value);
                          if (!exceptions.some(ex => isSameDay(ex, newDate))) {
                            addException(newDate);
                          }
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                </div>

                {exceptions.length > 0 && (
                  <div className="space-y-2">
                    <Label>Exception Dates</Label>
                    <div className="space-y-1">
                      {exceptions.map((date, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">
                            {format(date, 'EEEE, MMMM d, yyyy')}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeException(date)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Exception dates will be automatically skipped when creating the event series. 
                    This is useful for holidays or other dates when your regular event shouldn't occur.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {step !== 'pattern' && (
              <Button 
                variant="outline" 
                onClick={() => {
                  if (step === 'preview') setStep('pattern');
                  if (step === 'exceptions') setStep('preview');
                }}
              >
                Back
              </Button>
            )}
            {step !== 'exceptions' ? (
              <Button 
                onClick={() => {
                  if (step === 'pattern') setStep('preview');
                  if (step === 'preview') setStep('exceptions');
                }}
                disabled={previewEvents.length === 0}
              >
                Next
              </Button>
            ) : (
              <Button onClick={handleCreateSeries}>
                <Save className="h-4 w-4 mr-2" />
                Create Series
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};