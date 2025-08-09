import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, Lock, Search, Plus, Filter, TrendingUp, Star, Eye } from 'lucide-react';
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

const Communities = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
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
    { name: 'All', icon: '🌐', count: 0 },
    { name: 'Business', icon: '💼', count: 0 },
    { name: 'Technology', icon: '💻', count: 0 },
    { name: 'Health & Fitness', icon: '🏃', count: 0 },
    { name: 'Personal Development', icon: '📚', count: 0 },
    { name: 'Creative', icon: '🎨', count: 0 }
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
  }, [communities, searchQuery, selectedCategory]);

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

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      <ModernHeader />
      
      {/* Hero Section */}
      <section className="bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4 bg-white/20 text-white border-white/30 hover:bg-white/30">
              <Users className="w-4 h-4 mr-2" />
              {communities.length} Active Communities
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Discover Amazing Communities
            </h1>
            <p className="text-lg text-white/90 mb-8">
              Join vibrant learning communities or create your own space for growth and collaboration
            </p>
            <Button 
              size="lg"
              onClick={() => setCreateDialogOpen(true)}
              className="bg-white text-primary hover:bg-white/90 shadow-lg px-8 py-3 text-lg font-semibold"
            >
              <Plus className="mr-2 w-5 h-5" />
              Create Community
            </Button>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search communities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-background border-border/50 focus:border-primary"
                />
              </div>
              <Button variant="outline" size="lg" className="px-6">
                <Filter className="mr-2 w-4 h-4" />
                Filters
              </Button>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <Button
                  key={category.name}
                  variant={selectedCategory === category.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.name)}
                  className={`
                    ${selectedCategory === category.name 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'hover:bg-secondary'
                    }
                  `}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Communities Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg shadow-md animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg"></div>
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
              <div className="bg-muted/50 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Users className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-3">
                {searchQuery ? 'No communities found' : 'No communities yet'}
              </h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                {searchQuery 
                  ? 'Try adjusting your search terms or browse all communities.'
                  : 'Be the first to create a community and start building your learning network.'
                }
              </p>
              <Button 
                size="lg"
                onClick={() => setCreateDialogOpen(true)}
                className="bg-gradient-hero hover:opacity-90 text-white shadow-lg px-8"
              >
                <Plus className="mr-2 w-5 h-5" />
                Create First Community
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCommunities.map((community, index) => (
                <div 
                  key={community.id} 
                  className="bg-card rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Community Header */}
                  <div className="relative h-48 overflow-hidden">
                    {community.avatar_url ? (
                      <>
                        <img 
                          src={community.avatar_url} 
                          alt={community.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      </>
                    ) : (
                      <>
                        <div className="w-full h-full bg-gradient-hero"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                      </>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-4 left-4">
                      <Badge variant="secondary" className="bg-white/90 text-foreground">
                        #{index + 1}
                      </Badge>
                    </div>
                    
                    {community.is_private && (
                      <div className="absolute top-4 right-4">
                        <Badge variant="secondary" className="bg-black/20 text-white border-white/20">
                          <Lock className="w-3 h-3 mr-1" />
                          Private
                        </Badge>
                      </div>
                    )}

                    {/* Community Title Overlay */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-bold text-lg mb-1 truncate">
                        {community.name}
                      </h3>
                      <div className="flex items-center gap-2 text-white/90 text-sm">
                        <Users className="w-4 h-4" />
                        <span>{community.member_count} members</span>
                        {!community.is_private && (
                          <>
                            <span>•</span>
                            <span>Free</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Community Content */}
                  <div className="p-6">
                    <p className="text-muted-foreground text-sm mb-6 line-clamp-3 leading-relaxed">
                      {community.description || 'Join this amazing community to connect with like-minded individuals and grow together.'}
                    </p>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => navigate(`/communities/${community.id}`)}
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button 
                        onClick={() => joinCommunity(community.id)}
                        variant="outline"
                        className="flex-1 hover:bg-secondary"
                      >
                        Join
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Create Community Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Create New Community</DialogTitle>
            <DialogDescription className="text-base">
              Start your own learning community and bring people together around shared interests.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Community Name</Label>
              <Input
                id="name"
                placeholder="Enter a catchy community name"
                value={newCommunity.name}
                onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                placeholder="What's your community about? What will members learn and discuss?"
                value={newCommunity.description}
                onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                className="min-h-[100px] resize-none"
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
            <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg">
              <Switch
                id="private"
                checked={newCommunity.is_private}
                onCheckedChange={(checked) => setNewCommunity({ ...newCommunity, is_private: checked })}
              />
              <div className="flex-1">
                <Label htmlFor="private" className="text-sm font-medium cursor-pointer">
                  Private Community
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Only invited members can join and see content
                </p>
              </div>
            </div>
          </div>
          <Button 
            onClick={createCommunity}
            disabled={isCreating || !newCommunity.name.trim()}
            className="w-full h-12 bg-gradient-hero hover:opacity-90 text-white font-semibold"
          >
            {isCreating ? (
              <>Creating...</>
            ) : (
              <>
                <Plus className="mr-2 w-5 h-5" />
                Create Community
              </>
            )}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Communities;