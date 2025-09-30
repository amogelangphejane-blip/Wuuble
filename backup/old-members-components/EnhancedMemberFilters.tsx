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
  Eye
} from 'lucide-react';
import { MemberFilter, MemberBadge, EnhancedCommunityMember } from '@/types/members';
import { cn } from '@/lib/utils';

interface EnhancedMemberFiltersProps {
  filters: MemberFilter;
  onFiltersChange: (filters: MemberFilter) => void;
  members: EnhancedCommunityMember[];
  availableBadges?: MemberBadge[];
  onlineCount: number;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  className?: string;
}

const EnhancedMemberFilters: React.FC<EnhancedMemberFiltersProps> = ({
  filters,
  onFiltersChange,
  members,
  availableBadges = [],
  onlineCount,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  className = ''
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters.search);
  const [activityRange, setActivityRange] = useState([0, 100]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== filters.search) {
        onFiltersChange({ ...filters, search: searchQuery });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, filters, onFiltersChange]);

  const stats = useMemo(() => {
    const total = members.length;
    const online = members.filter(m => m.is_online).length;
    const moderators = members.filter(m => m.role === 'moderator' || m.role === 'creator').length;
    const highActivity = members.filter(m => (m.activity_score || 0) >= 80).length;
    const newThisWeek = members.filter(m => {
      const joinDate = new Date(m.joined_at);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return joinDate > weekAgo;
    }).length;

    return { total, online, moderators, highActivity, newThisWeek };
  }, [members]);

  const updateFilter = (key: keyof MemberFilter, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActivityRange([0, 100]);
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
           filters.badges.length > 0 ||
           activityRange[0] > 0 ||
           activityRange[1] < 100;
  };

  const getFilteredCount = () => {
    return members.filter(member => {
      // Apply filters logic here (simplified)
      let matches = true;
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const displayName = member.profiles?.display_name || '';
        const bio = member.member_bio || member.profiles?.bio || '';
        matches = matches && (
          displayName.toLowerCase().includes(searchTerm) ||
          bio.toLowerCase().includes(searchTerm)
        );
      }
      
      if (filters.role !== 'all') {
        matches = matches && member.role === filters.role;
      }
      
      if (filters.status !== 'all') {
        switch (filters.status) {
          case 'online':
            matches = matches && member.is_online;
            break;
          case 'recently_active':
            matches = matches && member.is_recently_active;
            break;
          case 'offline':
            matches = matches && !member.is_online && !member.is_recently_active;
            break;
        }
      }
      
      const activityScore = member.activity_score || 0;
      matches = matches && activityScore >= activityRange[0] && activityScore <= activityRange[1];
      
      return matches;
    }).length;
  };

  const quickFilters = [
    {
      label: 'Online',
      value: 'online',
      count: stats.online,
      color: 'bg-green-500',
      onClick: () => updateFilter('status', filters.status === 'online' ? 'all' : 'online')
    },
    {
      label: 'Moderators',
      value: 'moderator',
      count: stats.moderators,
      color: 'bg-blue-500',
      onClick: () => updateFilter('role', filters.role === 'moderator' ? 'all' : 'moderator')
    },
    {
      label: 'New Members',
      value: 'week',
      count: stats.newThisWeek,
      color: 'bg-purple-500',
      onClick: () => updateFilter('joined', filters.joined === 'week' ? 'all' : 'week')
    },
    {
      label: 'High Activity',
      value: 'high',
      count: stats.highActivity,
      color: 'bg-orange-500',
      onClick: () => {
        if (activityRange[0] === 80 && activityRange[1] === 100) {
          setActivityRange([0, 100]);
        } else {
          setActivityRange([80, 100]);
        }
      }
    }
  ];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar with Stats */}
      <div className="relative">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search members by name, bio, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-12 h-12 text-lg"
            />
            {searchQuery && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </motion.button>
            )}
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="h-10 w-10 p-0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="h-10 w-10 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickFilters.map((filter, index) => {
          const isActive = 
            (filter.value === 'online' && filters.status === 'online') ||
            (filter.value === 'moderator' && filters.role === 'moderator') ||
            (filter.value === 'week' && filters.joined === 'week') ||
            (filter.value === 'high' && activityRange[0] === 80);

          return (
            <motion.div
              key={filter.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card 
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md",
                  isActive && "ring-2 ring-blue-500 bg-blue-50"
                )}
                onClick={filter.onClick}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{filter.label}</p>
                      <p className="text-2xl font-bold">{filter.count}</p>
                    </div>
                    <div className={cn("w-3 h-3 rounded-full", filter.color)} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Filter Controls */}
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
                Online ({stats.online})
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

        {/* Sort */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="activity_score">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Activity Score
              </div>
            </SelectItem>
            <SelectItem value="joined_at">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Join Date
              </div>
            </SelectItem>
            <SelectItem value="last_active">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Last Active
              </div>
            </SelectItem>
            <SelectItem value="name">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Name
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
                  variant="secondary" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  !
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
                {/* Activity Score Range */}
                <div>
                  <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Activity Score: {activityRange[0]} - {activityRange[1]}
                  </Label>
                  <Slider
                    value={activityRange}
                    onValueChange={setActivityRange}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Join Date Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Joined
                  </Label>
                  <Select value={filters.joined} onValueChange={(value) => updateFilter('joined', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select join period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
                            onCheckedChange={() => {
                              const newBadges = filters.badges.includes(badge.id)
                                ? filters.badges.filter(id => id !== badge.id)
                                : [...filters.badges, badge.id];
                              updateFilter('badges', newBadges);
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

        {/* Clear Filters */}
        {hasActiveFilters() && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Results Summary */}
      <AnimatePresence>
        {(hasActiveFilters() || searchQuery) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
          >
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Showing {getFilteredCount()} of {stats.total} members
              </span>
            </div>
            {hasActiveFilters() && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-800"
              >
                Reset filters
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedMemberFilters;