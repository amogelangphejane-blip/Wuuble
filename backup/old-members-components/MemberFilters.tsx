import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Slider } from '@/components/ui/slider';
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
  SlidersHorizontal,
  Zap,
  Grid3X3,
  List,
  BarChart3,
  TrendingUp,
  Eye,
  ChevronDown,
  Sparkles,
  Target,
  MapPin
} from 'lucide-react';
import { MemberFilter, MemberSort, EnhancedMemberProfile, MemberBadge } from '@/types/community-members';
import { cn } from '@/lib/utils';

interface MemberFiltersProps {
  filters: MemberFilter;
  sort: MemberSort;
  members: EnhancedMemberProfile[];
  availableBadges?: MemberBadge[];
  onFiltersChange: (filters: Partial<MemberFilter>) => void;
  onSortChange: (sort: MemberSort) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  className?: string;
}

const MemberFilters: React.FC<MemberFiltersProps> = ({
  filters,
  sort,
  members,
  availableBadges = [],
  onFiltersChange,
  onSortChange,
  viewMode,
  onViewModeChange,
  className = ''
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters.search);
  const [activityRange, setActivityRange] = useState([filters.activity_score_min, filters.activity_score_max]);
  const [pointsRange, setPointsRange] = useState([filters.min_points, filters.max_points]);

  // Debounced search update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== filters.search) {
        onFiltersChange({ search: searchQuery });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, filters.search, onFiltersChange]);

  // Update ranges when filters change externally
  useEffect(() => {
    setActivityRange([filters.activity_score_min, filters.activity_score_max]);
    setPointsRange([filters.min_points, filters.max_points]);
  }, [filters.activity_score_min, filters.activity_score_max, filters.min_points, filters.max_points]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = members.length;
    const online = members.filter(m => m.is_online).length;
    const moderators = members.filter(m => m.role === 'moderator' || m.role === 'creator').length;
    const highActivity = members.filter(m => m.activity_score >= 80).length;
    const newThisWeek = members.filter(m => {
      const joinDate = new Date(m.joined_at);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return joinDate > weekAgo;
    }).length;
    const withBadges = members.filter(m => m.badges.length > 0).length;
    const withStreaks = members.filter(m => m.current_streak > 0).length;

    return { 
      total, 
      online, 
      moderators, 
      highActivity, 
      newThisWeek, 
      withBadges,
      withStreaks 
    };
  }, [members]);

  // Quick filter presets
  const quickFilters = [
    {
      id: 'online',
      label: 'Online',
      count: stats.online,
      icon: <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />,
      active: filters.online_status === 'online',
      onClick: () => onFiltersChange({ 
        online_status: filters.online_status === 'online' ? 'all' : 'online' 
      })
    },
    {
      id: 'moderators',
      label: 'Staff',
      count: stats.moderators,
      icon: <Shield className="h-3 w-3 text-blue-600" />,
      active: filters.role === 'moderator' || filters.role === 'creator',
      onClick: () => onFiltersChange({ 
        role: (filters.role === 'moderator' || filters.role === 'creator') ? 'all' : 'moderator' 
      })
    },
    {
      id: 'new',
      label: 'New',
      count: stats.newThisWeek,
      icon: <Sparkles className="h-3 w-3 text-purple-600" />,
      active: filters.joined_period === 'week',
      onClick: () => onFiltersChange({ 
        joined_period: filters.joined_period === 'week' ? 'all' : 'week' 
      })
    },
    {
      id: 'active',
      label: 'Highly Active',
      count: stats.highActivity,
      icon: <Zap className="h-3 w-3 text-orange-600" />,
      active: filters.activity_score_min >= 80,
      onClick: () => onFiltersChange({ 
        activity_score_min: filters.activity_score_min >= 80 ? 0 : 80,
        activity_score_max: 100
      })
    },
    {
      id: 'badges',
      label: 'Badge Holders',
      count: stats.withBadges,
      icon: <Award className="h-3 w-3 text-yellow-600" />,
      active: filters.badges.length > 0,
      onClick: () => setShowAdvanced(true)
    },
    {
      id: 'streaks',
      label: 'On Streak',
      count: stats.withStreaks,
      icon: <Target className="h-3 w-3 text-red-600" />,
      active: false,
      onClick: () => onFiltersChange({ 
        // TODO: Add streak filter
      })
    }
  ];

  // Check if any filters are active
  const hasActiveFilters = () => {
    return filters.search !== '' ||
           filters.role !== 'all' ||
           filters.status !== 'all' ||
           filters.engagement !== 'all' ||
           filters.online_status !== 'all' ||
           filters.joined_period !== 'all' ||
           filters.activity_score_min > 0 ||
           filters.activity_score_max < 100 ||
           filters.badges.length > 0 ||
           filters.tags.length > 0 ||
           filters.has_custom_avatar !== null ||
           filters.min_points > 0 ||
           filters.max_points < 999999;
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setActivityRange([0, 100]);
    setPointsRange([0, 999999]);
    onFiltersChange({
      search: '',
      role: 'all',
      status: 'all',
      engagement: 'all',
      online_status: 'all',
      joined_period: 'all',
      activity_score_min: 0,
      activity_score_max: 100,
      badges: [],
      tags: [],
      has_custom_avatar: null,
      min_points: 0,
      max_points: 999999,
    });
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search members by name, bio, location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 pr-12 h-12 text-lg border-2 focus:border-blue-500 transition-colors"
        />
        {searchQuery && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </motion.button>
        )}
      </div>

      {/* Quick Filter Chips */}
      <div className="flex flex-wrap gap-3">
        {quickFilters.map((filter) => (
          <motion.div
            key={filter.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card 
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-lg",
                filter.active && "ring-2 ring-blue-500 bg-blue-50 border-blue-200"
              )}
              onClick={filter.onClick}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  {filter.icon}
                  <span className="text-sm font-medium">{filter.label}</span>
                  <Badge 
                    variant={filter.active ? "default" : "secondary"}
                    className="ml-1 text-xs"
                  >
                    {filter.count}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Role Filter */}
        <Select value={filters.role} onValueChange={(value) => onFiltersChange({ role: value as any })}>
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
                Creators
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

        {/* Online Status Filter */}
        <Select value={filters.online_status} onValueChange={(value) => onFiltersChange({ online_status: value as any })}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="online">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Online ({stats.online})
              </div>
            </SelectItem>
            <SelectItem value="recently_active">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
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

        {/* Sort Control */}
        <Select 
          value={`${sort.field}:${sort.direction}`} 
          onValueChange={(value) => {
            const [field, direction] = value.split(':');
            onSortChange({ field: field as any, direction: direction as any });
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="activity_score:desc">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Highest Activity
              </div>
            </SelectItem>
            <SelectItem value="activity_score:asc">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Lowest Activity
              </div>
            </SelectItem>
            <SelectItem value="joined_at:desc">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Newest First
              </div>
            </SelectItem>
            <SelectItem value="joined_at:asc">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Oldest First
              </div>
            </SelectItem>
            <SelectItem value="display_name:asc">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Name A-Z
              </div>
            </SelectItem>
            <SelectItem value="total_points:desc">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Most Points
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters */}
        <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Advanced
              {hasActiveFilters() && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  !
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="end">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Advanced Filters</span>
                  {hasActiveFilters() && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearAllFilters}
                      className="h-6 px-2 text-xs"
                    >
                      Clear All
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Engagement Level */}
                <div>
                  <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Engagement Level
                  </Label>
                  <Select 
                    value={filters.engagement} 
                    onValueChange={(value) => onFiltersChange({ engagement: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Engagement Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="champion">Champion</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Activity Score Range */}
                <div>
                  <Label className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Activity Score: {activityRange[0]}% - {activityRange[1]}%
                  </Label>
                  <Slider
                    value={activityRange}
                    onValueChange={(value) => {
                      setActivityRange(value);
                      onFiltersChange({
                        activity_score_min: value[0],
                        activity_score_max: value[1]
                      });
                    }}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Inactive</span>
                    <span>Highly Active</span>
                  </div>
                </div>

                {/* Points Range */}
                <div>
                  <Label className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Points: {pointsRange[0].toLocaleString()} - {pointsRange[1].toLocaleString()}
                  </Label>
                  <Slider
                    value={pointsRange}
                    onValueChange={(value) => {
                      setPointsRange(value);
                      onFiltersChange({
                        min_points: value[0],
                        max_points: value[1]
                      });
                    }}
                    max={10000}
                    min={0}
                    step={100}
                    className="w-full"
                  />
                </div>

                {/* Join Date Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Joined
                  </Label>
                  <Select value={filters.joined_period} onValueChange={(value) => onFiltersChange({ joined_period: value as any })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Avatar Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2">Profile Picture</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={filters.has_custom_avatar === true ? "default" : "outline"}
                      size="sm"
                      onClick={() => onFiltersChange({ 
                        has_custom_avatar: filters.has_custom_avatar === true ? null : true 
                      })}
                      className="flex-1"
                    >
                      Has Avatar
                    </Button>
                    <Button
                      variant={filters.has_custom_avatar === false ? "default" : "outline"}
                      size="sm"
                      onClick={() => onFiltersChange({ 
                        has_custom_avatar: filters.has_custom_avatar === false ? null : false 
                      })}
                      className="flex-1"
                    >
                      Default Avatar
                    </Button>
                  </div>
                </div>

                {/* Badge Filters */}
                {availableBadges.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Badges ({filters.badges.length} selected)
                    </Label>
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                      {availableBadges.map((badge) => (
                        <div key={badge.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`badge-${badge.id}`}
                            checked={filters.badges.includes(badge.id)}
                            onCheckedChange={(checked) => {
                              const newBadges = checked
                                ? [...filters.badges, badge.id]
                                : filters.badges.filter(id => id !== badge.id);
                              onFiltersChange({ badges: newBadges });
                            }}
                          />
                          <label
                            htmlFor={`badge-${badge.id}`}
                            className="flex items-center gap-2 text-sm font-medium leading-none cursor-pointer"
                          >
                            <span style={{ color: badge.color }}>{badge.icon}</span>
                            {badge.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>

        {/* View Mode Toggle */}
        <div className="flex items-center border rounded-lg p-1 ml-auto">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="h-8 w-8 p-0"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active Filters Summary */}
      <AnimatePresence>
        {hasActiveFilters() && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-wrap items-center gap-2 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200"
          >
            <Eye className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Active filters:</span>
            
            {filters.search && (
              <Badge variant="secondary" className="bg-white/50">
                Search: "{filters.search}"
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer hover:text-red-600" 
                  onClick={() => setSearchQuery('')}
                />
              </Badge>
            )}
            
            {filters.role !== 'all' && (
              <Badge variant="secondary" className="bg-white/50">
                Role: {filters.role}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer hover:text-red-600" 
                  onClick={() => onFiltersChange({ role: 'all' })}
                />
              </Badge>
            )}

            {filters.online_status !== 'all' && (
              <Badge variant="secondary" className="bg-white/50">
                Status: {filters.online_status.replace('_', ' ')}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer hover:text-red-600" 
                  onClick={() => onFiltersChange({ online_status: 'all' })}
                />
              </Badge>
            )}

            {(filters.activity_score_min > 0 || filters.activity_score_max < 100) && (
              <Badge variant="secondary" className="bg-white/50">
                Activity: {filters.activity_score_min}%-{filters.activity_score_max}%
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer hover:text-red-600" 
                  onClick={() => {
                    setActivityRange([0, 100]);
                    onFiltersChange({ activity_score_min: 0, activity_score_max: 100 });
                  }}
                />
              </Badge>
            )}

            {filters.badges.length > 0 && (
              <Badge variant="secondary" className="bg-white/50">
                {filters.badges.length} badge{filters.badges.length > 1 ? 's' : ''}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer hover:text-red-600" 
                  onClick={() => onFiltersChange({ badges: [] })}
                />
              </Badge>
            )}

            <Button 
              size="sm" 
              variant="ghost" 
              onClick={clearAllFilters}
              className="text-blue-600 hover:text-blue-800 ml-2"
            >
              Clear all
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {members.length} member{members.length !== 1 ? 's' : ''}
          {hasActiveFilters() && ` (filtered from ${stats.total})`}
        </span>
        <span className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          {stats.online} online
        </span>
      </div>
    </div>
  );
};

export default MemberFilters;