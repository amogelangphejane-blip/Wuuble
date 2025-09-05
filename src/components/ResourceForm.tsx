import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus,
  X,
  Upload,
  Link as LinkIcon,
  MapPin,
  DollarSign,
  Tag,
  Save,
  FileText,
  Video,
  Wrench,
  Calendar,
  GraduationCap,
  Globe
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Tag {
  id: string;
  name: string;
}

interface Resource {
  id?: string;
  title: string;
  description: string;
  resource_type: 'article' | 'video' | 'document' | 'link' | 'tool' | 'service' | 'event' | 'course';
  content_url?: string;
  file_url?: string;
  category_id?: string;
  location?: string;
  is_free: boolean;
  price_amount?: number;
  price_currency: string;
  tags?: string[];
}

interface ResourceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (resource: Resource) => void;
  communityId: string;
  editingResource?: Resource | null;
  loading?: boolean;
}

const resourceTypes = [
  { value: 'article', label: 'Article', icon: FileText, description: 'Blog posts, guides, and written content' },
  { value: 'video', label: 'Video', icon: Video, description: 'Video tutorials, webinars, and recordings' },
  { value: 'document', label: 'Document', icon: FileText, description: 'PDFs, presentations, and files' },
  { value: 'link', label: 'Link', icon: LinkIcon, description: 'External websites and web resources' },
  { value: 'tool', label: 'Tool', icon: Wrench, description: 'Software tools and applications' },
  { value: 'service', label: 'Service', icon: Globe, description: 'Professional services and consultations' },
  { value: 'event', label: 'Event', icon: Calendar, description: 'Workshops, meetups, and activities' },
  { value: 'course', label: 'Course', icon: GraduationCap, description: 'Educational courses and training' }
];

const currencies = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD ($)' },
  { value: 'AUD', label: 'AUD ($)' }
];

