import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, Lock, User, Settings } from 'lucide-react';
import { CommunityAvatarUpload } from '@/components/CommunityAvatarUpload';

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
    <div className="min-h-screen bg-white">
      {/* Skool-style Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Top Navigation */}
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/profile')}
              className="flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Profile Settings</span>
            </Button>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Discover communities
            </h1>
            <p className="text-gray-600">
              or <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => setCreateDialogOpen(true)}>create your own</span>
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for anything"
                className="w-full px-4 py-3 pl-12 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <button className="px-4 py-2 bg-white rounded-md text-sm font-medium text-gray-900 shadow-sm">
                All
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md">
                💰 Business
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md">
                🍎 Health & fitness
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md">
                📚 Personal development
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md">
                🎯 More...
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Community Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogTrigger asChild>
          <div className="hidden" />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Community</DialogTitle>
            <DialogDescription>
              Start your own exclusive social group.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
            <div className="space-y-2">
              <CommunityAvatarUpload
                currentAvatarUrl={newCommunity.avatar_url}
                onAvatarUpdate={(avatarUrl) => setNewCommunity({ ...newCommunity, avatar_url: avatarUrl })}
                size="md"
                showLabel={true}
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

      {/* Skool-style Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : communities.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-50 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No communities yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Be the first to create a community and start building your social group.
            </p>
            <button 
              onClick={() => setCreateDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Create First Community
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community, index) => (
              <div key={community.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow relative overflow-hidden group">
                {/* Ranking Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold text-gray-700">
                    #{index + 1}
                  </div>
                </div>
                
                {/* Community Banner */}
                <div className="h-40 relative overflow-hidden">
                  {community.avatar_url ? (
                    <>
                      <img 
                        src={community.avatar_url} 
                        alt={community.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30"></div>
                    </>
                  ) : (
                    <>
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"></div>
                      <div className="absolute inset-0 bg-black/20"></div>
                    </>
                  )}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-bold text-lg mb-1 truncate">
                      {community.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-white/90 text-sm">
                        {community.member_count} Members
                      </span>
                      <span className="text-white/90 text-sm">•</span>
                      <span className="text-white/90 text-sm">
                        {community.is_private ? 'Private' : 'Free'}
                      </span>
                    </div>
                  </div>
                  
                  {community.is_private && (
                    <div className="absolute top-4 right-4">
                      <Lock className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                
                {/* Community Content */}
                <div className="p-6">
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {community.description || 'Join this amazing community to connect with like-minded individuals and grow together.'}
                  </p>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => navigate(`/communities/${community.id}`)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-medium text-sm transition-colors"
                    >
                      View Community
                    </button>
                    <button 
                      onClick={() => joinCommunity(community.id)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors"
                    >
                      Join
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Communities;