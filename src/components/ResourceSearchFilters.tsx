import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search,
  Filter,
  X,
  MapPin,
  DollarSign,
  Star,
  Calendar,
  Tag,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

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

interface ResourceSearchFiltersProps {
  filters: ResourceFilters;
  onFiltersChange: (filters: ResourceFilters) => void;
  onClearFilters: () => void;
  resultsCount?: number;
}

const resourceTypes = [
  { value: 'article', label: 'Articles' },
  { value: 'video', label: 'Videos' },
  { value: 'document', label: 'Documents' },
  { value: 'link', label: 'Links' },
  { value: 'tool', label: 'Tools' },
  { value: 'service', label: 'Services' },
  { value: 'event', label: 'Events' },
  { value: 'course', label: 'Courses' }
];

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'alphabetical', label: 'Alphabetical' }
];

export const ResourceSearchFilters = ({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  resultsCount 
}: ResourceSearchFiltersProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoriesAndTags();
  }, []);

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
          .limit(50)
      ]);

      if (categoriesResult.data) {
        setCategories(categoriesResult.data);
      }
      if (tagsResult.data) {
        setTags(tagsResult.data);
      }
    } catch (error) {
      console.error('Error fetching categories and tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = <K extends keyof ResourceFilters>(
    key: K, 
    value: ResourceFilters[K]
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const toggleArrayFilter = <K extends keyof ResourceFilters>(
    key: K,
    value: string,
    currentArray: string[]
  ) => {
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    updateFilter(key, newArray as ResourceFilters[K]);
  };

  const hasActiveFilters = () => {
    return (
      filters.search ||
      filters.categories.length > 0 ||
      filters.tags.length > 0 ||
      filters.resourceTypes.length > 0 ||
      filters.location ||
      filters.isFree !== null ||
      filters.minRating !== null ||
      filters.featured !== null ||
      filters.sortBy !== 'newest'
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.categories.length > 0) count++;
    if (filters.tags.length > 0) count++;
    if (filters.resourceTypes.length > 0) count++;
    if (filters.location) count++;
    if (filters.isFree !== null) count++;
    if (filters.minRating !== null) count++;
    if (filters.featured !== null) count++;
    if (filters.sortBy !== 'newest') count++;
    return count;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search & Filter
            {hasActiveFilters() && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFilterCount()} active
              </Badge>
            )}
          </CardTitle>
          {hasActiveFilters() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              Clear all
            </Button>
          )}
        </div>
        {resultsCount !== undefined && (
          <p className="text-sm text-muted-foreground">
            {resultsCount} {resultsCount === 1 ? 'resource' : 'resources'} found
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search Bar */}
        <div className="space-y-2">
          <Label htmlFor="search">Search resources</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by title, description, or keywords..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Sort Options */}
        <div className="space-y-2">
          <Label htmlFor="sort">Sort by</Label>
          <select
            id="sort"
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value as any)}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Filters */}
        <div className="space-y-3">
          <Label>Quick filters</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filters.isFree === true ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter('isFree', filters.isFree === true ? null : true)}
            >
              <DollarSign className="w-4 h-4 mr-1" />
              Free only
            </Button>
            <Button
              variant={filters.featured === true ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter('featured', filters.featured === true ? null : true)}
            >
              <Star className="w-4 h-4 mr-1" />
              Featured
            </Button>
            <Button
              variant={filters.minRating === 4 ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter('minRating', filters.minRating === 4 ? null : 4)}
            >
              <Star className="w-4 h-4 mr-1" />
              4+ stars
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Advanced Filters
              </span>
              {isAdvancedOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-6 mt-4">
            {/* Categories */}
            <div className="space-y-3">
              <Label>Categories</Label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={filters.categories.includes(category.id)}
                      onCheckedChange={() => 
                        toggleArrayFilter('categories', category.id, filters.categories)
                      }
                    />
                    <Label 
                      htmlFor={`category-${category.id}`}
                      className="text-sm cursor-pointer flex items-center gap-2"
                    >
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Resource Types */}
            <div className="space-y-3">
              <Label>Resource types</Label>
              <div className="grid grid-cols-2 gap-2">
                {resourceTypes.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type.value}`}
                      checked={filters.resourceTypes.includes(type.value)}
                      onCheckedChange={() => 
                        toggleArrayFilter('resourceTypes', type.value, filters.resourceTypes)
                      }
                    />
                    <Label 
                      htmlFor={`type-${type.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Tags */}
            {tags.length > 0 && (
              <div className="space-y-3">
                <Label>Popular tags</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.slice(0, 20).map((tag) => (
                    <Button
                      key={tag.id}
                      variant={filters.tags.includes(tag.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleArrayFilter('tags', tag.id, filters.tags)}
                      className="h-7 text-xs"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder="Filter by location..."
                  value={filters.location}
                  onChange={(e) => updateFilter('location', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Minimum Rating */}
            <div className="space-y-3">
              <Label>Minimum rating</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    variant={filters.minRating === rating ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateFilter('minRating', filters.minRating === rating ? null : rating)}
                    className="flex items-center gap-1"
                  >
                    <Star className="w-4 h-4" />
                    {rating}+
                  </Button>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Active Filters Display */}
        {hasActiveFilters() && (
          <div className="space-y-2">
            <Label>Active filters</Label>
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: {filters.search.substring(0, 20)}
                  {filters.search.length > 20 && '...'}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => updateFilter('search', '')}
                  />
                </Badge>
              )}
              
              {filters.categories.map((categoryId) => {
                const category = categories.find(c => c.id === categoryId);
                return category ? (
                  <Badge key={categoryId} variant="secondary" className="flex items-center gap-1">
                    {category.name}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => toggleArrayFilter('categories', categoryId, filters.categories)}
                    />
                  </Badge>
                ) : null;
              })}

              {filters.resourceTypes.map((type) => {
                const typeLabel = resourceTypes.find(t => t.value === type)?.label;
                return typeLabel ? (
                  <Badge key={type} variant="secondary" className="flex items-center gap-1">
                    {typeLabel}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => toggleArrayFilter('resourceTypes', type, filters.resourceTypes)}
                    />
                  </Badge>
                ) : null;
              })}

              {filters.isFree === true && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Free only
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => updateFilter('isFree', null)}
                  />
                </Badge>
              )}

              {filters.featured === true && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Featured
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => updateFilter('featured', null)}
                  />
                </Badge>
              )}

              {filters.minRating && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {filters.minRating}+ stars
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => updateFilter('minRating', null)}
                  />
                </Badge>
              )}

              {filters.location && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Location: {filters.location}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => updateFilter('location', '')}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};