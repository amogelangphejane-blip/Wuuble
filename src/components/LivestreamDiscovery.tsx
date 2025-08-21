import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLivestream } from '@/hooks/useLivestream';
import { LiveStream } from '@/services/livestreamService';
import {
  Search,
  Eye,
  MessageCircle,
  Play,
  Clock,
  Flame,
  TrendingUp,
  Users,
  Star,
  Filter,
  Grid3X3,
  List,
  Calendar,
  MapPin,
  Tag,
  Heart,
  Share,
  MoreVertical,
  Lock,
  Globe
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LivestreamDiscoveryProps {
  onStreamSelect: (stream: LiveStream) => void;
  onStartBroadcast: () => void;
}

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'live' | 'scheduled' | 'popular';

export const LivestreamDiscovery: React.FC<LivestreamDiscoveryProps> = ({
  onStreamSelect,
  onStartBroadcast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterType, setFilterType] = useState<FilterType>('live');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const {
    streams,
    isLoading,
    error,
    loadStreams,
  } = useLivestream();

  // Load streams on mount and filter changes
  useEffect(() => {
    const filters: any = {};
    
    switch (filterType) {
      case 'live':
        filters.status = 'live';
        break;
      case 'scheduled':
        filters.status = 'scheduled';
        break;
      case 'popular':
        // Will be sorted by viewer count
        break;
    }

    loadStreams(filters);
  }, [filterType, loadStreams]);

  // Filter and sort streams
  const filteredStreams = streams
    .filter(stream => {
      // Text search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = stream.title.toLowerCase().includes(query);
        const matchesDescription = stream.description?.toLowerCase().includes(query);
        const matchesTags = stream.tags?.some(tag => tag.toLowerCase().includes(query));
        
        if (!matchesTitle && !matchesDescription && !matchesTags) {
          return false;
        }
      }

      // Tag filter
      if (selectedTags.length > 0) {
        const hasSelectedTag = selectedTags.some(tag => 
          stream.tags?.includes(tag)
        );
        if (!hasSelectedTag) return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (filterType) {
        case 'popular':
          return b.viewer_count - a.viewer_count;
        case 'live':
          return new Date(b.actual_start_time || b.created_at).getTime() - 
                 new Date(a.actual_start_time || a.created_at).getTime();
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  // Get all unique tags from streams
  const allTags = Array.from(new Set(streams.flatMap(stream => stream.tags || [])));

  const getStreamStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-red-500';
      case 'scheduled':
        return 'bg-blue-500';
      case 'ended':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStreamStatusText = (stream: LiveStream) => {
    switch (stream.status) {
      case 'live':
        return 'LIVE';
      case 'scheduled':
        return `Starts ${formatDistanceToNow(new Date(stream.scheduled_start_time!), { addSuffix: true })}`;
      case 'ended':
        return 'Ended';
      default:
        return stream.status;
    }
  };

  const renderStreamCard = (stream: LiveStream) => (
    <Card 
      key={stream.id}
      className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] overflow-hidden"
      onClick={() => onStreamSelect(stream)}
    >
      <div className="relative">
        {/* Thumbnail */}
        <div className="aspect-video bg-gradient-to-br from-purple-600 to-pink-600 relative overflow-hidden">
          {stream.thumbnail_url ? (
            <img 
              src={stream.thumbnail_url} 
              alt={stream.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-12 h-12 text-white/80" />
            </div>
          )}
          
          {/* Status Badge */}
          <Badge 
            className={`absolute top-2 left-2 ${getStreamStatusColor(stream.status)} text-white border-0`}
          >
            {stream.status === 'live' && (
              <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
            )}
            {getStreamStatusText(stream)}
          </Badge>

          {/* Viewer Count & Visibility */}
          <div className="absolute top-2 right-2 flex flex-col items-end space-y-1">
            {stream.status === 'live' && (
              <div className="bg-black/50 text-white px-2 py-1 rounded text-sm backdrop-blur-sm">
                <Eye className="w-3 h-3 inline mr-1" />
                {stream.viewer_count}
              </div>
            )}
            
            {/* Visibility indicator */}
            <div className="bg-black/50 text-white px-2 py-1 rounded text-xs backdrop-blur-sm flex items-center">
              {stream.visibility === 'public' ? (
                <>
                  <Globe className="w-3 h-3 mr-1" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 mr-1" />
                  Community
                </>
              )}
            </div>
          </div>

          {/* Play Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src={stream.profiles?.avatar_url || "/placeholder-avatar.jpg"} />
              <AvatarFallback>
                {stream.profiles?.display_name?.slice(0, 2).toUpperCase() || stream.creator_id.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                {stream.title}
              </h3>
              
              <p className="text-xs text-gray-600 mb-2">
                {stream.profiles?.display_name || 'Anonymous Creator'}
              </p>
              
              {stream.description && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                  {stream.description}
                </p>
              )}

              {/* Tags */}
              {stream.tags && stream.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {stream.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {stream.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{stream.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-3 h-3" />
                  <span>{stream.total_messages}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="w-3 h-3" />
                  <span>{stream.total_reactions}</span>
                </div>
                <span>
                  {formatDistanceToNow(new Date(stream.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                // Handle more options
              }}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );

  const renderStreamList = (stream: LiveStream) => (
    <Card 
      key={stream.id}
      className="group cursor-pointer hover:shadow-md transition-all duration-200 mb-2"
      onClick={() => onStreamSelect(stream)}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          {/* Thumbnail */}
          <div className="w-32 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg relative overflow-hidden flex-shrink-0">
            {stream.thumbnail_url ? (
              <img 
                src={stream.thumbnail_url} 
                alt={stream.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-6 h-6 text-white/80" />
              </div>
            )}
            
            <Badge 
              className={`absolute bottom-1 left-1 ${getStreamStatusColor(stream.status)} text-white border-0 text-xs`}
            >
              {stream.status === 'live' ? 'LIVE' : stream.status}
            </Badge>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg line-clamp-1 mb-1">
                  {stream.title}
                </h3>
                
                <div className="flex items-center space-x-2 mb-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={stream.profiles?.avatar_url || "/placeholder-avatar.jpg"} />
                    <AvatarFallback className="text-xs">
                      {stream.profiles?.display_name?.slice(0, 2).toUpperCase() || stream.creator_id.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-600">{stream.profiles?.display_name || 'Anonymous Creator'}</span>
                </div>

                {stream.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                    {stream.description}
                  </p>
                )}

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{stream.viewer_count}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{stream.total_messages}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {stream.visibility === 'public' ? (
                      <>
                        <Globe className="w-4 h-4" />
                        <span>Public</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Community</span>
                      </>
                    )}
                  </div>
                  <span>
                    {formatDistanceToNow(new Date(stream.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle more options
                }}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Live Streams
            </h1>
            
            <Button 
              onClick={onStartBroadcast}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Go Live
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search streams, creators, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
              <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="live">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <span>Live</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="popular">
                    <div className="flex items-center space-x-2">
                      <Flame className="w-4 h-4" />
                      <span>Popular</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="scheduled">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Scheduled</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700">Tags:</span>
                {allTags.slice(0, 10).map(tag => (
                  <Button
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (selectedTags.includes(tag)) {
                        setSelectedTags(prev => prev.filter(t => t !== tag));
                      } else {
                        setSelectedTags(prev => [...prev, tag]);
                      }
                    }}
                    className="text-xs"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => loadStreams()}>Try Again</Button>
          </div>
        ) : filteredStreams.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <Play className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No streams found
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || selectedTags.length > 0 
                  ? 'Try adjusting your search or filters'
                  : 'Be the first to go live!'
                }
              </p>
            </div>
            <Button 
              onClick={onStartBroadcast}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Broadcasting
            </Button>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-gray-600">
                {filteredStreams.length} stream{filteredStreams.length !== 1 ? 's' : ''} found
              </p>
            </div>

            {/* Streams Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredStreams.map(renderStreamCard)}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredStreams.map(renderStreamList)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};