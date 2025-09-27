import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Calendar, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EventCreationFixProps {
  communityId: string;
  onEventCreated?: () => void;
  className?: string;
}

export const EventCreationFix = ({ 
  communityId, 
  onEventCreated,
  className 
}: EventCreationFixProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    location: '',
    isVirtual: false,
    maxAttendees: ''
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleOpenDialog = () => {
    console.log('🎯 Event Creation: Opening dialog...');
    setIsOpen(true);
  };

  const handleCloseDialog = () => {
    console.log('🎯 Event Creation: Closing dialog...');
    setIsOpen(false);
    // Reset form
    setFormData({
      title: '',
      description: '',
      eventDate: '',
      startTime: '',
      endTime: '',
      location: '',
      isVirtual: false,
      maxAttendees: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create events.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter an event title.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.eventDate) {
      toast({
        title: "Date Required", 
        description: "Please select an event date.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('🎯 Event Creation: Submitting event...', formData);

      const { error } = await supabase
        .from('community_events')
        .insert({
          community_id: communityId,
          user_id: user.id,
          title: formData.title,
          description: formData.description || null,
          event_date: formData.eventDate,
          start_time: formData.startTime || null,
          end_time: formData.endTime || null,
          location: formData.location || null,
          is_virtual: formData.isVirtual,
          max_attendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
        });

      if (error) {
        console.error('🎯 Event Creation Error:', error);
        toast({
          title: "Error Creating Event",
          description: error.message || "Failed to create event. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('🎯 Event Creation: Success!');
      toast({
        title: "Success",
        description: "Event created successfully!",
      });

      handleCloseDialog();
      onEventCreated?.();
    } catch (error: any) {
      console.error('🎯 Event Creation Unexpected Error:', error);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={className}>
      {/* Create Event Button */}
      <Button 
        onClick={handleOpenDialog}
        className="bg-blue-600 hover:bg-blue-700 text-white"
        disabled={!user || !communityId}
      >
        <Plus className="w-4 h-4 mr-2" />
        Create Event
      </Button>

      {/* Simple Event Form Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Create New Event
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter event title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your event..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eventDate">Event Date *</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="maxAttendees">Max Attendees</Label>
                <Input
                  id="maxAttendees"
                  type="number"
                  value={formData.maxAttendees}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxAttendees: e.target.value }))}
                  placeholder="No limit"
                  min="1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter event location or meeting link"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isVirtual"
                checked={formData.isVirtual}
                onChange={(e) => setFormData(prev => ({ ...prev, isVirtual: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="isVirtual">This is a virtual event</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCloseDialog}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !formData.title.trim() || !formData.eventDate}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Event
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};