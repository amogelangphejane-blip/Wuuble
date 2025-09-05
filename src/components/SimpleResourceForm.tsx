import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Save } from 'lucide-react';

interface SimpleResourceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (resource: any) => void;
  communityId: string;
  loading?: boolean;
}

const resourceTypes = [
  { value: 'article', label: 'Article' },
  { value: 'video', label: 'Video' },
  { value: 'document', label: 'Document' },
  { value: 'link', label: 'Link' },
  { value: 'tool', label: 'Tool' },
  { value: 'service', label: 'Service' },
  { value: 'event', label: 'Event' },
  { value: 'course', label: 'Course' }
];

export const SimpleResourceForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  communityId, 
  loading = false 
}: SimpleResourceFormProps) => {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    resource_type: 'article',
    content_url: '',
    is_free: true,
  });

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      resource_type: 'article',
      content_url: '',
      is_free: true,
    });
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for the resource",
        variant: "destructive"
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Error", 
        description: "Please enter a description for the resource",
        variant: "destructive"
      });
      return;
    }

    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('Error submitting resource:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Resource
          </DialogTitle>
          <DialogDescription>
            Share a valuable resource with your community members.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter resource title"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this resource is about and why it's valuable"
              rows={4}
              required
            />
          </div>

          {/* Resource Type */}
          <div className="space-y-2">
            <Label htmlFor="resource_type">Resource Type</Label>
            <Select
              value={formData.resource_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, resource_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select resource type" />
              </SelectTrigger>
              <SelectContent>
                {resourceTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content URL */}
          <div className="space-y-2">
            <Label htmlFor="content_url">URL (optional)</Label>
            <Input
              id="content_url"
              type="url"
              value={formData.content_url}
              onChange={(e) => setFormData(prev => ({ ...prev, content_url: e.target.value }))}
              placeholder="https://example.com"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Resource
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};