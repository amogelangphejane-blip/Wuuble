import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Search,
  Filter,
  X,
  Star,
  Calendar,
  DollarSign,
  Tag,
  TrendingUp,
  Clock,
  Download,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductSearchFilters, ProductCategory } from '@/types/store';

interface AdvancedSearchFiltersProps {
  categories: ProductCategory[];
  filters: ProductSearchFilters;
  onFiltersChange: (filters: ProductSearchFilters) => void;
  onClearFilters: () => void;
  totalResults?: number;
  className?: string;
}

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Most Recent', icon: Clock },
  { value: 'price', label: 'Price: Low to High', icon: DollarSign },
  { value: 'rating', label: 'Customer Rating', icon: Star },
  { value: 'total_sales', label: 'Best Selling', icon: TrendingUp },
];

const PRICE_RANGES = [
  { label: 'Under $5', min: 0, max: 5 },
  { label: '$5 - $15', min: 5, max: 15 },
  { label: '$15 - $50', min: 15, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: 'Over $100', min: 100, max: undefined },
];

export const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  categories,
  filters,
  onFiltersChange,
  onClearFilters,
  totalResults,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customPriceRange, setCustomPriceRange] = useState([
    filters.min_price || 0,
    filters.max_price || 1000
  ]);
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags || []);

  const handleFilterChange = (key: keyof ProductSearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
      page: 1 // Reset to first page when filters change
    });
  };

  const handlePriceRangeChange = (range: { min?: number; max?: number }) => {
    onFiltersChange({
      ...filters,
      min_price: range.min,
      max_price: range.max,
      page: 1
    });
  };

  const handleCustomPriceChange = (values: number[]) => {
    setCustomPriceRange(values);
    onFiltersChange({
      ...filters,
      min_price: values[0] > 0 ? values[0] : undefined,
      max_price: values[1] < 1000 ? values[1] : undefined,
      page: 1
    });
  };

  const addTag = () => {
    if (!tagInput.trim() || selectedTags.includes(tagInput.trim())) return;
    
    const newTags = [...selectedTags, tagInput.trim()];
    setSelectedTags(newTags);
    handleFilterChange('tags', newTags);
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(newTags);
    handleFilterChange('tags', newTags);
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.query) count++;
    if (filters.category_id) count++;
    if (filters.min_price || filters.max_price) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    if (filters.featured_only) count++;
    return count;
  };

  const hasActiveFilters = getActiveFiltersCount() > 0;

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-gray-500" />
            <CardTitle className="text-lg">Search & Filters</CardTitle>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {totalResults !== undefined && (
              <span className="text-sm text-gray-600">
                {totalResults.toLocaleString()} results
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search Query */}
        <div className="space-y-2">
          <Label>Search Products</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={filters.query || ''}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              placeholder="Search by title, description, or tags..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Sort Options */}
        <div className="space-y-2">
          <Label>Sort By</Label>
          <Select
            value={filters.sort_by || 'created_at'}
            onValueChange={(value) => handleFilterChange('sort_by', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => {
                const IconComponent = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {isExpanded && (
          <>
            <Separator />

            {/* Category Filter */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={filters.category_id || 'all'}
                onValueChange={(value) => handleFilterChange('category_id', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
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
            </div>

            {/* Price Range */}
            <div className="space-y-4">
              <Label>Price Range</Label>
              
              {/* Quick Price Ranges */}
              <div className="grid grid-cols-2 gap-2">
                {PRICE_RANGES.map((range, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left h-auto py-2",
                      filters.min_price === range.min && filters.max_price === range.max
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "hover:bg-gray-50"
                    )}
                    onClick={() => handlePriceRangeChange({ min: range.min, max: range.max })}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>

              {/* Custom Price Range Slider */}
              <div className="space-y-3">
                <Label className="text-sm text-gray-600">Custom Range</Label>
                <div className="px-3">
                  <Slider
                    value={customPriceRange}
                    onValueChange={handleCustomPriceChange}
                    max={1000}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>${customPriceRange[0]}</span>
                  <span>${customPriceRange[1] >= 1000 ? '1000+' : customPriceRange[1]}</span>
                </div>
              </div>
            </div>

            {/* Tags Filter */}
            <div className="space-y-3">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagInputKeyPress}
                    placeholder="Add tag filter..."
                    className="pl-10"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                >
                  Add
                </Button>
              </div>
              
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 hover:bg-transparent"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Featured Products Only */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured-only"
                checked={filters.featured_only || false}
                onCheckedChange={(checked) => handleFilterChange('featured_only', checked)}
              />
              <Label htmlFor="featured-only" className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                Featured products only
              </Label>
            </div>

            <Separator />

            {/* Filter Actions */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                disabled={!hasActiveFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
              
              <div className="text-sm text-gray-600">
                {hasActiveFilters ? `${getActiveFiltersCount()} filters applied` : 'No filters applied'}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};