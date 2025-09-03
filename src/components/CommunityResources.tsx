import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus,
  BookOpen,
  Search,
  Filter,
  Grid,
  List,
  AlertTriangle,
  RefreshCw,
  Lock,
  UserPlus,
  Loader2,
  FolderOpen,
  Shield
} from 'lucide-react';
import { ResourcesIcon } from '@/components/icons/ResourcesIcon';
import { ResourceCard } from '@/components/ResourceCard';
import { ResourceForm } from '@/components/ResourceForm';
import { ResourceSearchFilters } from '@/components/ResourceSearchFilters';
import { ResourceModerationPanel } from '@/components/ResourceModerationPanel';
import { useDebounce } from '@/hooks/useDebounce';

interface Resource {
  id: string;
  title: string;
  description: string;
  resource_type: 'article' | 'video' | 'document' | 'link' | 'tool' | 'service' | 'event' | 'course';
  content_url?: string;
  file_url?: string;
  location?: string;
  is_free: boolean;
  price_amount?: number;
  price_currency?: string;
  is_featured: boolean;
  view_count: number;
  click_count: number;
  created_at: string;
  user_id: string;
  category?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
  tags?: Array<{
    id: string;
    name: string;
  }>;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  average_rating?: number;
  rating_count?: number;
  user_rating?: number;
  is_bookmarked?: boolean;
}

interface ResourceFilters {
  search: string;
  categories: string[];
  tags: string[];
  resourceTypes: string[];
  location: string;
  isFree: boolean | null;
  minRating: number | null;
  sortBy: 'newest' | 'oldest' | 'rating' | 'popular' | 'alphabetical';
  featured: boolean | null;
}

interface CommunityResourcesProps {
  communityId: string;
  communityName: string;
  isMember: boolean;
  isCreator: boolean;
}

const defaultFilters: ResourceFilters = {
  search: '',
  categories: [],
  tags: [],
  resourceTypes: [],
  location: '',
  isFree: null,
  minRating: null,
  sortBy: 'newest',
  featured: null
};

