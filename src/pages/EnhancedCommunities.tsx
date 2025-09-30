import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ModernHeader } from '@/components/ModernHeader';
import { CreateCommunityDialog } from '@/components/CreateCommunityDialog';
import { motion, AnimatePresence } from 'framer-motion';
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
  Trophy,
  Crown,
  Sparkles,
  Filter,
  Grid3x3,
  List,
  ChevronRight,
  Activity,
  DollarSign,
  CheckCircle2,
  Gamepad2,
  Palette,
  Music,
  Briefcase,
  Heart,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Community {
  id: string;
  name: string;
  description: string;
  avatar_url?: string;
  banner_url?: string;
  member_count: number;
  is_private: boolean;
  is_premium?: boolean;
  category?: string;
  created_at: string;
  owner_id: string;
  tags?: string[];
  subscription_price?: number;
  features?: string[];
  activity_level?: 'high' | 'medium' | 'low';
}

interface UserMembership {
  community_id: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joined_at: string;
}

const EnhancedCommunities: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [userMemberships, setUserMemberships] = useState<UserMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('discover');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateDialog(true);
      searchParams.delete('create');
      setSearchParams(searchParams);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchCommunities();
    if (user) {
      fetchUserMemberships();
    }
  }, [filterCategory, user]);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('communities')
        .select('*')
        .order('member_count', { ascending: false });

      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching communities:', error);
        setError('Failed to load communities. Please try again.');
        return;
      }

      // Add mock data for demonstration
      const enhancedData = (data || []).map(community => ({
        ...community,
        is_premium: Math.random() > 0.7,
        subscription_price: Math.random() > 0.7 ? Math.floor(Math.random() * 20) + 5 : 0,
        activity_level: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
        features: ['discussions', 'events', 'leaderboard']
      }));

      setCommunities(enhancedData);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserMemberships = async () => {
    if (!user) return;

    try {
      // Get memberships from community_members
      const { data: memberData, error: memberError } = await supabase
        .from('community_members')
        .select('community_id, role, joined_at')
        .eq('user_id', user.id);

      if (memberError) {
        console.error('Error fetching memberships:', memberError);
      }

      // Also get communities where user is the creator
      const { data: creatorData, error: creatorError } = await supabase
        .from('communities')
        .select('id, created_at')
        .eq('creator_id', user.id);

      if (creatorError) {
        console.error('Error fetching creator communities:', creatorError);
      }

      // Combine both - memberships + created communities
      const memberships: UserMembership[] = [];
      
      // Add from community_members
      if (memberData) {
        memberships.push(...memberData.map(m => ({
          community_id: m.community_id,
          role: m.role as 'owner' | 'admin' | 'moderator' | 'member',
          joined_at: m.joined_at
        })));
      }
      
      // Add communities where user is creator (if not already in the list)
      if (creatorData) {
        creatorData.forEach(c => {
          if (!memberships.some(m => m.community_id === c.id)) {
            memberships.push({
              community_id: c.id,
              role: 'owner',
              joined_at: c.created_at
            });
          }
        });
      }

      console.log('✅ User memberships loaded:', memberships.length);
      setUserMemberships(memberships);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleJoinCommunity = async (communityId: string, isPremium: boolean) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (isPremium) {
      // Navigate to subscription page for premium communities
      navigate(`/community/${communityId}/subscription`);
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

      // Update local state
      setUserMemberships([...userMemberships, {
        community_id: communityId,
        role: 'member',
        joined_at: new Date().toISOString()
      }]);

      // Navigate to community
      navigate(`/community/${communityId}`);
    } catch (err) {
      console.error('Error joining community:', err);
    }
  };

  const filteredCommunities = communities.filter(community => 
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myCommunities = filteredCommunities.filter(community =>
    userMemberships.some(m => m.community_id === community.id)
  );

  const discoverCommunities = filteredCommunities.filter(community =>
    !userMemberships.some(m => m.community_id === community.id)
  );

  const categories = [
    { value: 'all', label: 'All Categories', icon: Grid3x3 },
    { value: 'education', label: 'Education', icon: BookOpen },
    { value: 'technology', label: 'Technology', icon: TrendingUp },
    { value: 'gaming', label: 'Gaming', icon: Gamepad2 },
    { value: 'art', label: 'Art & Design', icon: Palette },
    { value: 'music', label: 'Music', icon: Music },
    { value: 'business', label: 'Business', icon: Briefcase },
    { value: 'health', label: 'Health & Fitness', icon: Heart },
    { value: 'lifestyle', label: 'Lifestyle', icon: Sparkles },
  ];

  const getActivityBadge = (level?: string) => {
    switch (level) {
      case 'high':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"><Activity className="w-3 h-3 mr-1" />Very Active</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"><Activity className="w-3 h-3 mr-1" />Active</Badge>;
      case 'low':
        return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"><Activity className="w-3 h-3 mr-1" />Growing</Badge>;
      default:
        return null;
    }
  };

  const CommunityCard = ({ community, isMember }: { community: Community; isMember: boolean }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={cn(
          "overflow-hidden hover:shadow-xl transition-all cursor-pointer border-0",
          "bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800",
          community.is_premium && "ring-2 ring-yellow-400 dark:ring-yellow-600"
        )}
        onClick={() => navigate(`/community/${community.id}`)}
      >
        {/* Banner Image */}
        <div className="h-24 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative">
          {community.is_premium && (
            <Badge className="absolute top-2 right-2 bg-yellow-400 text-black">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>

        <CardHeader className="relative -mt-8">
          <div className="flex items-start justify-between">
            <Avatar className="w-16 h-16 border-4 border-white dark:border-gray-800">
              <AvatarImage src={community.avatar_url} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl font-bold">
                {community.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col items-end gap-1 mt-8">
              {community.is_private && (
                <Badge variant="secondary" className="text-xs">
                  <Lock className="w-3 h-3 mr-1" />
                  Private
                </Badge>
              )}
              {getActivityBadge(community.activity_level)}
            </div>
          </div>
          
          <div className="mt-2">
            <CardTitle className="text-lg flex items-center gap-2">
              {community.name}
              {isMember && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Joined
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {community.description || 'No description available'}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Stats */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <Users className="w-4 h-4" />
                <span className="font-medium">{community.member_count || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <MessageSquare className="w-4 h-4" />
                <span className="font-medium">{Math.floor(Math.random() * 100)}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">{Math.floor(Math.random() * 10)}</span>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-1">
            {community.features?.map((feature, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>

          {/* Tags */}
          {community.tags && community.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {community.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          <Button 
            className={cn(
              "w-full",
              isMember 
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
                : community.is_premium
                ? "bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-black"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (isMember) {
                navigate(`/community/${community.id}`);
              } else {
                handleJoinCommunity(community.id, community.is_premium || false);
              }
            }}
          >
            {isMember ? (
              <>
                Enter Community
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            ) : community.is_premium ? (
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
        </CardFooter>
      </Card>
    </motion.div>
  );


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <ModernHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4"
          >
            Discover Amazing Communities
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto"
          >
            Connect with like-minded people, share your passions, and grow together in vibrant communities
          </motion.p>
          
          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-8 mt-6"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{communities.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Communities</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {communities.reduce((acc, c) => acc + (c.member_count || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{categories.length - 1}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Categories</div>
            </div>
          </motion.div>
        </div>

        {/* Action Bar */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search communities by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base border-0 bg-white dark:bg-gray-800 shadow-sm"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[200px] h-12 border-0 bg-white dark:bg-gray-800 shadow-sm">
                  <SelectValue placeholder="Select category" />
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

              <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-10"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-10"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              <Button
                onClick={() => setShowCreateDialog(true)}
                className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Community
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 h-12">
            <TabsTrigger value="discover" className="text-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="my-communities" className="text-sm">
              <Users className="w-4 h-4 mr-2" />
              My Communities
            </TabsTrigger>
            <TabsTrigger value="trending" className="text-sm">
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending
            </TabsTrigger>
          </TabsList>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className={cn(
              viewMode === 'grid' 
                ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                : "space-y-4"
            )}>
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-24 w-full" />
                  <CardHeader className="space-y-2">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="discover" className="space-y-6">
                {discoverCommunities.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        No communities to discover
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Be the first to create a community and start building!
                      </p>
                      <Button
                        onClick={() => setShowCreateDialog(true)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Community
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <AnimatePresence mode="popLayout">
                    <div className={cn(
                      viewMode === 'grid' 
                        ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                        : "space-y-4"
                    )}>
                      {discoverCommunities.map((community) => (
                        <CommunityCard 
                          key={community.id} 
                          community={community} 
                          isMember={false}
                        />
                      ))}
                    </div>
                  </AnimatePresence>
                )}
              </TabsContent>

              <TabsContent value="my-communities" className="space-y-6">
                {!user ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Sign in to see your communities
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Join communities and connect with others
                      </p>
                      <Button onClick={() => navigate('/auth')}>
                        Sign In
                      </Button>
                    </CardContent>
                  </Card>
                ) : myCommunities.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        You haven't joined any communities yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Discover communities that match your interests
                      </p>
                      <Button
                        onClick={() => setActiveTab('discover')}
                        variant="outline"
                      >
                        Explore Communities
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <AnimatePresence mode="popLayout">
                    <div className={cn(
                      viewMode === 'grid' 
                        ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                        : "space-y-4"
                    )}>
                      {myCommunities.map((community) => (
                        <CommunityCard 
                          key={community.id} 
                          community={community} 
                          isMember={true}
                        />
                      ))}
                    </div>
                  </AnimatePresence>
                )}
              </TabsContent>

              <TabsContent value="trending" className="space-y-6">
                <div className="grid gap-4">
                  {communities.slice(0, 5).map((community, index) => (
                    <Card 
                      key={community.id}
                      className="hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => navigate(`/community/${community.id}`)}
                    >
                      <CardContent className="flex items-center justify-between p-6">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold text-lg">
                            {index + 1}
                          </div>
                          
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={community.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                              {community.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-lg">{community.name}</p>
                              {community.is_premium && (
                                <Crown className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {community.member_count || 0} members
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-green-500" />
                                +{Math.floor(Math.random() * 100)}% this week
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          size="sm"
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinCommunity(community.id, community.is_premium || false);
                          }}
                        >
                          Join
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Featured Section */}
        {!loading && communities.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500" />
              Featured Communities
            </h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              {communities.filter(c => c.is_premium).slice(0, 2).map((community) => (
                <Card 
                  key={community.id}
                  className="overflow-hidden hover:shadow-xl transition-all cursor-pointer bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800"
                  onClick={() => navigate(`/community/${community.id}`)}
                >
                  <div className="h-32 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400"></div>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={community.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xl">
                          {community.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          {community.name}
                          <Crown className="w-5 h-5 text-yellow-500" />
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          {community.description}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {community.member_count} members
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            ${community.subscription_price}/mo
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Community Dialog */}
      <CreateCommunityDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
        onSuccess={(communityId) => {
          setShowCreateDialog(false);
          navigate(`/community/${communityId}`);
        }}
      />
    </div>
  );
};

export default EnhancedCommunities;