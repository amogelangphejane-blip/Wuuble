import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Send, 
  X,
  Timer,
  Zap,
  Sunrise,
  Sun,
  Sunset,
  Moon
} from 'lucide-react';
import { format, addMinutes, addHours, addDays, setHours, setMinutes } from 'date-fns';
import { cn } from '@/lib/utils';

interface ScheduleMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (message: string, scheduledTime: Date) => void;
  initialMessage?: string;
}

export const ScheduleMessageDialog: React.FC<ScheduleMessageDialogProps> = ({
  isOpen,
  onClose,
  onSchedule,
  initialMessage = '',
}) => {
  const [message, setMessage] = useState(initialMessage);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [quickSelectMode, setQuickSelectMode] = useState<'quick' | 'custom'>('quick');

  const now = new Date();
  
  const quickOptions = [
    {
      label: 'In 5 minutes',
      value: addMinutes(now, 5),
      icon: <Timer className="h-4 w-4" />,
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
    },
    {
      label: 'In 1 hour',
      value: addHours(now, 1),
      icon: <Clock className="h-4 w-4" />,
      color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
    },
    {
      label: 'Tomorrow 9 AM',
      value: setHours(setMinutes(addDays(now, 1), 0), 9),
      icon: <Sunrise className="h-4 w-4" />,
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
    },
    {
      label: 'Tomorrow 2 PM',
      value: setHours(setMinutes(addDays(now, 1), 0), 14),
      icon: <Sun className="h-4 w-4" />,
      color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
    },
    {
      label: 'Tomorrow 6 PM',
      value: setHours(setMinutes(addDays(now, 1), 0), 18),
      icon: <Sunset className="h-4 w-4" />,
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
    },
    {
      label: 'Tomorrow 9 PM',
      value: setHours(setMinutes(addDays(now, 1), 0), 21),
      icon: <Moon className="h-4 w-4" />,
      color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
    },
  ];

  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);

  const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
    const totalMinutes = i * 15;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const label = format(setMinutes(setHours(new Date(), hours), minutes), 'h:mm a');
    return { value: time, label };
  });

  const getScheduledDateTime = () => {
    if (quickSelectMode === 'quick' && selectedDateTime) {
      return selectedDateTime;
    }
    
    if (quickSelectMode === 'custom' && selectedDate && selectedTime) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      return setMinutes(setHours(selectedDate, hours), minutes);
    }
    
    return null;
  };

  const handleSchedule = () => {
    const scheduledTime = getScheduledDateTime();
    if (message.trim() && scheduledTime) {
      onSchedule(message.trim(), scheduledTime);
      handleClose();
    }
  };

  const handleClose = () => {
    setMessage(initialMessage);
    setSelectedDate(undefined);
    setSelectedTime('');
    setSelectedDateTime(null);
    setQuickSelectMode('quick');
    onClose();
  };

  const canSchedule = message.trim() && getScheduledDateTime();
  const scheduledDateTime = getScheduledDateTime();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Schedule Message
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Message Content */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[100px] resize-none"
              maxLength={1000}
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{message.length}/1000 characters</span>
            </div>
          </div>

          {/* Schedule Options Toggle */}
          <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <Button
              variant={quickSelectMode === 'quick' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 h-8"
              onClick={() => setQuickSelectMode('quick')}
            >
              <Zap className="h-3 w-3 mr-1" />
              Quick
            </Button>
            <Button
              variant={quickSelectMode === 'custom' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 h-8"
              onClick={() => setQuickSelectMode('custom')}
            >
              <CalendarIcon className="h-3 w-3 mr-1" />
              Custom
            </Button>
          </div>

          {quickSelectMode === 'quick' ? (
            /* Quick Select Options */
            <div className="space-y-2">
              <Label>Quick Options</Label>
              <div className="grid grid-cols-2 gap-2">
                {quickOptions.map((option, index) => (
                  <Button
                    key={index}
                    variant={selectedDateTime === option.value ? 'default' : 'outline'}
                    className={cn(
                      "justify-start h-auto p-3 text-left",
                      selectedDateTime === option.value 
                        ? "bg-[#25d366] text-white hover:bg-[#20c55e]" 
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                    onClick={() => setSelectedDateTime(option.value)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        selectedDateTime === option.value 
                          ? "bg-white/20" 
                          : option.color
                      )}>
                        {option.icon}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{option.label}</div>
                        <div className="text-xs opacity-70">
                          {format(option.value, 'MMM d, h:mm a')}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            /* Custom Date & Time Selection */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                />
              </div>

              {selectedDate && (
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {timeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Scheduled Time Preview */}
          {scheduledDateTime && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm text-blue-700 dark:text-blue-300">
                    Message will be sent on
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {format(scheduledDateTime, 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning for past dates */}
          {scheduledDateTime && scheduledDateTime <= now && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">
                Selected time is in the past. Please choose a future date and time.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSchedule}
            disabled={!canSchedule || (scheduledDateTime && scheduledDateTime <= now)}
            className="bg-[#25d366] hover:bg-[#20c55e] text-white"
          >
            <Timer className="h-4 w-4 mr-2" />
            Schedule Message
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};