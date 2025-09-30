import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ModernHeader } from '@/components/ModernHeader';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import { 
  Users, 
  Plus, 
  Search, 
  Globe, 
  Lock,
  Star,
  TrendingUp,
  Calendar,
  MessageCircle,
  Video,
  BookOpen,
  Filter,
  ArrowUpDown,
  Sparkles,
  Heart,
  Eye
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Community {
  id: string;
  name: string;
  description: string;
  avatar_url?: string;
  member_count: number;
  is_private: boolean;
  category?: string;
  created_at: string;
  owner_id: string;
  tags?: string[];
}

const Communities: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('members');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCommunities();
  }, [filterCategory, sortBy]);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('communities')
        .select('*');

      // Apply category filter if not 'all'
      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory);
      }

      // Apply sorting
      if (sortBy === 'members') {
        query = query.order('member_count', { ascending: false });
      } else if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'name') {
        query = query.order('name', { ascending: true });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching communities:', error);
        setError('Failed to load communities. Please try again.');
        return;
      }

      setCommunities(data || []);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: user.id,
          role: 'member'
        });

      if (error) {
        console.error('Error joining community:', error);
        return;
      }

      // Navigate to community detail page
      navigate(`/community/${communityId}`);
    } catch (err) {
      console.error('Error joining community:', err);
    }
  };

  const filteredCommunities = communities.filter(community => 
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [
    { value: 'all', label: 'All Communities' },
    { value: 'education', label: 'Education' },
    { value: 'technology', label: 'Technology' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'art', label: 'Art & Design' },
    { value: 'music', label: 'Music' },
    { value: 'business', label: 'Business' },
    { value: 'health', label: 'Health & Fitness' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'other', label: 'Other' }
  ];

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'education':
        return <BookOpen className="w-4 h-4" />;
      case 'technology':
        return <TrendingUp className="w-4 h-4" />;
      case 'gaming':
        return <Video className="w-4 h-4" />;
      case 'music':
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <ResponsiveLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <ModernHeader />
        
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Hero Header Section with Enhanced Design */}
          <div className="mb-10 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-3xl blur-3xl -z-10"></div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Discover Communities
                  </h1>
                </div>
                <p className="text-gray-600 text-lg">
                  Join vibrant communities and connect with like-minded people worldwide
                </p>
                <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span>{communities.length} Communities</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-500" />
                    <span>Global Network</span>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={() => navigate('/communities?create=true')}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Community
              </Button>
            </div>
          </div>

          {/* Advanced Search and Filter Section */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search communities by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-6 text-base rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors bg-white shadow-sm"
                />
              </div>
              
              {/* Category Filter */}
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full lg:w-[220px] py-6 rounded-xl border-2 bg-white shadow-sm">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <SelectValue placeholder="Select category" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-[200px] py-6 rounded-xl border-2 bg-white shadow-sm">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-gray-500" />
                    <SelectValue placeholder="Sort by" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="members">Most Members</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="name">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Stats Bar */}
            {!loading && (
              <div className="flex items-center justify-between px-4 py-3 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredCommunities.length}</span> {filteredCommunities.length === 1 ? 'community' : 'communities'}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                    {filterCategory === 'all' ? 'All Categories' : categories.find(c => c.value === filterCategory)?.label}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Enhanced Loading State */}
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden bg-white/90">
                  {/* Cover skeleton */}
                  <Skeleton className="h-32 w-full rounded-t-lg" />
                  <CardHeader className="space-y-3 pt-16 relative">
                    {/* Avatar skeleton */}
                    <Skeleton className="h-24 w-24 rounded-full absolute -top-12 left-6 border-4 border-white" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filteredCommunities.length === 0 ? (
            // Enhanced Empty State
            <Card className="text-center py-16 bg-white/90 backdrop-blur-sm border-2 border-dashed border-gray-300">
              <CardContent>
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Users className="w-12 h-12 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {searchQuery ? 'No communities found' : 'No communities yet'}
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                  {searchQuery 
                    ? 'Try adjusting your search terms or filters to find what you\'re looking for'
                    : 'Be the first to create an amazing community and start connecting with others!'
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Button
                    onClick={() => navigate('/communities?create=true')}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create First Community
                  </Button>
                  {searchQuery && (
                    <Button
                      onClick={() => {
                        setSearchQuery('');
                        setFilterCategory('all');
                      }}
                      variant="outline"
                      size="lg"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            // Enhanced Communities Grid with Profile Pictures
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCommunities.map((community) => (
                <Card 
                  key={community.id} 
                  className="group overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-200 bg-white/90 backdrop-blur-sm"
                  onClick={() => navigate(`/community/${community.id}`)}
                >
                  {/* Community Cover with Large Profile Picture */}
                  <div className="relative h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 overflow-hidden">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="absolute -bottom-12 left-6 z-10">
                      <div className="relative">
                        <Avatar className="w-24 h-24 border-4 border-white shadow-xl ring-2 ring-blue-200 group-hover:ring-4 group-hover:ring-blue-300 transition-all duration-300">
                          <AvatarImage 
                            src={community.avatar_url} 
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-2xl font-bold">
                            {community.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {!community.is_private && (
                          <div className="absolute -top-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                            <Globe className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Badges on Cover */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      {community.is_private && (
                        <Badge className="bg-black/60 backdrop-blur-sm text-white border-0 shadow-lg">
                          <Lock className="w-3 h-3 mr-1" />
                          Private
                        </Badge>
                      )}
                      {community.category && (
                        <Badge className="bg-white/90 backdrop-blur-sm text-gray-700 border-0 shadow-lg">
                          {getCategoryIcon(community.category)}
                          <span className="ml-1 capitalize">{community.category}</span>
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <CardHeader className="pt-16 pb-4">
                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {community.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-gray-600 mt-2 min-h-[2.5rem]">
                      {community.description || 'Join this community to connect with others'}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3 pb-4">
                    {/* Stats Row */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="p-1.5 bg-blue-50 rounded-lg">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-semibold text-gray-900">{community.member_count || 0}</span>
                        <span>members</span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-gray-500">
                        <Eye className="w-4 h-4" />
                        <span className="text-xs">Active</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {community.tags && community.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {community.tags.slice(0, 3).map((tag, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                          >
                            #{tag}
                          </Badge>
                        ))}
                        {community.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                            +{community.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="pt-0 pb-4">
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinCommunity(community.id);
                      }}
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Join Community
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {/* Enhanced Popular Communities Section */}
          {!loading && communities.length > 0 && (
            <div className="mt-16">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      Popular Communities
                    </h2>
                    <p className="text-gray-600 text-sm">Most active and engaging communities</p>
                  </div>
                </div>
                <TrendingUp className="w-6 h-6 text-orange-500" />
              </div>
              
              <div className="grid gap-4">
                {communities.slice(0, 5).map((community, index) => (
                  <Card 
                    key={community.id}
                    className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-orange-200 bg-white/90 backdrop-blur-sm overflow-hidden"
                    onClick={() => navigate(`/community/${community.id}`)}
                  >
                    <CardContent className="flex items-center justify-between p-5">
                      <div className="flex items-center gap-5 flex-1">
                        {/* Ranking Badge */}
                        <div className="relative">
                          <div className={`flex items-center justify-center w-12 h-12 rounded-xl shadow-lg font-bold text-lg ${
                            index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-400 text-white' :
                            index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                            index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                            'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700'
                          }`}>
                            {index + 1}
                          </div>
                          {index < 3 && (
                            <div className="absolute -top-1 -right-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            </div>
                          )}
                        </div>
                        
                        {/* Community Avatar with Enhanced Styling */}
                        <Avatar className="w-16 h-16 border-3 border-white shadow-lg ring-2 ring-orange-200 group-hover:ring-4 group-hover:ring-orange-300 transition-all duration-300">
                          <AvatarImage 
                            src={community.avatar_url}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-pink-500 text-white text-lg font-bold">
                            {community.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        {/* Community Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-lg text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                              {community.name}
                            </p>
                            {community.category && (
                              <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                                {community.category}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-orange-500" />
                              <span className="font-semibold text-gray-900">{community.member_count || 0}</span>
                              <span>members</span>
                            </div>
                            {community.is_private ? (
                              <Badge variant="secondary" className="text-xs bg-gray-100">
                                <Lock className="w-3 h-3 mr-1" />
                                Private
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                <Globe className="w-3 h-3 mr-1" />
                                Public
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Join Button */}
                      <Button 
                        size="default"
                        className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-md hover:shadow-lg transition-all duration-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinCommunity(community.id);
                        }}
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Join
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default Communities;