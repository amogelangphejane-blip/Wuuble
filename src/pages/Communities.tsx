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
  Eye,
  Zap,
  Crown,
  Award,
  Flame,
  Grid3x3,
  List,
  ChevronRight,
  UserPlus,
  Activity,
  MapPin,
  Clock,
  Check
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
        <ModernHeader />
        
        <div className="container mx-auto px-4 py-6 max-w-[1400px]">
          {/* Modern Hero Section */}
          <div className="relative mb-8 overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-5 animate-gradient"></div>
            
            <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-2xl">
              {/* Top Row */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-lg opacity-50 animate-pulse"></div>
                      <div className="relative p-3 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-2xl shadow-lg">
                        <Sparkles className="w-7 h-7 text-white" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
                        Discover
                      </h1>
                      <p className="text-2xl font-semibold text-gray-700">Amazing Communities</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-lg max-w-2xl leading-relaxed">
                    Connect with thousands of passionate members. Find your tribe, share your interests, and grow together.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => navigate('/communities?create=true')}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 font-semibold px-8"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Community
                  </Button>
                  <Button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    size="lg"
                    variant="outline"
                    className="border-2 hover:bg-gray-50 font-semibold"
                  >
                    {viewMode === 'grid' ? <List className="w-5 h-5 mr-2" /> : <Grid3x3 className="w-5 h-5 mr-2" />}
                    {viewMode === 'grid' ? 'List View' : 'Grid View'}
                  </Button>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-4 border border-blue-200/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-xl">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-900">{communities.length}</p>
                      <p className="text-sm text-blue-600">Communities</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-4 border border-purple-200/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500 rounded-xl">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-900">Global</p>
                      <p className="text-sm text-purple-600">Network</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-2xl p-4 border border-pink-200/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500 rounded-xl">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-pink-900">Active</p>
                      <p className="text-sm text-pink-600">Daily</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-4 border border-orange-200/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500 rounded-xl">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-900">Fast</p>
                      <p className="text-sm text-orange-600">Growing</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <Tabs defaultValue="all" className="mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 border border-gray-200 shadow-lg mb-6">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-transparent gap-2">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl font-semibold"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  All
                </TabsTrigger>
                <TabsTrigger 
                  value="trending" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-xl font-semibold"
                >
                  <Flame className="w-4 h-4 mr-2" />
                  Trending
                </TabsTrigger>
                <TabsTrigger 
                  value="new" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white rounded-xl font-semibold"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  New
                </TabsTrigger>
                <TabsTrigger 
                  value="popular" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-xl font-semibold"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Popular
                </TabsTrigger>
                <TabsTrigger 
                  value="featured" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-xl font-semibold"
                >
                  <Award className="w-4 h-4 mr-2" />
                  Featured
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                <Input
                  placeholder="Search communities, topics, interests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-7 text-base rounded-2xl border-2 border-gray-200 focus:border-blue-500 transition-all bg-white shadow-md hover:shadow-lg focus:shadow-xl"
                />
              </div>
              
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full lg:w-[220px] py-7 rounded-2xl border-2 bg-white shadow-md hover:shadow-lg transition-all">
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <SelectValue placeholder="Category" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value} className="rounded-lg">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(category.value)}
                        <span>{category.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-[200px] py-7 rounded-2xl border-2 bg-white shadow-md hover:shadow-lg transition-all">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-5 h-5 text-gray-600" />
                    <SelectValue placeholder="Sort" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="members" className="rounded-lg">Most Members</SelectItem>
                  <SelectItem value="newest" className="rounded-lg">Newest First</SelectItem>
                  <SelectItem value="name" className="rounded-lg">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results Counter */}
            {!loading && (
              <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl border border-blue-100 mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="text-sm font-medium">Found</span>
                    <span className="px-3 py-1 bg-white rounded-full text-lg font-bold text-blue-600 shadow-sm">
                      {filteredCommunities.length}
                    </span>
                    <span className="text-sm font-medium">{filteredCommunities.length === 1 ? 'community' : 'communities'}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {filterCategory !== 'all' && (
                    <Badge className="bg-blue-500 text-white border-0 shadow-sm px-3 py-1">
                      {categories.find(c => c.value === filterCategory)?.label}
                    </Badge>
                  )}
                  {searchQuery && (
                    <Badge className="bg-purple-500 text-white border-0 shadow-sm px-3 py-1">
                      Search: "{searchQuery}"
                    </Badge>
                  )}
                  {(filterCategory !== 'all' || searchQuery) && (
                    <Button
                      onClick={() => {
                        setSearchQuery('');
                        setFilterCategory('all');
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Tabs>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Modern Loading State */}
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden bg-white border-0 shadow-lg">
                  {/* Cover with centered avatar skeleton */}
                  <div className="relative h-40 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center">
                    <Skeleton className="w-28 h-28 rounded-full border-4 border-white shadow-2xl" />
                  </div>
                  
                  <CardHeader className="space-y-3 pb-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </CardHeader>
                  
                  <CardContent className="space-y-4 pb-4">
                    <div className="flex gap-3">
                      <Skeleton className="h-8 w-32 rounded-xl" />
                      <Skeleton className="h-8 w-24 rounded-xl" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16 rounded-lg" />
                      <Skeleton className="h-6 w-16 rounded-lg" />
                      <Skeleton className="h-6 w-16 rounded-lg" />
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-0 pb-5">
                    <Skeleton className="h-11 w-full rounded-xl" />
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
            // Redesigned Modern Community Cards
            <div className={viewMode === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
              {filteredCommunities.map((community, index) => (
                <Card 
                  key={community.id} 
                  className={`group relative overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 bg-white ${viewMode === 'list' ? 'flex flex-row' : ''}`}
                  onClick={() => navigate(`/community/${community.id}`)}
                  style={{animationDelay: `${index * 50}ms`}}
                >
                  {/* Animated Border Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-xl -z-10"></div>
                  
                  <div className={`relative ${viewMode === 'list' ? 'flex flex-row w-full' : ''}`}>
                    {/* Cover Section with Avatar */}
                    <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'h-40'} bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 overflow-hidden`}>
                      {/* Animated Background Pattern */}
                      <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>
                      </div>
                      
                      {/* Profile Picture - Centered */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative">
                          <div className="absolute inset-0 bg-white rounded-full blur-md opacity-50"></div>
                          <Avatar className="relative w-28 h-28 border-4 border-white shadow-2xl ring-4 ring-white/50 group-hover:ring-8 group-hover:scale-110 transition-all duration-500">
                            <AvatarImage 
                              src={community.avatar_url} 
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white text-3xl font-black">
                              {community.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          {/* Status Badge */}
                          {!community.is_private && (
                            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-green-400 to-emerald-500 w-8 h-8 rounded-full border-3 border-white flex items-center justify-center shadow-lg animate-pulse">
                              <Check className="w-4 h-4 text-white font-bold" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Top Corner Badges */}
                      <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                        {community.is_private ? (
                          <Badge className="bg-black/80 backdrop-blur-md text-white border-0 shadow-xl font-semibold">
                            <Lock className="w-3 h-3 mr-1" />
                            Private
                          </Badge>
                        ) : (
                          <Badge className="bg-green-500/90 backdrop-blur-md text-white border-0 shadow-xl font-semibold">
                            <Globe className="w-3 h-3 mr-1" />
                            Public
                          </Badge>
                        )}
                        
                        {community.category && (
                          <Badge className="bg-white/95 backdrop-blur-md text-gray-800 border-0 shadow-xl font-semibold">
                            {getCategoryIcon(community.category)}
                            <span className="ml-1.5 capitalize">{community.category}</span>
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xl font-black text-gray-900 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all line-clamp-1">
                          {community.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 text-gray-600 text-sm leading-relaxed mt-2">
                          {community.description || 'Discover amazing content and connect with members'}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="space-y-4 pb-4">
                        {/* Enhanced Stats */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span className="font-bold text-blue-900">{community.member_count || 0}</span>
                            <span className="text-xs text-blue-600 font-medium">members</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                            <Activity className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-green-600 font-semibold">Active</span>
                          </div>
                        </div>

                        {/* Tags */}
                        {community.tags && community.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {community.tags.slice(0, 3).map((tag, tagIndex) => (
                              <Badge 
                                key={tagIndex} 
                                variant="secondary" 
                                className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors border border-gray-200 font-medium px-2.5 py-1"
                              >
                                #{tag}
                              </Badge>
                            ))}
                            {community.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-0 font-semibold">
                                +{community.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                      
                      <CardFooter className="pt-0 pb-5 gap-2">
                        <Button 
                          className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-2xl transition-all duration-300 font-bold rounded-xl group-hover:scale-[1.03] h-11"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinCommunity(community.id);
                          }}
                        >
                          <UserPlus className="w-5 h-5 mr-2" />
                          Join Now
                          <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </CardFooter>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Redesigned Trending Communities Section */}
          {!loading && communities.length > 0 && (
            <div className="mt-20">
              <div className="relative mb-10">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 opacity-10 blur-3xl"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 blur-xl opacity-50 animate-pulse"></div>
                      <div className="relative p-4 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 rounded-2xl shadow-2xl">
                        <Flame className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-4xl font-black bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                        Trending Now
                      </h2>
                      <p className="text-gray-600 text-lg font-medium mt-1">Most active communities this week</p>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="border-2 hover:bg-gray-50 font-semibold">
                    View All
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
              
              <div className="grid gap-5">
                {communities.slice(0, 5).map((community, index) => (
                  <Card 
                    key={community.id}
                    className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 bg-white"
                    onClick={() => navigate(`/community/${community.id}`)}
                  >
                    {/* Gradient Border Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl -z-10"></div>
                    
                    <CardContent className="flex items-center gap-6 p-6">
                      {/* Rank Medal */}
                      <div className="relative flex-shrink-0">
                        <div className={`flex items-center justify-center w-16 h-16 rounded-2xl shadow-2xl font-black text-2xl transition-all duration-300 group-hover:scale-110 ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 text-white animate-pulse' :
                          index === 1 ? 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 text-white' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white' :
                          'bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 text-blue-700'
                        }`}>
                          {index + 1}
                        </div>
                        {index < 3 && (
                          <div className="absolute -top-2 -right-2 animate-bounce">
                            <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500 drop-shadow-lg" />
                          </div>
                        )}
                      </div>
                      
                      {/* Community Avatar */}
                      <Avatar className="w-20 h-20 border-4 border-white shadow-2xl ring-4 ring-orange-200/50 group-hover:ring-8 group-hover:ring-orange-300/70 group-hover:scale-110 transition-all duration-500 flex-shrink-0">
                        <AvatarImage 
                          src={community.avatar_url}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 text-white text-2xl font-black">
                          {community.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Community Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-black text-2xl text-gray-900 truncate group-hover:bg-gradient-to-r group-hover:from-orange-600 group-hover:to-pink-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                            {community.name}
                          </h3>
                          {community.category && (
                            <Badge className="bg-gradient-to-r from-orange-100 to-pink-100 text-orange-700 border-0 font-semibold">
                              {getCategoryIcon(community.category)}
                              <span className="ml-1.5 capitalize">{community.category}</span>
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-3 line-clamp-1">
                          {community.description || 'Join this amazing community'}
                        </p>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl border border-orange-100">
                            <Users className="w-4 h-4 text-orange-600" />
                            <span className="font-bold text-orange-900">{community.member_count || 0}</span>
                            <span className="text-xs text-orange-600 font-medium">members</span>
                          </div>
                          
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                            <Activity className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-green-600 font-semibold">Highly Active</span>
                          </div>
                          
                          {!community.is_private && (
                            <Badge className="bg-green-500/90 text-white border-0 shadow-sm font-semibold">
                              <Globe className="w-3 h-3 mr-1" />
                              Public
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Join Button */}
                      <Button 
                        size="lg"
                        className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:from-orange-600 hover:via-pink-600 hover:to-purple-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 font-bold px-8 group-hover:scale-110"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinCommunity(community.id);
                        }}
                      >
                        <UserPlus className="w-5 h-5 mr-2" />
                        Join Now
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