import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLivestream } from '@/hooks/useLivestream';
import { useAuth } from '@/hooks/useAuth';
import { LiveStream } from '@/services/livestreamService';
import { StreamManagement } from './StreamManagement';
import { LoadingSpinner } from './LoadingSpinner';
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
  Globe,
  Trash
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
    deleteStream,
  } = useLivestream();
  
  const { user } = useAuth();

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
      // Always exclude ended streams from display
      if (stream.status === 'ended') {
        return false;
      }

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

  // Get all unique tags from active streams (excluding ended streams)
  const allTags = Array.from(new Set(streams
    .filter(stream => stream.status !== 'ended')
    .flatMap(stream => stream.tags || [])));

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
      className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.03] overflow-hidden bg-white border-0 shadow-md hover:-translate-y-2 hover:shadow-purple-500/25"
      onClick={() => onStreamSelect(stream)}
      style={{
        animation: `fadeInUp 0.5s ease-out ${Math.random() * 0.3}s both`
      }}
    >
      <div className="relative">
        {/* Thumbnail */}
        <div className="aspect-video bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 relative overflow-hidden">
          {stream.display_image_url ? (
            <img 
              src={stream.display_image_url} 
              alt={stream.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : stream.thumbnail_url ? (
            <img 
              src={stream.thumbnail_url} 
              alt={stream.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
              <Play className="w-16 h-16 text-white/90 drop-shadow-lg" />
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          
          {/* Status Badge */}
          <Badge 
            className={`absolute top-3 left-3 ${getStreamStatusColor(stream.status)} text-white border-0 font-semibold px-3 py-1 shadow-lg`}
          >
            {stream.status === 'live' && (
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
            )}
            {getStreamStatusText(stream)}
          </Badge>

          {/* Viewer Count & Visibility */}
          <div className="absolute top-3 right-3 flex flex-col items-end space-y-2">
            {stream.status === 'live' && (
              <div className="bg-black/60 text-white px-3 py-1.5 rounded-full text-sm backdrop-blur-md font-medium shadow-lg">
                <Eye className="w-4 h-4 inline mr-1.5" />
                {stream.viewer_count.toLocaleString()}
              </div>
            )}
            
            {/* Visibility indicator */}
            <div className="bg-black/60 text-white px-3 py-1 rounded-full text-xs backdrop-blur-md flex items-center shadow-lg">
              {stream.visibility === 'public' ? (
                <>
                  <Globe className="w-3 h-3 mr-1.5" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 mr-1.5" />
                  Community
                </>
              )}
            </div>
          </div>

          {/* Play Overlay */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
            <div className="bg-white/25 backdrop-blur-md rounded-full p-6 transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-2xl">
              <Play className="w-10 h-10 text-white fill-white drop-shadow-lg" />
            </div>
          </div>

          {/* Duration/Time indicator */}
          {stream.status === 'live' && stream.actual_start_time && (
            <div className="absolute bottom-3 left-3 bg-red-500/90 text-white px-2 py-1 rounded text-xs font-medium backdrop-blur-sm">
              {formatDistanceToNow(new Date(stream.actual_start_time), { addSuffix: false })}
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-5">
          <div className="flex items-start space-x-4">
            <Avatar className="w-12 h-12 flex-shrink-0 ring-2 ring-gray-100 transition-all duration-200 group-hover:ring-purple-200">
              <AvatarImage src={stream.profiles?.avatar_url || "/placeholder-avatar.jpg"} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
                {stream.profiles?.display_name?.slice(0, 2).toUpperCase() || stream.creator_id.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base line-clamp-2 mb-2 text-gray-900 group-hover:text-purple-700 transition-colors">
                {stream.title}
              </h3>
              
              <p className="text-sm text-gray-600 mb-3 font-medium">
                {stream.profiles?.display_name || 'Anonymous Creator'}
              </p>
              
              {stream.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                  {stream.description}
                </p>
              )}

              {/* Tags */}
              {stream.tags && stream.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {stream.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs px-2 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors">
                      #{tag}
                    </Badge>
                  ))}
                  {stream.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs px-2 py-1 bg-gray-100 text-gray-600">
                      +{stream.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1.5">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">{stream.total_messages.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="font-medium">{stream.total_reactions.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>
                    {formatDistanceToNow(new Date(stream.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>

            {/* More options - only show for stream creator */}
            {user?.id === stream.creator_id && (
              <div className="flex space-x-2">
                <StreamManagement
                  stream={stream}
                  onStreamUpdated={(updatedStream) => {
                    // Update the stream in the list
                    loadStreams();
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this stream? This action cannot be undone.')) {
                          deleteStream(stream.id);
                        }
                      }}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash className="w-4 h-4 mr-2" />
                      Delete Stream
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
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
            {stream.display_image_url ? (
              <img 
                src={stream.display_image_url} 
                alt={stream.title}
                className="w-full h-full object-cover"
              />
            ) : stream.thumbnail_url ? (
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

              {/* More options - only show for stream creator */}
              {user?.id === stream.creator_id && (
                <div className="flex space-x-2">
                  <StreamManagement
                    stream={stream}
                    onStreamUpdated={(updatedStream) => {
                      // Update the stream in the list
                      loadStreams();
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this stream? This action cannot be undone.')) {
                            deleteStream(stream.id);
                          }
                        }}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash className="w-4 h-4 mr-2" />
                        Delete Stream
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <Play className="w-6 h-6 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                  Live Streams
                </h1>
                <p className="text-gray-600 text-sm">Discover amazing live content from creators</p>
              </div>
            </div>
            
            <Button 
              onClick={onStartBroadcast}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2.5"
            >
              <Play className="w-5 h-5 mr-2" />
              Go Live
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search streams, creators, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-3 text-base border-gray-200 focus:border-purple-300 focus:ring-purple-200 rounded-xl bg-white/70 backdrop-blur-sm"
              />
            </div>

            {/* Filters Row */}
            <div className="flex items-center justify-between gap-4">
              <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
                <SelectTrigger className="flex-1 max-w-[200px] py-3 rounded-xl border-gray-200 bg-white/70 backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="live">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span>Live Now</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="popular">
                    <div className="flex items-center space-x-3">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span>Popular</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="scheduled">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>Scheduled</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="all">
                    <div className="flex items-center space-x-3">
                      <Star className="w-4 h-4 text-purple-500" />
                      <span>All Streams</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle - Hidden on mobile */}
              <div className="hidden sm:flex items-center bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`rounded-lg transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'hover:bg-purple-50 text-gray-600'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`rounded-lg transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'hover:bg-purple-50 text-gray-600'
                  }`}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="mt-6">
              <div className="space-y-3">
                <span className="text-sm font-semibold text-gray-700 block">Popular Tags:</span>
                <div className="flex flex-wrap gap-2">
                  {allTags.slice(0, 6).map(tag => (
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
                      className={`text-xs rounded-full px-3 py-1.5 transition-all duration-200 ${
                        selectedTags.includes(tag)
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md hover:shadow-lg'
                          : 'border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600 bg-white/70 backdrop-blur-sm'
                      }`}
                    >
                      <Tag className="w-3 h-3 mr-1.5" />
                      {tag}
                    </Button>
                  ))}
                  {allTags.length > 6 && (
                    <span className="text-xs text-gray-500 self-center px-2">
                      +{allTags.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSpinner size="xl" variant="gradient" className="mb-4" />
            <p className="text-gray-600 text-lg font-medium">Loading amazing streams...</p>
            <p className="text-gray-400 text-sm mt-2">Discovering live content for you</p>
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
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <p className="text-gray-600 text-lg">
                  <span className="font-semibold text-gray-900">{filteredStreams.length}</span> stream{filteredStreams.length !== 1 ? 's' : ''} found
                  {searchQuery && <span className="ml-2 text-purple-600">for "{searchQuery}"</span>}
                </p>
                {filteredStreams.length > 0 && (
                  <div className="text-sm text-gray-500">
                    Showing {filterType === 'live' ? 'live' : filterType === 'popular' ? 'popular' : filterType === 'scheduled' ? 'scheduled' : 'all'} streams
                  </div>
                )}
              </div>
            </div>

            {/* Streams Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {filteredStreams.map(renderStreamCard)}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredStreams.map(renderStreamList)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};