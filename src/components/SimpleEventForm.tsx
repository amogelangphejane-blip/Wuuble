import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Calendar, Clock, MapPin, X } from 'lucide-react';
import { format } from 'date-fns';

interface SimpleEventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: EventFormData) => Promise<void>;
  selectedDate?: Date | null;
  loading?: boolean;
}

export interface EventFormData {
  title: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  isVirtual: boolean;
}

export const SimpleEventForm: React.FC<SimpleEventFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedDate,
  loading = false,
}) => {
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    eventDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    startTime: '',
    endTime: '',
    location: '',
    isVirtual: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter an event title');
      return;
    }
    
    if (!formData.eventDate) {
      alert('Please select an event date');
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        title: '',
        description: '',
        eventDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        startTime: '',
        endTime: '',
        location: '',
        isVirtual: false,
      });
      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleInputChange = (field: keyof EventFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Create New Event
          </DialogTitle>
          <DialogDescription>
            Add a new event to your community calendar
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">Event Title *</label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter event title"
              required
            />
          </div>

          {/* Event Date */}
          <div className="space-y-2">
            <label htmlFor="eventDate" className="text-sm font-medium">Date *</label>
            <Input
              id="eventDate"
              type="date"
              value={formData.eventDate}
              onChange={(e) => handleInputChange('eventDate', e.target.value)}
              required
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label htmlFor="startTime" className="text-sm font-medium">Start Time</label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="endTime" className="text-sm font-medium">End Time</label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
              />
            </div>
          </div>

          {/* Virtual Event Toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <label htmlFor="isVirtual" className="text-sm font-medium">Virtual Event</label>
              <p className="text-sm text-gray-500">This event will be held online</p>
            </div>
            <Switch
              id="isVirtual"
              checked={formData.isVirtual}
              onCheckedChange={(checked) => handleInputChange('isVirtual', checked)}
            />
          </div>

          {/* Location */}
          {!formData.isVirtual && (
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">Location</label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter event location"
              />
            </div>
          )}

          {formData.isVirtual && (
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">Meeting Link (Optional)</label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Zoom link, Google Meet, etc."
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Add event details..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};