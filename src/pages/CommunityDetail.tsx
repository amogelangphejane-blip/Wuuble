import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Users, 
  Lock, 
  Globe, 
  Crown, 
  UserPlus, 
  UserMinus, 
  Settings,
  MessageCircle,
  Calendar,
  Video,
  BookOpen,
  Star,
  MoreVertical
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CommunityPosts } from '@/components/CommunityPosts';
import { CommunitySearch } from '@/components/CommunitySearch';
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

interface CommunityMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

const CommunityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joiningLeaving, setJoiningLeaving] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('discussions');

  const [editingCommunity, setEditingCommunity] = useState({
    name: '',
    description: '',
    avatar_url: null as string | null,
    is_private: false
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (id && user) {
      fetchCommunityDetails();
    }
  }, [id, user]);

  const fetchCommunityDetails = async () => {
    if (!id || !user) return;

    try {
      setLoading(true);
      
      // Fetch community details
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .single();

      if (communityError) throw communityError;
      setCommunity(communityData);
      setIsCreator(communityData.creator_id === user.id);

      // Initialize editing state
      setEditingCommunity({
        name: communityData.name,
        description: communityData.description,
        avatar_url: communityData.avatar_url,
        is_private: communityData.is_private
      });

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('community_members')
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .eq('community_id', id);

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Check if current user is a member
      const userMembership = membersData?.find(member => member.user_id === user.id);
      setIsMember(!!userMembership);

    } catch (error: any) {
      console.error('Error fetching community details:', error);
      toast({
        title: "Error",
        description: "Failed to load community details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const joinCommunity = async () => {
    if (!user || !community) return;

    try {
      setJoiningLeaving(true);
      const { error } = await supabase
        .from('community_members')
        .insert([{
          community_id: community.id,
          user_id: user.id,
          role: 'member'
        }]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Joined community successfully"
      });

      fetchCommunityDetails();
    } catch (error: any) {
      console.error('Error joining community:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to join community",
        variant: "destructive"
      });
    } finally {
      setJoiningLeaving(false);
    }
  };

  const leaveCommunity = async () => {
    if (!user || !community) return;

    try {
      setJoiningLeaving(true);
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', community.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Left community successfully"
      });

      fetchCommunityDetails();
    } catch (error: any) {
      console.error('Error leaving community:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to leave community",
        variant: "destructive"
      });
    } finally {
      setJoiningLeaving(false);
    }
  };

  const updateCommunity = async () => {
    if (!user || !community || !isCreator) return;

    try {
      const { error } = await supabase
        .from('communities')
        .update({
          name: editingCommunity.name,
          description: editingCommunity.description,
          avatar_url: editingCommunity.avatar_url,
          is_private: editingCommunity.is_private
        })
        .eq('id', community.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Community updated successfully"
      });

      setSettingsDialogOpen(false);
      fetchCommunityDetails();
    } catch (error: any) {
      console.error('Error updating community:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update community",
        variant: "destructive"
      });
    }
  };

  const tabs = [
    { id: 'discussions', label: 'Discussions', icon: MessageCircle },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'resources', label: 'Resources', icon: BookOpen }
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-bg">
        <ModernHeader />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-muted rounded mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-96 bg-muted rounded"></div>
              </div>
              <div className="h-96 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gradient-bg">
        <ModernHeader />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Community not found</h1>
          <p className="text-muted-foreground mb-8">The community you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/communities')}>
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Communities
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      <ModernHeader />
      
      {/* Community Header */}
      <section className="relative overflow-hidden">
        {/* Hero Background */}
        <div className="h-80 relative">
          {community.avatar_url ? (
            <>
              <img 
                src={community.avatar_url} 
                alt={community.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
            </>
          ) : (
            <>
              <div className="w-full h-full bg-gradient-hero"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
            </>
          )}
          
          {/* Back Button */}
          <div className="absolute top-6 left-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/communities')}
              className="bg-black/20 hover:bg-black/30 text-white border border-white/20"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back
            </Button>
          </div>

          {/* Community Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-end gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-3xl lg:text-4xl font-bold text-white">
                      {community.name}
                    </h1>
                    {community.is_private && (
                      <Badge variant="secondary" className="bg-black/30 text-white border-white/30">
                        <Lock className="w-3 h-3 mr-1" />
                        Private
                      </Badge>
                    )}
                    {isCreator && (
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-200 border-yellow-400/30">
                        <Crown className="w-3 h-3 mr-1" />
                        Creator
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-white/90 text-lg mb-4 max-w-2xl">
                    {community.description}
                  </p>
                  
                  <div className="flex items-center gap-6 text-white/80">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      <span className="font-medium">{members.length} members</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      <span>{community.is_private ? 'Private' : 'Public'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      <span>Active community</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  {!isMember && !isCreator ? (
                    <Button
                      onClick={joinCommunity}
                      disabled={joiningLeaving}
                      size="lg"
                      className="bg-white text-primary hover:bg-white/90 shadow-lg px-8"
                    >
                      <UserPlus className="mr-2 w-5 h-5" />
                      {joiningLeaving ? 'Joining...' : 'Join Community'}
                    </Button>
                  ) : isMember && !isCreator ? (
                    <Button
                      onClick={leaveCommunity}
                      disabled={joiningLeaving}
                      variant="outline"
                      size="lg"
                      className="border-white/30 text-white hover:bg-white/10"
                    >
                      <UserMinus className="mr-2 w-5 h-5" />
                      {joiningLeaving ? 'Leaving...' : 'Leave'}
                    </Button>
                  ) : null}
                  
                  {isCreator && (
                    <Button
                      onClick={() => setSettingsDialogOpen(true)}
                      variant="outline"
                      size="lg"
                      className="border-white/30 text-white hover:bg-white/10"
                    >
                      <Settings className="mr-2 w-5 h-5" />
                      Settings
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="border-b bg-background/80 backdrop-blur-sm sticky top-16 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-none border-b-2 transition-all
                  ${activeTab === tab.id 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-transparent hover:border-border hover:bg-secondary/50'
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-2">
              {activeTab === 'discussions' && (
                <div className="space-y-6">
                  {(isMember || isCreator) ? (
                    <CommunityPosts communityId={community.id} />
                  ) : (
                    <Card className="text-center py-12">
                      <CardContent>
                        <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Join to see discussions</h3>
                        <p className="text-muted-foreground mb-6">
                          Become a member to participate in community discussions and connect with other learners.
                        </p>
                        <Button onClick={joinCommunity} disabled={joiningLeaving}>
                          <UserPlus className="mr-2 w-4 h-4" />
                          Join Community
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === 'members' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Community Members ({members.length})
                    </CardTitle>
                    <CardDescription>
                      Connect with fellow community members
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={member.profiles?.avatar_url || ''} />
                            <AvatarFallback>
                              {(member.profiles?.display_name || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium">
                              {member.profiles?.display_name || 'Anonymous User'}
                            </div>
                            <div className="text-sm text-muted-foreground capitalize">
                              {member.role}
                              {member.user_id === community.creator_id && (
                                <Crown className="w-3 h-3 inline ml-1 text-yellow-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'events' && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No events scheduled</h3>
                    <p className="text-muted-foreground">
                      Community events and workshops will appear here.
                    </p>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'resources' && (
                <Card>
                  <CardContent className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No resources yet</h3>
                    <p className="text-muted-foreground">
                      Learning resources and materials will be shared here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Video className="mr-2 w-4 h-4" />
                    Start Video Chat
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 w-4 h-4" />
                    Schedule Event
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="mr-2 w-4 h-4" />
                    Share Resource
                  </Button>
                </CardContent>
              </Card>

              {/* Community Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Community Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Members</span>
                    <span className="font-semibold">{members.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-semibold">
                      {new Date(community.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Type</span>
                    <Badge variant={community.is_private ? "secondary" : "default"}>
                      {community.is_private ? 'Private' : 'Public'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Members */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {members.slice(0, 5).map((member) => (
                      <div key={member.id} className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={member.profiles?.avatar_url || ''} />
                          <AvatarFallback className="text-xs">
                            {(member.profiles?.display_name || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {member.profiles?.display_name || 'Anonymous User'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(member.joined_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Settings Dialog */}
      {isCreator && (
        <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Community Settings</DialogTitle>
              <DialogDescription>
                Update your community information and settings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Community Name</label>
                <input
                  type="text"
                  value={editingCommunity.name}
                  onChange={(e) => setEditingCommunity({ ...editingCommunity, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={editingCommunity.description}
                  onChange={(e) => setEditingCommunity({ ...editingCommunity, description: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] resize-none"
                />
              </div>
              <div className="space-y-2">
                <CommunityAvatarUpload
                  currentAvatarUrl={editingCommunity.avatar_url}
                  onAvatarUpdate={(avatarUrl) => setEditingCommunity({ ...editingCommunity, avatar_url: avatarUrl })}
                  size="lg"
                  showLabel={true}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={updateCommunity}
                className="flex-1"
              >
                Update Community
              </Button>
              <Button 
                onClick={() => setSettingsDialogOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CommunityDetail;