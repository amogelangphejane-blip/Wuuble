import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  X, 
  Users, 
  Crown, 
  Shield, 
  Clock, 
  Calendar,
  Activity,
  Award,
  SlidersHorizontal
} from 'lucide-react';
import { MemberFilter, MemberBadge } from '@/types/members';

interface MemberFiltersProps {
  filters: MemberFilter;
  onFiltersChange: (filters: MemberFilter) => void;
  availableBadges?: MemberBadge[];
  memberCount?: number;
  className?: string;
}

const MemberFilters: React.FC<MemberFiltersProps> = ({
  filters,
  onFiltersChange,
  availableBadges = [],
  memberCount = 0,
  className = ''
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: keyof MemberFilter, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      role: 'all',
      status: 'all',
      joined: 'all',
      badges: []
    });
  };

  const hasActiveFilters = () => {
    return filters.search !== '' ||
           filters.role !== 'all' ||
           filters.status !== 'all' ||
           filters.joined !== 'all' ||
           filters.badges.length > 0;
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.role !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.joined !== 'all') count++;
    if (filters.badges.length > 0) count++;
    return count;
  };

  const toggleBadgeFilter = (badgeId: string) => {
    const currentBadges = filters.badges || [];
    const newBadges = currentBadges.includes(badgeId)
      ? currentBadges.filter(id => id !== badgeId)
      : [...currentBadges, badgeId];
    
    updateFilter('badges', newBadges);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search members by name or bio..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-10 pr-10"
        />
        {filters.search && (
          <button
            onClick={() => updateFilter('search', '')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Role Filter */}
        <Select value={filters.role} onValueChange={(value) => updateFilter('role', value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                All Roles
              </div>
            </SelectItem>
            <SelectItem value="creator">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                Creator
              </div>
            </SelectItem>
            <SelectItem value="moderator">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                Moderators
              </div>
            </SelectItem>
            <SelectItem value="member">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                Members
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="online">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Online
              </div>
            </SelectItem>
            <SelectItem value="recently_active">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                Recently Active
              </div>
            </SelectItem>
            <SelectItem value="offline">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                Offline
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Join Date Filter */}
        <Select value={filters.joined} onValueChange={(value) => updateFilter('joined', value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Join Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Today
              </div>
            </SelectItem>
            <SelectItem value="week">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                This Week
              </div>
            </SelectItem>
            <SelectItem value="month">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                This Month
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters Toggle */}
        <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Advanced
              {hasActiveFilters() && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Advanced Filters</span>
                  {hasActiveFilters() && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearFilters}
                      className="h-6 px-2 text-xs"
                    >
                      Clear All
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Badge Filters */}
                {availableBadges.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Badges
                    </Label>
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                      {availableBadges.map((badge) => (
                        <div key={badge.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`badge-${badge.id}`}
                            checked={filters.badges.includes(badge.id)}
                            onCheckedChange={() => toggleBadgeFilter(badge.id)}
                          />
                          <label
                            htmlFor={`badge-${badge.id}`}
                            className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            <span style={{ color: badge.color }}>{badge.icon}</span>
                            {badge.name}
                          </label>
                        </div>
                      ))}
                    </div>
                    {filters.badges.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {filters.badges.map((badgeId) => {
                          const badge = availableBadges.find(b => b.id === badgeId);
                          if (!badge) return null;
                          return (
                            <Badge 
                              key={badgeId} 
                              variant="secondary" 
                              className="text-xs"
                              style={{ backgroundColor: `${badge.color}20`, color: badge.color }}
                            >
                              {badge.icon} {badge.name}
                              <button
                                onClick={() => toggleBadgeFilter(badgeId)}
                                className="ml-1 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Activity Level Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Activity Level
                  </Label>
                  <Select 
                    value={filters.status} 
                    onValueChange={(value) => updateFilter('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select activity level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Activity Levels</SelectItem>
                      <SelectItem value="high">High Activity (80%+)</SelectItem>
                      <SelectItem value="medium">Medium Activity (50-79%)</SelectItem>
                      <SelectItem value="low">Low Activity (0-49%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>

        {/* Clear All Filters */}
        {hasActiveFilters() && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters() && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm font-medium text-blue-900">Active filters:</span>
          
          {filters.search && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Search: "{filters.search}"
              <button
                onClick={() => updateFilter('search', '')}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.role !== 'all' && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 capitalize">
              Role: {filters.role}
              <button
                onClick={() => updateFilter('role', 'all')}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 capitalize">
              Status: {filters.status.replace('_', ' ')}
              <button
                onClick={() => updateFilter('status', 'all')}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.joined !== 'all' && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 capitalize">
              Joined: {filters.joined === 'week' ? 'This Week' : filters.joined === 'month' ? 'This Month' : filters.joined}
              <button
                onClick={() => updateFilter('joined', 'all')}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.badges.length > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {filters.badges.length} badge{filters.badges.length > 1 ? 's' : ''}
              <button
                onClick={() => updateFilter('badges', [])}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Results Summary */}
      {memberCount !== undefined && (
        <div className="text-sm text-gray-600">
          {hasActiveFilters() ? (
            <span>Showing filtered results • {memberCount} member{memberCount !== 1 ? 's' : ''}</span>
          ) : (
            <span>{memberCount} total member{memberCount !== 1 ? 's' : ''}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default MemberFilters;