export const CommunityResources = ({ 
  communityId, 
  communityName, 
  isMember, 
  isCreator 
}: CommunityResourcesProps) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ResourceFilters>(defaultFilters);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moderationPanelOpen, setModerationPanelOpen] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  // Debounce search to avoid too many API calls
  const debouncedSearch = useDebounce(filters.search, 300);

  // Fetch resources when filters change
  useEffect(() => {
    if (isMember) {
      setPage(1);
      setHasMore(true);
      fetchResources(true);
    }
  }, [communityId, isMember, debouncedSearch, filters.categories, filters.tags, filters.resourceTypes, filters.location, filters.isFree, filters.minRating, filters.sortBy, filters.featured]);

  const buildQuery = () => {
    let query = supabase
      .from('community_resources')
      .select(`
        *,
        category:resource_categories(id, name, color, icon),
        tags:resource_tag_assignments(
          tag:resource_tags(id, name)
        ),
        profiles!community_resources_user_id_fkey(display_name, avatar_url)
      `)
      .eq('community_id', communityId)
      .eq('is_approved', true);

    // Apply search filter
    if (debouncedSearch) {
      query = query.or(`title.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%`);
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      query = query.in('category_id', filters.categories);
    }

    // Apply resource type filter
    if (filters.resourceTypes.length > 0) {
      query = query.in('resource_type', filters.resourceTypes);
    }

    // Apply location filter
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    // Apply free/paid filter
    if (filters.isFree !== null) {
      query = query.eq('is_free', filters.isFree);
    }

    // Apply featured filter
    if (filters.featured !== null) {
      query = query.eq('is_featured', filters.featured);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'alphabetical':
        query = query.order('title', { ascending: true });
        break;
      case 'popular':
        query = query.order('view_count', { ascending: false });
        break;
      case 'rating':
        // Note: This would need a computed column or separate query for average rating
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    return query;
  };

  const fetchResources = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setResources([]);
      } else {
        setLoadingMore(true);
      }

      const itemsPerPage = 12;
      const from = reset ? 0 : (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = buildQuery();
      query = query.range(from, to);

      const { data: resourcesData, error } = await query;

      if (error) throw error;

      const processedResources = await Promise.all(
        (resourcesData || []).map(async (resource: any) => {
          // Get average rating and count
          const { data: ratingData } = await supabase
            .from('resource_ratings')
            .select('rating')
            .eq('resource_id', resource.id);

          const ratings = ratingData || [];
          const averageRating = ratings.length > 0 
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
            : undefined;

          // Check if user has bookmarked this resource
          let isBookmarked = false;
          if (user) {
            const { data: bookmarkData } = await supabase
              .from('resource_bookmarks')
              .select('id')
              .eq('resource_id', resource.id)
              .eq('user_id', user.id)
              .single();
            
            isBookmarked = !!bookmarkData;
          }

          // Process tags
          const tags = resource.tags
            ?.map((tagAssignment: any) => tagAssignment.tag)
            .filter(Boolean) || [];

          return {
            ...resource,
            category: resource.category || undefined,
            tags,
            average_rating: averageRating,
            rating_count: ratings.length,
            is_bookmarked: isBookmarked
          };
        })
      );

      // Filter by tags if specified (since we can't do this in the main query easily)
      let filteredResources = processedResources;
      if (filters.tags.length > 0) {
        filteredResources = processedResources.filter(resource =>
          resource.tags?.some((tag: any) => filters.tags.includes(tag.id))
        );
      }

      // Filter by minimum rating if specified
      if (filters.minRating !== null) {
        filteredResources = filteredResources.filter(resource =>
          resource.average_rating && resource.average_rating >= filters.minRating!
        );
      }

      if (reset) {
        setResources(filteredResources);
      } else {
        setResources(prev => [...prev, ...filteredResources]);
      }

      // Check if there are more items
      setHasMore(filteredResources.length === itemsPerPage);
      
      if (!reset) {
        setPage(prev => prev + 1);
      }

    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: "Error",
        description: "Failed to load resources. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleCreateResource = async (resourceData: any) => {
    if (!user) return;

    setSubmitting(true);
    try {
      const { data: resource, error } = await supabase
        .from('community_resources')
        .insert({
          ...resourceData,
          community_id: communityId,
          user_id: user.id
        })
        .select(`
          *,
          category:resource_categories(id, name, color, icon),
          profiles!community_resources_user_id_fkey(display_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Handle tags
      if (resourceData.tags && resourceData.tags.length > 0) {
        const tagAssignments = resourceData.tags.map((tagId: string) => ({
          resource_id: resource.id,
          tag_id: tagId
        }));

        await supabase
          .from('resource_tag_assignments')
          .insert(tagAssignments);
      }

      toast({
        title: "Success!",
        description: "Resource created successfully"
      });

      setCreateFormOpen(false);
      fetchResources(true);

    } catch (error: any) {
      console.error('Error creating resource:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create resource",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditResource = async (resourceData: any) => {
    if (!editingResource || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('community_resources')
        .update(resourceData)
        .eq('id', editingResource.id);

      if (error) throw error;

      // Update tags
      if (resourceData.tags !== undefined) {
        // Delete existing tag assignments
        await supabase
          .from('resource_tag_assignments')
          .delete()
          .eq('resource_id', editingResource.id);

        // Insert new tag assignments
        if (resourceData.tags.length > 0) {
          const tagAssignments = resourceData.tags.map((tagId: string) => ({
            resource_id: editingResource.id,
            tag_id: tagId
          }));

          await supabase
            .from('resource_tag_assignments')
            .insert(tagAssignments);
        }
      }

      toast({
        title: "Success!",
        description: "Resource updated successfully"
      });

      setEditingResource(null);
      fetchResources(true);

    } catch (error: any) {
      console.error('Error updating resource:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update resource",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('community_resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Resource deleted successfully"
      });

      setResources(prev => prev.filter(r => r.id !== resourceId));

    } catch (error: any) {
      console.error('Error deleting resource:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete resource",
        variant: "destructive"
      });
    }
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchResources();
    }
  };

  if (!isMember) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Join to access resources</h3>
          <p className="text-muted-foreground mb-6">
            Become a member to discover and share valuable resources with the community.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-blue-500/5 to-green-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ResourcesIcon className="w-5 h-5 text-blue-500" />
            Community Resources
          </CardTitle>
          <CardDescription>
            Discover, share, and organize valuable resources for your community. 
            Find articles, tools, services, and more curated by fellow members. 🔍
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <ResourceSearchFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={handleClearFilters}
            resultsCount={resources.length}
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Action Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCreateFormOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Resource
              </Button>
              <Button
                onClick={() => fetchResources(true)}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              {isCreator && (
                <Button
                  onClick={() => setModerationPanelOpen(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Moderation
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Resources Grid/List */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-5/6"></div>
                      <div className="h-8 bg-muted rounded mt-4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : resources.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No resources found</h3>
                <p className="text-muted-foreground mb-6">
                  {filters.search || filters.categories.length > 0 || filters.tags.length > 0
                    ? "Try adjusting your filters or search terms."
                    : "Be the first to share a valuable resource with your community!"
                  }
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setCreateFormOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Resource
                  </Button>
                  {(filters.search || filters.categories.length > 0 || filters.tags.length > 0) && (
                    <Button variant="outline" onClick={handleClearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {resources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    onEdit={setEditingResource}
                    onDelete={handleDeleteResource}
                    currentUserId={user?.id}
                    isCreator={isCreator}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center">
                  <Button
                    onClick={loadMore}
                    disabled={loadingMore}
                    variant="outline"
                    className="min-w-[120px]"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Resource Form */}
      <ResourceForm
        isOpen={createFormOpen || !!editingResource}
        onClose={() => {
          setCreateFormOpen(false);
          setEditingResource(null);
        }}
        onSubmit={editingResource ? handleEditResource : handleCreateResource}
        communityId={communityId}
        editingResource={editingResource}
        loading={submitting}
      />

      {/* Moderation Panel */}
      {isCreator && (
        <ResourceModerationPanel
          communityId={communityId}
          isOpen={moderationPanelOpen}
          onClose={() => setModerationPanelOpen(false)}
        />
      )}
    </div>
  );
};