export const ResourceForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  communityId, 
  editingResource,
  loading = false 
}: ResourceFormProps) => {
  console.log('ResourceForm render:', { isOpen, editingResource, communityId });
  const [formData, setFormData] = useState<Resource>({
    title: '',
    description: '',
    resource_type: 'article',
    content_url: '',
    category_id: '',
    location: '',
    is_free: true,
    price_amount: undefined,
    price_currency: 'USD',
    tags: []
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoadingData, setIsLoadingData] = useState(true);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchCategoriesAndTags();
      if (editingResource) {
        setFormData({
          ...editingResource,
          tags: editingResource.tags || []
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingResource]);

  const fetchCategoriesAndTags = async () => {
    try {
      const [categoriesResult, tagsResult] = await Promise.all([
        supabase
          .from('resource_categories')
          .select('id, name, icon, color')
          .order('name'),
        supabase
          .from('resource_tags')
          .select('id, name')
          .order('name')
      ]);

      if (categoriesResult.data) {
        setCategories(categoriesResult.data);
      }
      if (tagsResult.data) {
        setAvailableTags(tagsResult.data);
      }
    } catch (error) {
      console.error('Error fetching categories and tags:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      resource_type: 'article',
      content_url: '',
      category_id: '',
      location: '',
      is_free: true,
      price_amount: undefined,
      price_currency: 'USD',
      tags: []
    });
    setErrors({});
    setNewTagInput('');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Title must be less than 255 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters';
    }

    if (!formData.content_url?.trim() && !formData.file_url?.trim()) {
      newErrors.content_url = 'Either a URL or file upload is required';
    }

    if (formData.content_url && !isValidUrl(formData.content_url)) {
      newErrors.content_url = 'Please enter a valid URL';
    }

    if (!formData.is_free) {
      if (!formData.price_amount || formData.price_amount <= 0) {
        newErrors.price_amount = 'Price must be greater than 0 for paid resources';
      }
    }

    if (formData.location && formData.location.length > 255) {
      newErrors.location = 'Location must be less than 255 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Clean up form data
    const cleanFormData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      content_url: formData.content_url?.trim() || undefined,
      location: formData.location?.trim() || undefined,
      category_id: formData.category_id || undefined,
      price_amount: formData.is_free ? undefined : formData.price_amount
    };

    onSubmit(cleanFormData);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const updateFormData = <K extends keyof Resource>(key: K, value: Resource[K]) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({
        ...prev,
        [key]: ''
      }));
    }
  };

  const addTag = async () => {
    const tagName = newTagInput.trim().toLowerCase();
    if (!tagName) return;

    // Check if tag already exists
    let existingTag = availableTags.find(tag => tag.name.toLowerCase() === tagName);
    
    if (!existingTag) {
      try {
        // Create new tag
        const { data: newTag, error } = await supabase
          .from('resource_tags')
          .insert({ name: tagName })
          .select()
          .single();

        if (error) throw error;
        
        existingTag = newTag;
        setAvailableTags(prev => [...prev, newTag]);
      } catch (error) {
        console.error('Error creating tag:', error);
        toast({
          title: "Error",
          description: "Failed to create tag",
          variant: "destructive"
        });
        return;
      }
    }

    // Add tag to form if not already added
    if (!formData.tags?.includes(existingTag.id)) {
      updateFormData('tags', [...(formData.tags || []), existingTag.id]);
    }
    
    setNewTagInput('');
  };

  const removeTag = (tagId: string) => {
    updateFormData('tags', formData.tags?.filter(id => id !== tagId) || []);
  };

  const selectedResourceType = resourceTypes.find(type => type.value === formData.resource_type);

  if (isLoadingData) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl">
          <div className="animate-pulse space-y-4 p-6">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="space-y-3">
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-20 bg-muted rounded"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {editingResource ? 'Edit Resource' : 'Add New Resource'}
          </DialogTitle>
          <DialogDescription>
            Share a valuable resource with your community members
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateFormData('title', e.target.value)}
              placeholder="Enter a descriptive title..."
              className={errors.title ? 'border-destructive' : ''}
              maxLength={255}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
            <p className="text-xs text-muted-foreground text-right">
              {formData.title.length}/255
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Provide a detailed description of this resource..."
              className={`min-h-[100px] resize-none ${errors.description ? 'border-destructive' : ''}`}
              maxLength={2000}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
            <p className="text-xs text-muted-foreground text-right">
              {formData.description.length}/2000
            </p>
          </div>

          {/* Resource Type */}
          <div className="space-y-3">
            <Label>Resource Type *</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {resourceTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.resource_type === type.value;
                return (
                  <div
                    key={type.value}
                    onClick={() => updateFormData('resource_type', type.value as any)}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all hover:border-primary/50 ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <p className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {type.label}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="content_url">
              Resource URL *
              <span className="text-muted-foreground ml-1">(Link to the resource)</span>
            </Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="content_url"
                type="url"
                value={formData.content_url || ''}
                onChange={(e) => updateFormData('content_url', e.target.value)}
                placeholder="https://example.com/resource"
                className={`pl-10 ${errors.content_url ? 'border-destructive' : ''}`}
              />
            </div>
            {errors.content_url && (
              <p className="text-sm text-destructive">{errors.content_url}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={formData.category_id || ''}
              onChange={(e) => updateFormData('category_id', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a category...</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">
              Location
              <span className="text-muted-foreground ml-1">(Optional, for location-based resources)</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => updateFormData('location', e.target.value)}
                placeholder="City, State or specific location"
                className={`pl-10 ${errors.location ? 'border-destructive' : ''}`}
                maxLength={255}
              />
            </div>
            {errors.location && (
              <p className="text-sm text-destructive">{errors.location}</p>
            )}
          </div>

          {/* Pricing */}
          <div className="space-y-3">
            <Label>Pricing</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_free"
                  checked={formData.is_free}
                  onCheckedChange={(checked) => updateFormData('is_free', checked as boolean)}
                />
                <Label htmlFor="is_free" className="cursor-pointer">
                  This resource is free
                </Label>
              </div>

              {!formData.is_free && (
                <div className="flex gap-3">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="price_amount">Price *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="price_amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price_amount || ''}
                        onChange={(e) => updateFormData('price_amount', parseFloat(e.target.value) || undefined)}
                        placeholder="0.00"
                        className={`pl-10 ${errors.price_amount ? 'border-destructive' : ''}`}
                      />
                    </div>
                    {errors.price_amount && (
                      <p className="text-sm text-destructive">{errors.price_amount}</p>
                    )}
                  </div>

                  <div className="w-32 space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <select
                      id="currency"
                      value={formData.price_currency}
                      onChange={(e) => updateFormData('price_currency', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {currencies.map((currency) => (
                        <option key={currency.value} value={currency.value}>
                          {currency.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label>Tags</Label>
            <div className="space-y-3">
              {/* Selected Tags */}
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tagId) => {
                    const tag = availableTags.find(t => t.id === tagId);
                    return tag ? (
                      <Badge key={tagId} variant="secondary" className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {tag.name}
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-destructive" 
                          onClick={() => removeTag(tagId)}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}

              {/* Add New Tag */}
              <div className="flex gap-2">
                <Input
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={addTag}
                  disabled={!newTagInput.trim()}
                  variant="outline"
                >
                  Add
                </Button>
              </div>

              {/* Popular Tags */}
              {availableTags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Popular tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.slice(0, 10).map((tag) => (
                      <Button
                        key={tag.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!formData.tags?.includes(tag.id)) {
                            updateFormData('tags', [...(formData.tags || []), tag.id]);
                          }
                        }}
                        disabled={formData.tags?.includes(tag.id)}
                        className="h-7 text-xs"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingResource ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingResource ? 'Update Resource' : 'Create Resource'}
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};