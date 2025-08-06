import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, Lock, Globe, Crown } from 'lucide-react';
import { AvatarUpload } from '@/components/ui/avatar-upload';

interface Community {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  is_private: boolean;
  member_count: number;
  creator_id: string;
  created_at: string;
}

const Communities = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
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

  const fetchCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommunities(data || []);
    } catch (error) {
      console.error('Error fetching communities:', error);
      toast({
        title: "Error",
        description: "Failed to load communities",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createCommunity = async () => {
    if (!user) return;

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('communities')
        .insert([{
          name: newCommunity.name,
          description: newCommunity.description,
          avatar_url: newCommunity.avatar_url,
          is_private: newCommunity.is_private,
          creator_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Add creator as admin member
      await supabase
        .from('community_members')
        .insert([{
          community_id: data.id,
          user_id: user.id,
          role: 'admin'
        }]);

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
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="border-b border-luxury/20 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-luxury" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Communities
                </h1>
                <p className="text-muted-foreground">Discover and join exclusive social groups</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary hover:opacity-90 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Community
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Community</DialogTitle>
                    <DialogDescription>
                      Start your own exclusive social group within Inner Circle.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Community Avatar</Label>
                      <AvatarUpload
                        currentAvatarUrl={newCommunity.avatar_url}
                        onAvatarChange={(avatarUrl) => setNewCommunity({ ...newCommunity, avatar_url: avatarUrl })}
                        bucketName="community-avatars"
                        folder="communities"
                        size="lg"
                        className="mx-auto"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Community Name</Label>
                      <Input
                        id="name"
                        placeholder="Enter community name"
                        value={newCommunity.name}
                        onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your community"
                        value={newCommunity.description}
                        onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="private"
                        checked={newCommunity.is_private}
                        onCheckedChange={(checked) => setNewCommunity({ ...newCommunity, is_private: checked })}
                      />
                      <Label htmlFor="private">Private Community</Label>
                    </div>
                  </div>
                  <Button 
                    onClick={createCommunity}
                    disabled={isCreating || !newCommunity.name.trim()}
                    className="w-full"
                  >
                    {isCreating ? 'Creating...' : 'Create Community'}
                  </Button>
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-6 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : communities.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No communities yet</h3>
            <p className="text-muted-foreground mb-6">
              Be the first to create a community and start building your social group.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Community
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <Card key={community.id} className="border-luxury/20 shadow-luxury hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full border-2 border-luxury/20 bg-luxury/5 flex items-center justify-center overflow-hidden">
                        {community.avatar_url ? (
                          <img
                            src={community.avatar_url}
                            alt={`${community.name} avatar`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-8 h-8 text-luxury/60" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2 flex items-center gap-2">
                        {community.name}
                        {community.is_private ? (
                          <Lock className="h-4 w-4 text-luxury" />
                        ) : (
                          <Globe className="h-4 w-4 text-luxury" />
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={community.is_private ? "secondary" : "outline"}>
                          {community.is_private ? 'Private' : 'Public'}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {community.member_count}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm mb-4 line-clamp-3">
                    {community.description || 'No description provided.'}
                  </CardDescription>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => joinCommunity(community.id)}
                    >
                      Join Community
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate(`/communities/${community.id}`)}
                    >
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Communities;