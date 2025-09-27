import { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Star,
  Copy,
  Edit,
  Trash,
  Calendar,
  Clock,
  MapPin,
  Users,
  Tag,
  Globe,
  Lock,
  MoreVertical,
  Save,
  FolderOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { EventCategory, EventFormData } from '@/types/events';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface EventTemplate {
  id: string;
  name: string;
  description: string;
  category_id?: string;
  template_data: Partial<EventFormData>;
  is_public: boolean;
  is_default: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  tags: string[];
  thumbnail_url?: string;
  creator_name: string;
}

interface EventTemplateManagerProps {
  templates: EventTemplate[];
  categories: EventCategory[];
  onCreateTemplate: (template: Omit<EventTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count' | 'creator_name'>) => Promise<boolean>;
  onUpdateTemplate: (id: string, template: Partial<EventTemplate>) => Promise<boolean>;
  onDeleteTemplate: (id: string) => Promise<boolean>;
  onUseTemplate: (template: EventTemplate) => void;
  userCanManageTemplates: boolean;
  className?: string;
}

export const EventTemplateManager = ({
  templates,
  categories,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onUseTemplate,
  userCanManageTemplates,
  className
}: EventTemplateManagerProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'recent'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EventTemplate | null>(null);

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category_id: '',
    is_public: false,
    is_default: false,
    tags: [] as string[],
    template_data: {} as Partial<EventFormData>
  });

  const [newTag, setNewTag] = useState('');

  const filteredTemplates = templates
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || template.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'usage':
          return b.usage_count - a.usage_count;
        case 'recent':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        default:
          return 0;
      }
    });

  const handleCreateTemplate = async () => {
    if (!templateForm.name.trim()) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive",
      });
      return;
    }

    const success = await onCreateTemplate({
      name: templateForm.name,
      description: templateForm.description,
      category_id: templateForm.category_id || undefined,
      template_data: templateForm.template_data,
      is_public: templateForm.is_public,
      is_default: templateForm.is_default,
      tags: templateForm.tags,
      created_by: 'current-user-id', // In real app, get from auth context
    });

    if (success) {
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "Success",
        description: "Template created successfully",
      });
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;

    const success = await onUpdateTemplate(editingTemplate.id, {
      name: templateForm.name,
      description: templateForm.description,
      category_id: templateForm.category_id || undefined,
      template_data: templateForm.template_data,
      is_public: templateForm.is_public,
      is_default: templateForm.is_default,
      tags: templateForm.tags,
    });

    if (success) {
      setEditingTemplate(null);
      resetForm();
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
    }
  };

  const resetForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      category_id: '',
      is_public: false,
      is_default: false,
      tags: [],
      template_data: {}
    });
    setNewTag('');
  };

  const addTag = () => {
    if (newTag.trim() && !templateForm.tags.includes(newTag.trim())) {
      setTemplateForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTemplateForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const loadTemplateForEditing = (template: EventTemplate) => {
    setTemplateForm({
      name: template.name,
      description: template.description,
      category_id: template.category_id || '',
      is_public: template.is_public,
      is_default: template.is_default,
      tags: template.tags,
      template_data: template.template_data
    });
    setEditingTemplate(template);
  };

  const getVisibilityIcon = (template: EventTemplate) => {
    if (template.is_public) return <Globe className="h-4 w-4 text-green-600" />;
    return <Lock className="h-4 w-4 text-gray-600" />;
  };

  const getTemplatePreview = (templateData: Partial<EventFormData>) => {
    const items = [];
    if (templateData.isVirtual !== undefined) {
      items.push(templateData.isVirtual ? 'Virtual' : 'In-Person');
    }
    if (templateData.maxAttendees) {
      items.push(`${templateData.maxAttendees} max attendees`);
    }
    if (templateData.visibility) {
      items.push(templateData.visibility.replace('_', ' '));
    }
    if (templateData.recurringType && templateData.recurringType !== 'none') {
      items.push(`${templateData.recurringType} recurring`);
    }
    return items.slice(0, 3).join(' • ');
  };

  const getPopularTags = () => {
    const tagCounts = templates.flatMap(t => t.tags).reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([tag]) => tag);
  };

  const defaultTemplates = templates.filter(t => t.is_default);
  const myTemplates = templates.filter(t => t.created_by === 'current-user-id');
  const publicTemplates = templates.filter(t => t.is_public && t.created_by !== 'current-user-id');

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Event Templates</h2>
            <p className="text-gray-600">Reuse event configurations to save time</p>
          </div>
          {userCanManageTemplates && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
                  <p className="text-sm text-gray-600">Total Templates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Star className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{defaultTemplates.length}</p>
                  <p className="text-sm text-gray-600">Default Templates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FolderOpen className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{myTemplates.length}</p>
                  <p className="text-sm text-gray-600">My Templates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Globe className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{publicTemplates.length}</p>
                  <p className="text-sm text-gray-600">Public Templates</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="usage">Most Used</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-1 border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </div>
        </div>

        {/* Popular Tags */}
        {getPopularTags().length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Popular Tags</h3>
            <div className="flex flex-wrap gap-2">
              {getPopularTags().map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => setSearchQuery(tag)}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Templates Grid/List */}
        <div className={cn(
          "grid gap-4",
          viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {filteredTemplates.map((template) => {
            const category = categories.find(c => c.id === template.category_id);
            
            return (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{template.name}</h3>
                        {template.is_default && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                        {getVisibilityIcon(template)}
                      </div>
                      {category && (
                        <Badge 
                          variant="outline"
                          style={{ borderColor: category.color, color: category.color }}
                        >
                          {category.name}
                        </Badge>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onUseTemplate(template)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Use Template
                        </DropdownMenuItem>
                        {userCanManageTemplates && template.created_by === 'current-user-id' && (
                          <>
                            <DropdownMenuItem onClick={() => loadTemplateForEditing(template)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onDeleteTemplate(template.id)}
                              className="text-red-600"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {template.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">{template.description}</p>
                  )}
                  
                  {getTemplatePreview(template.template_data) && (
                    <p className="text-xs text-gray-500">{getTemplatePreview(template.template_data)}</p>
                  )}
                  
                  {template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{template.usage_count} uses</span>
                      <span>by {template.creator_name}</span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => onUseTemplate(template)}
                      className="flex items-center gap-1"
                    >
                      <Copy className="h-4 w-4" />
                      Use
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Templates Found</h3>
              <p className="text-gray-600 text-center">
                {searchQuery || selectedCategory !== 'all' ? 
                  'No templates match your current filters.' : 
                  'Create your first template to get started.'}
              </p>
              {userCanManageTemplates && (
                <Button 
                  className="mt-4" 
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Template Dialog */}
        <Dialog 
          open={showCreateDialog || editingTemplate !== null} 
          onOpenChange={(open) => {
            if (!open) {
              setShowCreateDialog(false);
              setEditingTemplate(null);
              resetForm();
            }
          }}
        >
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name *</Label>
                <Input
                  id="template-name"
                  placeholder="e.g., Weekly Team Meeting"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  placeholder="Describe what this template is for..."
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-category">Category</Label>
                <Select 
                  value={templateForm.category_id} 
                  onValueChange={(value) => setTemplateForm(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {templateForm.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        ×
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
                    Add
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Public Template</Label>
                    <p className="text-sm text-gray-600">Allow others to use this template</p>
                  </div>
                  <Switch
                    checked={templateForm.is_public}
                    onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, is_public: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Default Template</Label>
                    <p className="text-sm text-gray-600">Show in recommended templates</p>
                  </div>
                  <Switch
                    checked={templateForm.is_default}
                    onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, is_default: checked }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateDialog(false);
                    setEditingTemplate(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingTemplate ? 'Update' : 'Create'} Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};