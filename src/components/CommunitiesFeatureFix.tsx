import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Plus, 
  Search, 
  Globe, 
  Lock,
  Star,
  TrendingUp,
  Calendar,
  MessageSquare,
  Video,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Refresh,
  Grid3X3,
  List,
  Crown,
  DollarSign
} from 'lucide-react';
import { CreateCommunityDialog } from '@/components/CreateCommunityDialog';
import { useToast } from '@/hooks/use-toast';
import { ResponsiveCommunitiesLayout, ResponsiveGrid, ResponsiveCard, useResponsive } from '@/components/ResponsiveCommunitiesLayout';
import { cn } from '@/lib/utils';

interface Community {
  id: string;
  name: string;
  description: string | null;
  avatar_url?: string | null;
  member_count: number;
  is_private: boolean;
  category?: string | null;
  created_at: string;
  creator_id: string;
  tags?: string[] | null;
  subscription_price?: number | null;
}

interface UserMembership {
  community_id: string;
  role: string;
  joined_at: string;
}

export const CommunitiesFeatureFix = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const viewport = useResponsive();
  
  const [communities, setCommunities] = useState<Community[]>([]);
  const [userMemberships, setUserMemberships] = useState<UserMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('discover');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Check for create dialog from URL params
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateDialog(true);
      searchParams.delete('create');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user && activeTab === 'my-communities') {
      setActiveTab('discover');
    }
  }, [user, authLoading, activeTab]);

  // Fetch data
  useEffect(() => {
    fetchCommunities();
    if (user) {
      fetchUserMemberships();
    }
  }, [filterCategory, user, retryCount]);

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
        setError(`Failed to load communities: ${error.message}`);
        return;
      }

      // Ensure all required fields have defaults
      const safeCommunities = (data || []).map(community => ({
        ...community,
        description: community.description || 'No description available',
        member_count: community.member_count || 0,
        tags: Array.isArray(community.tags) ? community.tags : [],
        subscription_price: community.subscription_price || 0,
      }));

      setCommunities(safeCommunities);
      
      if (safeCommunities.length === 0 && filterCategory === 'all') {
        toast({
          title: "No Communities Found",
          description: "This might be the first time setting up communities. Try creating one!",
        });
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserMemberships = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('community_members')
        .select('community_id, role, joined_at')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching memberships:', error);
        return;
      }

      setUserMemberships(data || []);
    } catch (err) {
      console.error('Error fetching memberships:', err);
    }
  };

  const handleJoinCommunity = async (communityId: string, isPremium: boolean = false) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (isPremium) {
      navigate(`/community/${communityId}/subscriptions`);
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
        toast({
          title: "Error",
          description: "Failed to join community. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Successfully joined the community!",
      });

      // Update local state
      setUserMemberships([...userMemberships, {
        community_id: communityId,
        role: 'member',
        joined_at: new Date().toISOString()
      }]);

      // Navigate to community
      navigate(`/community/${communityId}`);
    } catch (err: any) {
      console.error('Error joining community:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const filteredCommunities = communities.filter(community => {
    const searchLower = searchQuery.toLowerCase();
    return community.name.toLowerCase().includes(searchLower) ||
           (community.description && community.description.toLowerCase().includes(searchLower)) ||
           (community.tags && community.tags.some(tag => tag.toLowerCase().includes(searchLower)));
  });

  const myCommunities = filteredCommunities.filter(community =>
    userMemberships.some(m => m.community_id === community.id)
  );

  const discoverCommunities = filteredCommunities.filter(community =>
    !userMemberships.some(m => m.community_id === community.id)
  );

  const categories = [
    { value: 'all', label: 'All Categories', icon: Globe },
    { value: 'education', label: 'Education', icon: BookOpen },
    { value: 'technology', label: 'Technology', icon: TrendingUp },
    { value: 'gaming', label: 'Gaming', icon: Video },
    { value: 'music', label: 'Music', icon: MessageSquare },
    { value: 'business', label: 'Business', icon: Star },
    { value: 'lifestyle', label: 'Lifestyle', icon: Users },
  ];

  const getCategoryIcon = (category?: string | null) => {
    const categoryData = categories.find(c => c.value === category);
    if (categoryData) {
      const Icon = categoryData.icon;
      return <Icon className="w-4 h-4" />;
    }
    return <Globe className="w-4 h-4" />;
  };

  const CommunityCard = ({ community, isMember }: { community: Community; isMember: boolean }) => (
    <ResponsiveCard 
      className={cn(
        "overflow-hidden",
        community.subscription_price && community.subscription_price > 0 && "ring-2 ring-yellow-200"
      )}
      onClick={() => navigate(`/community/${community.id}`)}
    >
      {/* Header with gradient */}
      <div className="h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative">
        {community.subscription_price && community.subscription_price > 0 && (
          <Badge className="absolute top-2 right-2 bg-yellow-400 text-black text-xs">
            <Crown className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        )}
        {community.is_private && (
          <Badge className="absolute top-2 left-2 bg-black/50 text-white text-xs">
            <Lock className="w-3 h-3 mr-1" />
            Private
          </Badge>
        )}
      </div>

      <CardHeader className="relative -mt-6 pb-2">
        <div className="flex items-start justify-between">
          <Avatar className="w-12 h-12 border-4 border-white shadow-lg">
            <AvatarImage src={community.avatar_url || ''} />
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold">
              {community.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {isMember && (
            <Badge className="bg-green-100 text-green-700 text-xs mt-6">
              <CheckCircle className="w-3 h-3 mr-1" />
              Member
            </Badge>
          )}
        </div>
        
        <div className="mt-2">
          <CardTitle className="text-lg line-clamp-1">{community.name}</CardTitle>
          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
            {community.description}
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 pt-0">
        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-gray-600">
              <Users className="w-4 h-4" />
              <span className="font-medium">{community.member_count}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <MessageSquare className="w-4 h-4" />
              <span className="font-medium">{Math.floor(Math.random() * 50)}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">{Math.floor(Math.random() * 10)}</span>
            </div>
          </div>
          {community.category && (
            <Badge variant="outline" className="text-xs">
              {getCategoryIcon(community.category)}
              <span className="ml-1">{community.category}</span>
            </Badge>
          )}
        </div>

        {/* Tags */}
        {community.tags && community.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {community.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
            {community.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{community.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Action Button */}
        <Button 
          className={cn(
            "w-full mt-3",
            isMember 
              ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
              : community.subscription_price && community.subscription_price > 0
              ? "bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-black"
              : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (isMember) {
              navigate(`/community/${community.id}`);
            } else {
              handleJoinCommunity(community.id, !!(community.subscription_price && community.subscription_price > 0));
            }
          }}
        >
          {isMember ? (
            'Enter Community'
          ) : community.subscription_price && community.subscription_price > 0 ? (
            <>
              <DollarSign className="w-4 h-4 mr-2" />
              Subscribe ${community.subscription_price}/mo
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Join Community
            </>
          )}
        </Button>
      </CardContent>
    </ResponsiveCard>
  );

  const LoadingSkeleton = () => (
    <ResponsiveGrid 
      mobileColumns={1}
      tabletColumns={viewMode === 'grid' ? 2 : 1}
      desktopColumns={viewMode === 'grid' ? 3 : 2}
    >
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="h-20 bg-gray-200 animate-pulse" />
          <CardHeader className="space-y-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse -mt-6" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-full" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </ResponsiveGrid>
  );

  const EmptyState = ({ title, description, action }: { 
    title: string; 
    description: string; 
    action?: () => void;
  }) => (
    <Card className="text-center py-12">
      <CardContent>
        <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-10 h-10 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{description}</p>
        {action && (
          <Button onClick={action} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Create First Community
          </Button>
        )}
      </CardContent>
    </Card>
  );

  const ErrorState = () => (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error}</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRetry}
          className="ml-4"
        >
          <Refresh className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );

  const SearchBar = () => (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <Input
        placeholder="Search communities..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={cn(
          "pl-10 bg-white shadow-sm",
          viewport.isMobile ? "h-10" : "h-12"
        )}
      />
    </div>
  );

  const FilterControls = () => (
    <div className="flex gap-2">
      <Select value={filterCategory} onValueChange={setFilterCategory}>
        <SelectTrigger className={cn(
          "bg-white shadow-sm",
          viewport.isMobile ? "w-32 h-10" : "w-48 h-12"
        )}>
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <SelectItem key={category.value} value={category.value}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {category.label}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <div className="flex items-center bg-white rounded-lg shadow-sm p-1">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('grid')}
          className={viewport.isMobile ? "h-8 px-2" : "h-10"}
        >
          <Grid3X3 className="w-4 h-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('list')}
          className={viewport.isMobile ? "h-8 px-2" : "h-10"}
        >
          <List className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <ResponsiveCommunitiesLayout
      searchBar={<SearchBar />}
      filters={<FilterControls />}
      viewControls={
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          size={viewport.isMobile ? "sm" : "default"}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Community
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{communities.length}</div>
              <div className="text-sm text-gray-600">Total Communities</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {communities.reduce((acc, c) => acc + c.member_count, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Members</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{myCommunities.length}</div>
              <div className="text-sm text-gray-600">My Communities</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {communities.filter(c => c.subscription_price && c.subscription_price > 0).length}
              </div>
              <div className="text-sm text-gray-600">Premium</div>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {error && <ErrorState />}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={cn(
            "grid w-full grid-cols-3",
            viewport.isMobile ? "h-10 max-w-full" : "h-12 max-w-md mx-auto"
          )}>
            <TabsTrigger value="discover" className="text-sm">
              <Globe className="w-4 h-4 mr-2" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="my-communities" className="text-sm" disabled={!user}>
              <Users className="w-4 h-4 mr-2" />
              My Communities
            </TabsTrigger>
            <TabsTrigger value="trending" className="text-sm">
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            {loading ? (
              <LoadingSkeleton />
            ) : discoverCommunities.length === 0 ? (
              <EmptyState
                title={searchQuery ? "No communities found" : "No communities yet"}
                description={searchQuery ? "Try adjusting your search or filters" : "Be the first to create a community!"}
                action={!searchQuery ? () => setShowCreateDialog(true) : undefined}
              />
            ) : (
              <ResponsiveGrid 
                mobileColumns={1}
                tabletColumns={viewMode === 'grid' ? 2 : 1}
                desktopColumns={viewMode === 'grid' ? 3 : 2}
              >
                {discoverCommunities.map((community) => (
                  <CommunityCard 
                    key={community.id} 
                    community={community} 
                    isMember={false}
                  />
                ))}
              </ResponsiveGrid>
            )}
          </TabsContent>

          <TabsContent value="my-communities" className="space-y-6">
            {!user ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Sign in to see your communities
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Join communities and connect with others
                  </p>
                  <Button onClick={() => navigate('/auth')}>
                    Sign In
                  </Button>
                </CardContent>
              </Card>
            ) : loading ? (
              <LoadingSkeleton />
            ) : myCommunities.length === 0 ? (
              <EmptyState
                title="You haven't joined any communities yet"
                description="Discover communities that match your interests"
              />
            ) : (
              <ResponsiveGrid 
                mobileColumns={1}
                tabletColumns={viewMode === 'grid' ? 2 : 1}
                desktopColumns={viewMode === 'grid' ? 3 : 2}
              >
                {myCommunities.map((community) => (
                  <CommunityCard 
                    key={community.id} 
                    community={community} 
                    isMember={true}
                  />
                ))}
              </ResponsiveGrid>
            )}
          </TabsContent>

          <TabsContent value="trending" className="space-y-6">
            {loading ? (
              <LoadingSkeleton />
            ) : (
              <div className="space-y-4">
                {communities.slice(0, 10).map((community, index) => (
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
                          <AvatarImage src={community.avatar_url || ''} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                            {community.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <p className="font-semibold">{community.name}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {community.member_count} members
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-green-500" />
                              +{Math.floor(Math.random() * 50)}% growth
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinCommunity(community.id, !!(community.subscription_price && community.subscription_price > 0));
                        }}
                      >
                        Join
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Create Community Dialog */}
      <CreateCommunityDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
        onSuccess={(communityId) => {
          setShowCreateDialog(false);
          navigate(`/community/${communityId}`);
          toast({
            title: "Success",
            description: "Community created successfully!",
          });
        }}
      />
    </ResponsiveCommunitiesLayout>
  );
};