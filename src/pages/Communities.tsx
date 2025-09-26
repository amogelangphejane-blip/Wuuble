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
  BookOpen
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';

interface Community {
  id: string;
  name: string;
  description: string;
  avatar_url?: string;
  member_count: number;
  is_private: boolean;
  category?: string;
  created_at: string;
  creator_id: string;
  tags?: string[];
}

const Communities: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCommunities();
  }, [filterCategory]);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('communities')
        .select('*')
        .order('member_count', { ascending: false });

      // Apply category filter if not 'all'
      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory);
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
      <div className="min-h-screen bg-gray-50">
        <ModernHeader />
        
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Explore Communities</h1>
                <p className="text-gray-600 mt-2">
                  Discover and join communities that match your interests
                </p>
              </div>
              
              <Button
                onClick={() => navigate('/communities?create=true')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Community
              </Button>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search communities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="space-y-2">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filteredCommunities.length === 0 ? (
            // Empty State
            <Card className="text-center py-12">
              <CardContent>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'No communities found' : 'No communities yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery 
                    ? 'Try adjusting your search or filters'
                    : 'Be the first to create a community!'
                  }
                </p>
                <Button
                  onClick={() => navigate('/communities?create=true')}
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Community
                </Button>
              </CardContent>
            </Card>
          ) : (
            // Communities Grid
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCommunities.map((community) => (
                <Card 
                  key={community.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/community/${community.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={community.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                          {community.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex items-center gap-2">
                        {community.is_private && (
                          <Badge variant="secondary" className="text-xs">
                            <Lock className="w-3 h-3 mr-1" />
                            Private
                          </Badge>
                        )}
                        {community.category && (
                          <Badge variant="outline" className="text-xs">
                            {getCategoryIcon(community.category)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <CardTitle className="text-lg">{community.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {community.description || 'No description available'}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{community.member_count || 0} members</span>
                      </div>
                      
                      {community.tags && community.tags.length > 0 && (
                        <div className="flex gap-1">
                          {community.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinCommunity(community.id);
                      }}
                    >
                      Join Community
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {/* Popular Communities Section */}
          {!loading && communities.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500" />
                Popular Communities
              </h2>
              
              <div className="grid gap-4">
                {communities.slice(0, 3).map((community, index) => (
                  <Card 
                    key={community.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/community/${community.id}`)}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold">
                          {index + 1}
                        </div>
                        
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={community.avatar_url} />
                          <AvatarFallback>
                            {community.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <p className="font-semibold">{community.name}</p>
                          <p className="text-sm text-gray-600">
                            {community.member_count || 0} members
                          </p>
                        </div>
                      </div>
                      
                      <Button 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinCommunity(community.id);
                        }}
                      >
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