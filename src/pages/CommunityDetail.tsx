import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, Lock, Globe, Settings, Crown } from 'lucide-react';
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

interface CommunityMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

const CommunityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (id && user) {
      fetchCommunityDetails();
      fetchCommunityMembers();
    }
  }, [id, user]);

  const fetchCommunityDetails = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCommunity(data);
    } catch (error) {
      console.error('Error fetching community:', error);
      toast({
        title: "Error",
        description: "Failed to load community details",
        variant: "destructive"
      });
      navigate('/communities');
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunityMembers = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          *,
          profiles (
            display_name,
            avatar_url
          )
        `)
        .eq('community_id', id)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const updateCommunityAvatar = async (avatarUrl: string | null) => {
    if (!community || !user || community.creator_id !== user.id) return;

    setUpdatingAvatar(true);
    try {
      const { error } = await supabase
        .from('communities')
        .update({ avatar_url: avatarUrl })
        .eq('id', community.id);

      if (error) throw error;

      setCommunity({ ...community, avatar_url: avatarUrl });
      toast({
        title: "Success!",
        description: "Community avatar updated successfully"
      });
    } catch (error: any) {
      console.error('Error updating avatar:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update avatar",
        variant: "destructive"
      });
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const isCreator = user && community && community.creator_id === user.id;

  if (authLoading || loading || !community) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-luxury"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="border-b border-luxury/20 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/communities')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Communities
            </Button>
          </div>
          
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full border-2 border-luxury/20 bg-luxury/5 flex items-center justify-center overflow-hidden">
                {community.avatar_url ? (
                  <img
                    src={community.avatar_url}
                    alt={`${community.name} avatar`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="w-12 h-12 text-luxury/60" />
                )}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent flex items-center gap-3">
                    {community.name}
                    {community.is_private ? (
                      <Lock className="h-6 w-6 text-luxury" />
                    ) : (
                      <Globe className="h-6 w-6 text-luxury" />
                    )}
                  </h1>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant={community.is_private ? "secondary" : "outline"}>
                      {community.is_private ? 'Private' : 'Public'}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {community.member_count} members
                    </Badge>
                    {isCreator && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        Creator
                      </Badge>
                    )}
                  </div>
                  {community.description && (
                    <p className="text-muted-foreground mt-3 max-w-2xl">
                      {community.description}
                    </p>
                  )}
                </div>
                
                {isCreator && (
                  <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Community Settings</DialogTitle>
                        <DialogDescription>
                          Manage your community settings and appearance.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        <div className="space-y-2">
                          <h4 className="font-medium">Community Avatar</h4>
                          <AvatarUpload
                            currentAvatarUrl={community.avatar_url}
                            onAvatarChange={updateCommunityAvatar}
                            bucketName="community-avatars"
                            folder="communities"
                            size="lg"
                            className="mx-auto"
                          />
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>About this Community</CardTitle>
              </CardHeader>
              <CardContent>
                {community.description ? (
                  <p className="text-muted-foreground">{community.description}</p>
                ) : (
                  <p className="text-muted-foreground italic">No description provided.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Members ({members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full border border-luxury/20 bg-luxury/5 flex items-center justify-center overflow-hidden">
                        {member.profiles.avatar_url ? (
                          <img
                            src={member.profiles.avatar_url}
                            alt={`${member.profiles.display_name} avatar`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-4 h-4 text-luxury/60" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {member.profiles.display_name || 'Anonymous User'}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {member.role}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityDetail;