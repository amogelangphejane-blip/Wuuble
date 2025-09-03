import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Lock, 
  Search, 
  Plus, 
  Filter, 
  TrendingUp, 
  Star, 
  Eye, 
  Crown,
  Flame,
  Clock,
  Globe,
  Grid3X3,
  List,
  ArrowRight,
  Sparkles,
  Target,
  Zap
} from 'lucide-react';
import { CommunityAvatarUpload } from '@/components/CommunityAvatarUpload';
import { ModernHeader } from '@/components/ModernHeader';

interface Community {
  id: string;
  name: string;
  description: string;
  avatar_url?: string | null;
  is_private: boolean;
  member_count: number;
  creator_id: string;
  created_at: string;
}

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'trending' | 'new' | 'popular' | 'featured';

const Communities = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    avatar_url: null as string | null,
    is_private: false
  });
  const [isCreating, setIsCreating] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const categories = [
    { name: 'All', icon: '🌐', count: 0, color: 'from-blue-500 to-purple-500' },
    { name: 'Business', icon: '💼', count: 0, color: 'from-green-500 to-teal-500' },
    { name: 'Technology', icon: '💻', count: 0, color: 'from-purple-500 to-pink-500' },
    { name: 'Health & Fitness', icon: '🏃', count: 0, color: 'from-orange-500 to-red-500' },
    { name: 'Personal Development', icon: '📚', count: 0, color: 'from-yellow-500 to-orange-500' },
    { name: 'Creative', icon: '🎨', count: 0, color: 'from-pink-500 to-rose-500' }
  ];

  const filterOptions = [
    { value: 'all', label: 'All Communities', icon: Globe },
    { value: 'trending', label: 'Trending', icon: TrendingUp },
    { value: 'new', label: 'Newest', icon: Clock },
    { value: 'popular', label: 'Most Popular', icon: Flame },
    { value: 'featured', label: 'Featured', icon: Star }
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCommunities();
    }
  }, [user]);

  useEffect(() => {
    filterCommunities();
  }, [communities, searchQuery, selectedCategory, filterType]);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('communities')
        .select(`
          *,
          community_members!inner(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const communitiesWithCounts = data?.map(community => ({
        ...community,
        member_count: community.community_members?.length || 0
      })) || [];

      setCommunities(communitiesWithCounts);
    } catch (error: any) {
      console.error('Error fetching communities:', error);
      toast({
        title: "Error",
        description: "Failed to fetch communities",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCommunities = () => {
    let filtered = communities;

    if (searchQuery) {
      filtered = filtered.filter(community =>
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'All') {
      // In a real app, you'd have category data in your database
      // For now, we'll just show all communities for any category
    }

    // Apply filter type sorting
    switch (filterType) {
      case 'trending':
        filtered = filtered.sort((a, b) => b.member_count - a.member_count);
        break;
      case 'new':
        filtered = filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'popular':
        filtered = filtered.sort((a, b) => b.member_count - a.member_count);
        break;
      case 'featured':
        // Featured communities would be marked in database, for now show top communities
        filtered = filtered.sort((a, b) => b.member_count - a.member_count).slice(0, 6);
        break;
      default:
        break;
    }

    setFilteredCommunities(filtered);
  };

  const createCommunity = async () => {
    if (!user || !newCommunity.name.trim()) return;

    try {
      setIsCreating(true);
      const { data, error } = await supabase
        .from('communities')
        .insert([{
          name: newCommunity.name.trim(),
          description: newCommunity.description.trim(),
          avatar_url: newCommunity.avatar_url,
          is_private: newCommunity.is_private,
          creator_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Add creator as admin member
      if (data) {
        await supabase
          .from('community_members')
          .insert([{
            community_id: data.id,
            user_id: user.id,
            role: 'admin'
          }]);
      }

      toast({
        title: "Success!",
        description: "Community created successfully"
      });

      setNewCommunity({ name: '', description: '', avatar_url: null, is_private: false });
      setCreateDialogOpen(false);
      fetchCommunities();
    } catch (error: any) {
      console.error('Error creating community:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create community",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const joinCommunity = async (communityId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('community_members')
        .insert([{
          community_id: communityId,
          user_id: user.id,
          role: 'member'
        }]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Joined community successfully"
      });

      fetchCommunities();
    } catch (error: any) {
      console.error('Error joining community:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to join community",
        variant: "destructive"
      });
    }
  };

  const renderCommunityCard = (community: Community, index: number) => (
    <div 
      key={community.id} 
      className="group bg-card rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden animate-fade-in hover:scale-[1.02] border border-border/50"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Community Header with Enhanced Visual */}
      <div className="relative h-52 overflow-hidden">
        {community.avatar_url ? (
          <>
            <img 
              src={community.avatar_url} 
              alt={community.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          </>
        ) : (
          <>
            <div className={`w-full h-full bg-gradient-to-br ${categories.find(c => c.name === selectedCategory)?.color || 'from-blue-500 to-purple-500'}`}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"></div>
          </>
        )}
        
        {/* Enhanced Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge variant="secondary" className="bg-white/95 text-foreground font-semibold shadow-sm">
            #{index + 1}
          </Badge>
          {community.member_count > 50 && (
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-sm">
              <Crown className="w-3 h-3 mr-1" />
              Popular
            </Badge>
          )}
        </div>
        
        {community.is_private && (
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="bg-black/30 text-white border-white/20 backdrop-blur-sm">
              <Lock className="w-3 h-3 mr-1" />
              Private
            </Badge>
          </div>
        )}

        {/* Enhanced Community Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <h3 className="text-white font-bold text-xl mb-2 truncate">
            {community.name}
          </h3>
          <div className="flex items-center gap-3 text-white/90 text-sm">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span className="font-medium">{community.member_count}</span>
              <span>members</span>
            </div>
            {!community.is_private && (
              <>
                <span className="text-white/60">•</span>
                <Badge variant="outline" className="border-white/30 text-white bg-white/10 text-xs">
                  Free to Join
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Eye className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
      
      {/* Enhanced Community Content */}
      <div className="p-6">
        <p className="text-muted-foreground text-sm mb-6 line-clamp-3 leading-relaxed">
          {community.description || 'Join this amazing community to connect with like-minded individuals and grow together.'}
        </p>
        
        {/* Enhanced Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={() => navigate(`/communities/${community.id}`)}
            className="flex-1 bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Eye className="w-4 h-4 mr-2" />
            Explore
          </Button>
          <Button 
            onClick={() => joinCommunity(community.id)}
            variant="outline"
            className="flex-1 hover:bg-secondary border-2 hover:border-primary/20 transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Join
          </Button>
        </div>
      </div>
    </div>
  );

  const renderCommunityListItem = (community: Community, index: number) => (
    <div 
      key={community.id} 
      className="group bg-card rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden animate-fade-in border border-border/50"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="p-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-primary to-primary-light">
              {community.avatar_url ? (
                <img 
                  src={community.avatar_url} 
                  alt={community.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
            {community.member_count > 50 && (
              <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 text-xs px-1.5 py-0.5">
                <Crown className="w-3 h-3" />
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-lg text-foreground truncate pr-4">
                {community.name}
              </h3>
              <Badge variant="secondary" className="text-xs font-medium">
                #{index + 1}
              </Badge>
            </div>
            
            <p className="text-muted-foreground text-sm mb-3 line-clamp-2 leading-relaxed">
              {community.description || 'Join this amazing community to connect with like-minded individuals and grow together.'}
            </p>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span className="font-medium">{community.member_count}</span>
                <span>members</span>
              </div>
              {community.is_private ? (
                <div className="flex items-center gap-1">
                  <Lock className="w-4 h-4" />
                  <span>Private</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  <span>Public</span>
                </div>
              )}
              <span>•</span>
              <span>Created {new Date(community.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 ml-4">
            <Button 
              onClick={() => navigate(`/communities/${community.id}`)}
              size="sm"
              className="bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary text-primary-foreground"
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button 
              onClick={() => joinCommunity(community.id)}
              variant="outline"
              size="sm"
              className="hover:bg-secondary border-2 hover:border-primary/20"
            >
              Join
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      <ModernHeader />
      
      {/* Enhanced Hero Section */}
      <section className="bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        {/* Community hands image overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{
            backgroundImage: 'url(/assets/community-hands.jpg), url(/assets/community-hands-placeholder.svg)',
            backgroundBlendMode: 'soft-light'
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 animate-float opacity-20">
          <div className="w-16 h-16 bg-white/10 rounded-full backdrop-blur-sm"></div>
        </div>
        <div className="absolute top-40 right-20 animate-float opacity-20" style={{ animationDelay: '2s' }}>
          <div className="w-12 h-12 bg-white/10 rounded-full backdrop-blur-sm"></div>
        </div>
        <div className="absolute bottom-20 left-1/4 animate-float opacity-20" style={{ animationDelay: '4s' }}>
          <div className="w-8 h-8 bg-white/10 rounded-full backdrop-blur-sm"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/30 text-sm px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              {communities.length} Active Communities
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Discover Amazing
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Communities
              </span>
            </h1>
            <p className="text-xl text-white/90 mb-10 leading-relaxed">
              Join vibrant learning communities or create your own space for growth, collaboration, and meaningful connections
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg"
                onClick={() => setCreateDialogOpen(true)}
                className="bg-white text-primary hover:bg-white/90 shadow-xl px-8 py-4 text-lg font-semibold rounded-xl"
              >
                <Plus className="mr-2 w-5 h-5" />
                Create Community
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 dark:bg-white/10 dark:border-white/30 dark:text-white dark:hover:bg-white/20 px-8 py-4 text-lg font-semibold rounded-xl backdrop-blur-sm"
                onClick={() => document.getElementById('communities-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Target className="mr-2 w-5 h-5" />
                Explore Communities
              </Button>
            </div>
          </div>
        </div>
      </section>



      {/* Enhanced Search and Filters Section */}
      <section className="py-8 bg-muted/30 border-b border-border/50" id="communities-section">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Search Bar */}
            <div className="flex flex-col lg:flex-row gap-6 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search communities by name, description, or interests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 bg-background border-border/50 focus:border-primary rounded-xl text-lg shadow-sm"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setSearchQuery('')}
                  >
                    ×
                  </Button>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className={`px-6 rounded-xl ${showFilters ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="mr-2 w-4 h-4" />
                  Filters
                </Button>
                
                {/* View Mode Toggle */}
                <div className="flex items-center border border-border rounded-xl overflow-hidden">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="lg"
                    onClick={() => setViewMode('grid')}
                    className="rounded-none"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="lg"
                    onClick={() => setViewMode('list')}
                    className="rounded-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Enhanced Filter Tabs */}
            <Tabs value={filterType} onValueChange={(value) => setFilterType(value as FilterType)} className="mb-6">
              <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5 bg-background/50 backdrop-blur-sm rounded-xl p-1">
                {filterOptions.map((option) => (
                  <TabsTrigger 
                    key={option.value} 
                    value={option.value}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <option.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{option.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Category Filters - Enhanced Design */}
            {showFilters && (
              <div className="animate-fade-in">
                <h4 className="text-lg font-semibold mb-4 text-foreground">Browse by Category</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {categories.map((category) => (
                    <Button
                      key={category.name}
                      variant={selectedCategory === category.name ? "default" : "outline"}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`
                        h-auto py-4 px-4 rounded-xl transition-all duration-200 flex flex-col items-center gap-2
                        ${selectedCategory === category.name 
                          ? 'bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-lg scale-105' 
                          : 'hover:bg-secondary hover:scale-105 hover:shadow-md'
                        }
                      `}
                    >
                      <span className="text-2xl">{category.icon}</span>
                      <span className="text-sm font-medium">{category.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Enhanced Communities Section */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Trending Communities Section - Show when not filtering */}
            {!loading && filterType === 'all' && !searchQuery && communities.length > 0 && (
              <div className="mb-16">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                        <Flame className="w-5 h-5 text-white" />
                      </div>
                      Trending Communities
                    </h2>
                    <p className="text-muted-foreground text-lg">
                      Join the most active and growing communities right now
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setFilterType('trending')}
                    className="hover:bg-secondary rounded-xl"
                  >
                    View All Trending
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {communities
                    .sort((a, b) => b.member_count - a.member_count)
                    .slice(0, 3)
                    .map((community, index) => (
                      <div 
                        key={`trending-${community.id}`}
                        className="group bg-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden animate-fade-in border border-border/50 relative"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        {/* Trending Badge */}
                        <div className="absolute top-4 left-4 z-10">
                          <Badge className="bg-gradient-to-r from-orange-400 to-red-500 text-white border-0 shadow-lg">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            #{index + 1} Trending
                          </Badge>
                        </div>

                        {/* Enhanced Visual */}
                        <div className="relative h-48 overflow-hidden">
                          {community.avatar_url ? (
                            <>
                              <img 
                                src={community.avatar_url} 
                                alt={community.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                            </>
                          ) : (
                            <>
                              <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500"></div>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
                            </>
                          )}

                          {/* Enhanced Title */}
                          <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-white font-bold text-xl mb-2 truncate">
                              {community.name}
                            </h3>
                            <div className="flex items-center gap-2 text-white/90 text-sm">
                              <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-1 backdrop-blur-sm">
                                <Users className="w-4 h-4" />
                                <span className="font-bold">{community.member_count}</span>
                              </div>
                              <div className="flex items-center gap-1 bg-green-500/80 rounded-full px-2 py-1 backdrop-blur-sm">
                                <Zap className="w-3 h-3" />
                                <span className="text-xs font-medium">Active</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-6">
                          <p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed">
                            {community.description || 'Join this trending community to connect with like-minded individuals.'}
                          </p>
                          
                          <Button 
                            onClick={() => navigate(`/communities/${community.id}`)}
                            className="w-full bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-xl"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Join Trending Community
                          </Button>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Results Header */}
            {!loading && filteredCommunities.length > 0 && (
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {filterType === 'all' ? 'All Communities' : 
                     filterType === 'trending' ? 'Trending Communities' :
                     filterType === 'new' ? 'Newest Communities' :
                     filterType === 'popular' ? 'Most Popular' :
                     'Featured Communities'}
                  </h2>
                  <p className="text-muted-foreground">
                    {filteredCommunities.length} communit{filteredCommunities.length !== 1 ? 'ies' : 'y'} found
                    {searchQuery && ` for "${searchQuery}"`}
                  </p>
                </div>
                
                {filterType === 'trending' && (
                  <Badge className="bg-gradient-to-r from-orange-400 to-red-500 text-white border-0 px-3 py-1">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Hot Right Now
                  </Badge>
                )}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-card rounded-2xl shadow-md animate-pulse overflow-hidden">
                    <div className="h-52 bg-muted"></div>
                    <div className="p-6">
                      <div className="h-4 bg-muted rounded mb-3"></div>
                      <div className="h-3 bg-muted rounded w-3/4 mb-4"></div>
                      <div className="h-10 bg-muted rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCommunities.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-full p-8 w-32 h-32 mx-auto mb-8 flex items-center justify-center">
                  <Users className="h-16 w-16 text-muted-foreground" />
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-4">
                  {searchQuery ? 'No communities found' : 'No communities yet'}
                </h3>
                <p className="text-muted-foreground mb-10 max-w-md mx-auto text-lg leading-relaxed">
                  {searchQuery 
                    ? 'Try adjusting your search terms or browse all communities.'
                    : 'Be the first to create a community and start building your learning network.'
                  }
                </p>
                <Button 
                  size="lg"
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-gradient-hero hover:opacity-90 text-white shadow-xl px-10 py-4 text-lg font-semibold rounded-xl"
                >
                  <Plus className="mr-2 w-5 h-5" />
                  Create First Community
                </Button>
              </div>
            ) : (
              <>
                {/* Communities Display */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCommunities.map(renderCommunityCard)}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredCommunities.map(renderCommunityListItem)}
                  </div>
                )}

                {/* Load More Section */}
                {filteredCommunities.length >= 12 && (
                  <div className="text-center mt-12">
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="px-8 py-3 rounded-xl hover:bg-secondary"
                    >
                      Load More Communities
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      {!loading && communities.length > 0 && (
        <section className="py-16 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Get Started?</h2>
              <p className="text-muted-foreground text-lg mb-8">
                Join thousands of learners in our vibrant community ecosystem
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-border/50">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Explore & Discover</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Browse through diverse communities and find your perfect learning environment
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full rounded-xl"
                    onClick={() => setFilterType('all')}
                  >
                    Browse All
                  </Button>
                </div>
                
                <div className="bg-card p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-border/50">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Create Your Own</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Start your own community and build a space for learning and growth
                  </p>
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    Create Now
                  </Button>
                </div>
                
                <div className="bg-card p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-border/50">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Join Trending</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Connect with the most active and engaging communities right now
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full rounded-xl hover:bg-orange-50 hover:border-orange-200"
                    onClick={() => setFilterType('trending')}
                  >
                    See Trending
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Enhanced Create Community Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="text-center pb-4 flex-shrink-0">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-3xl font-bold">Create New Community</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Start your own learning community and bring people together around shared interests and goals.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 overflow-y-auto flex-1 px-1">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">Community Name</Label>
              <Input
                id="name"
                placeholder="Enter a catchy community name"
                value={newCommunity.name}
                onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                className="h-12 rounded-xl border-2 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
              <Textarea
                id="description"
                placeholder="What's your community about? What will members learn and discuss?"
                value={newCommunity.description}
                onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                className="min-h-[120px] resize-none rounded-xl border-2 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <CommunityAvatarUpload
                currentAvatarUrl={newCommunity.avatar_url}
                onAvatarUpdate={(avatarUrl) => setNewCommunity({ ...newCommunity, avatar_url: avatarUrl })}
                size="lg"
                showLabel={true}
              />
            </div>
            <div className="flex items-center space-x-4 p-6 bg-gradient-to-r from-muted/30 to-muted/20 rounded-xl border border-border/50">
              <Switch
                id="private"
                checked={newCommunity.is_private}
                onCheckedChange={(checked) => setNewCommunity({ ...newCommunity, is_private: checked })}
              />
              <div className="flex-1">
                <Label htmlFor="private" className="text-sm font-semibold cursor-pointer flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Private Community
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Only invited members can join and see content
                </p>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 pt-4">
            <Button 
              onClick={createCommunity}
              disabled={isCreating || !newCommunity.name.trim()}
              className="w-full h-14 bg-gradient-hero hover:opacity-90 text-white font-bold text-lg rounded-xl shadow-lg"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Creating Community...
                </>
              ) : (
                <>
                  <Zap className="mr-2 w-5 h-5" />
                  Create Community
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Communities;