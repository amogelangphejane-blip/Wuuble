import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SimpleHeader } from '@/components/SimpleHeader';
import { 
  Users, 
  Plus, 
  Search, 
  Globe, 
  Lock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

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
  owner_id?: string;
  tags?: string[];
}

const NewCommunities: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('member_count', { ascending: false });

      if (error) {
        console.error('Error fetching communities:', error);
        toast({
          title: "Error",
          description: "Failed to load communities. Please try again.",
          variant: "destructive"
        });
        return;
      }

      setCommunities(data || []);
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
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
        // Member already exists, just navigate
        navigate(`/community/${communityId}`);
        return;
      }

      toast({
        title: "Success",
        description: "You've joined the community!",
      });
      
      navigate(`/community/${communityId}`);
    } catch (err) {
      console.error('Error joining community:', err);
    }
  };

  const filteredCommunities = communities.filter(community => 
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SimpleHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Discover Amazing Communities</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Find Your Community
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join communities that match your interests and connect with like-minded people
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg bg-white dark:bg-gray-800 border-2 focus:border-blue-500 dark:border-gray-700"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="space-y-3">
                  <Skeleton className="h-16 w-16 rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : filteredCommunities.length === 0 ? (
          // Empty State
          <Card className="text-center py-16 border-2 border-dashed">
            <CardContent>
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                {searchQuery ? 'No communities found' : 'No communities yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                {searchQuery 
                  ? 'Try adjusting your search or explore all communities'
                  : 'Be the first to create a community and start building your network!'
                }
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Plus className="w-5 h-5 mr-2" />
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
                className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-blue-200 dark:hover:border-blue-800"
                onClick={() => navigate(`/community/${community.id}`)}
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between">
                    <Avatar className="w-16 h-16 ring-4 ring-gray-100 dark:ring-gray-800">
                      <AvatarImage src={community.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xl font-bold">
                        {community.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    {community.is_private ? (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Lock className="w-3 h-3" />
                        Private
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Globe className="w-3 h-3" />
                        Public
                      </Badge>
                    )}
                  </div>
                  
                  <div>
                    <CardTitle className="text-xl mb-2 group-hover:text-blue-600 transition-colors">
                      {community.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-sm">
                      {community.description || 'No description available'}
                    </CardDescription>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">{community.member_count || 0} members</span>
                    </div>
                    
                    {community.category && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {community.category}
                      </Badge>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="pt-4">
                  <Button 
                    className="w-full group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinCommunity(community.id);
                    }}
                  >
                    Join Community
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Stats Section */}
        {!loading && communities.length > 0 && (
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-8 px-8 py-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{communities.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Communities</p>
              </div>
              <div className="w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {communities.reduce((sum, c) => sum + (c.member_count || 0), 0)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Members</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewCommunities;