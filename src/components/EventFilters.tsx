import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Tag, 
  MapPin, 
  Users,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { EventCategory, EventFilters, EventViewMode } from '@/types/events';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EventFiltersProps {
  categories: EventCategory[];
  filters: EventFilters;
  onFiltersChange: (filters: EventFilters) => void;
  viewMode: EventViewMode;
  onViewModeChange: (viewMode: EventViewMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  availableTags: string[];
  className?: string;
}

export const EventFiltersComponent = ({
  categories,
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  availableTags,
  className
}: EventFiltersProps) => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);

  const updateFilters = (newFilters: Partial<EventFilters>) => {
    onFiltersChange({ ...filters, ...newFilters });
  };

  const clearFilters = () => {
    onFiltersChange({});
    onSearchChange('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.categories?.length) count++;
    if (filters.dateRange) count++;
    if (filters.tags?.length) count++;
    if (filters.rsvpStatus) count++;
    if (filters.visibility) count++;
    if (filters.location) count++;
    if (searchQuery) count++;
    return count;
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Search Events</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by title, description, location..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Categories</label>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category.id}`}
                checked={filters.categories?.includes(category.id) || false}
                onCheckedChange={(checked) => {
                  const currentCategories = filters.categories || [];
                  if (checked) {
                    updateFilters({
                      categories: [...currentCategories, category.id]
                    });
                  } else {
                    updateFilters({
                      categories: currentCategories.filter(id => id !== category.id)
                    });
                  }
                }}
              />
              <label
                htmlFor={`category-${category.id}`}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: category.color }}
                />
                {category.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Date Range</label>
        <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !filters.dateRange && "text-muted-foreground"
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {filters.dateRange ? (
                `${format(filters.dateRange.start, "MMM d")} - ${format(filters.dateRange.end, "MMM d, yyyy")}`
              ) : (
                "Select date range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="range"
              selected={filters.dateRange}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  updateFilters({
                    dateRange: { start: range.from, end: range.to }
                  });
                  setDateRangeOpen(false);
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        {filters.dateRange && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateFilters({ dateRange: undefined })}
            className="w-full"
          >
            Clear Date Range
          </Button>
        )}
      </div>

      {/* Tags */}
      {availableTags.length > 0 && (
        <div className="space-y-3">
          <label className="text-sm font-medium">Tags</label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <Badge
                key={tag}
                variant={filters.tags?.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  const currentTags = filters.tags || [];
                  if (currentTags.includes(tag)) {
                    updateFilters({
                      tags: currentTags.filter(t => t !== tag)
                    });
                  } else {
                    updateFilters({
                      tags: [...currentTags, tag]
                    });
                  }
                }}
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* RSVP Status */}
      <div className="space-y-3">
        <label className="text-sm font-medium">My RSVP Status</label>
        <Select
          value={filters.rsvpStatus || 'all'}
          onValueChange={(value) => 
            updateFilters({ rsvpStatus: value === 'all' ? undefined : value as EventFilters['rsvpStatus'] })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by RSVP status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="going">Events I'm Going To</SelectItem>
            <SelectItem value="maybe">Events I'm Interested In</SelectItem>
            <SelectItem value="not_going">Events I'm Not Going To</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Visibility */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Event Visibility</label>
        <Select
          value={filters.visibility || 'all'}
          onValueChange={(value) => 
            updateFilters({ visibility: value === 'all' ? undefined : value as EventFilters['visibility'] })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="public">Public Events</SelectItem>
            <SelectItem value="members_only">Members Only</SelectItem>
            <SelectItem value="private">Private Events</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Location Filter */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Location</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Filter by location..."
            value={filters.location || ''}
            onChange={(e) => updateFilters({ location: e.target.value || undefined })}
            className="pl-10"
          />
        </div>
      </div>

      {/* Clear Filters */}
      {getActiveFilterCount() > 0 && (
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Clear All Filters ({getActiveFilterCount()})
        </Button>
      )}
    </div>
  );

  return (
    <div className={className}>
      {/* Desktop Filters */}
      <div className="hidden lg:block">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FilterContent />
          </CardContent>
        </Card>
      </div>

      {/* Mobile Filters */}
      <div className="lg:hidden">
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {getActiveFilterCount() > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Event Filters
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-medium">View:</span>
        <div className="flex gap-1">
          <Button
            variant={viewMode.type === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange({ type: 'calendar' })}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </Button>
          <Button
            variant={viewMode.type === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange({ type: 'list' })}
          >
            List
          </Button>
          <Button
            variant={viewMode.type === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange({ type: 'grid' })}
          >
            Grid
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.categories?.map((categoryId) => {
            const category = categories.find(c => c.id === categoryId);
            return category ? (
              <Badge
                key={categoryId}
                variant="secondary"
                className="flex items-center gap-1"
                style={{ backgroundColor: `${category.color}20`, color: category.color }}
              >
                {category.name}
                <button
                  onClick={() => {
                    updateFilters({
                      categories: filters.categories?.filter(id => id !== categoryId)
                    });
                  }}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null;
          })}
          
          {filters.dateRange && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(filters.dateRange.start, "MMM d")} - {format(filters.dateRange.end, "MMM d")}
              <button
                onClick={() => updateFilters({ dateRange: undefined })}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {tag}
              <button
                onClick={() => {
                  updateFilters({
                    tags: filters.tags?.filter(t => t !== tag)
                  });
                }}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {filters.rsvpStatus && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              RSVP: {filters.rsvpStatus.replace('_', ' ')}
              <button
                onClick={() => updateFilters({ rsvpStatus: undefined })}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.visibility && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Visibility: {filters.visibility.replace('_', ' ')}
              <button
                onClick={() => updateFilters({ visibility: undefined })}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.location && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Location: {filters.location}
              <button
                onClick={() => updateFilters({ location: undefined })}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};