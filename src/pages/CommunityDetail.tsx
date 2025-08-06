import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, Lock, Globe, Crown, UserPlus, UserMinus } from 'lucide-react';
import { CommunityPosts } from '@/components/CommunityPosts';

interface Community {
  id: string;
  name: string;
  description: string;
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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) {
      fetchCommunityDetails();
    }
  }, [user, id]);

  const fetchCommunityDetails = async () => {
    if (!id) return;

    try {
      // Fetch community details
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .single();

      if (communityError) {
        console.error('Error fetching community:', communityError);
        toast({
          title: "Error",
          description: "Failed to load community details",
          variant: "destructive",
        });
        navigate('/communities');
        return;
      }

      setCommunity(communityData);
      setIsCreator(communityData.creator_id === user?.id);

      // Fetch community members
      const { data: membersData, error: membersError } = await supabase
        .from('community_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          profiles!community_members_user_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .eq('community_id', id);

      if (membersError) {
        console.error('Error fetching members:', membersError);
      } else {
        setMembers(membersData || []);
        setIsMember(membersData?.some(member => member.user_id === user?.id) || false);
      }

    } catch (error) {
      console.error('Error fetching community details:', error);
      toast({
        title: "Error",
        description: "Failed to load community details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const joinCommunity = async () => {
    if (!community || !user) return;

    setJoiningLeaving(true);
    try {
      const { error } = await supabase
        .from('community_members')
        .insert([
          {
            community_id: community.id,
            user_id: user.id,
            role: 'member'
          }
        ]);

      if (error) {
        console.error('Error joining community:', error);
        toast({
          title: "Error",
          description: "Failed to join community",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `You've joined ${community.name}!`,
      });

      // Refresh community details
      fetchCommunityDetails();

    } catch (error) {
      console.error('Error joining community:', error);
      toast({
        title: "Error",
        description: "Failed to join community",
        variant: "destructive",
      });
    } finally {
      setJoiningLeaving(false);
    }
  };

  const leaveCommunity = async () => {
    if (!community || !user) return;

    setJoiningLeaving(true);
    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', community.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error leaving community:', error);
        toast({
          title: "Error",
          description: "Failed to leave community",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `You've left ${community.name}`,
      });

      // Refresh community details
      fetchCommunityDetails();

    } catch (error) {
      console.error('Error leaving community:', error);
      toast({
        title: "Error",
        description: "Failed to leave community",
        variant: "destructive",
      });
    } finally {
      setJoiningLeaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-luxury/5 via-white to-luxury/10">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading community...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-luxury/5 via-white to-luxury/10">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Community not found</h3>
            <p className="text-muted-foreground mb-6">
              The community you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate('/communities')}>
              Back to Communities
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-luxury/5 via-white to-luxury/10">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-luxury/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/communities')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Communities
              </Button>
              
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-luxury flex items-center gap-2">
                  {community.name}
                  {community.is_private ? (
                    <Lock className="h-5 w-5" />
                  ) : (
                    <Globe className="h-5 w-5" />
                  )}
                  {isCreator && <Crown className="h-5 w-5 text-yellow-500" />}
                </h1>
                
                <div className="flex items-center gap-2">
                  <Badge variant={community.is_private ? "secondary" : "outline"}>
                    {community.is_private ? 'Private' : 'Public'}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {community.member_count} members
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isMember && !isCreator && (
                <Button
                  onClick={joinCommunity}
                  disabled={joiningLeaving}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {joiningLeaving ? 'Joining...' : 'Join Community'}
                </Button>
              )}
              
              {isMember && !isCreator && (
                <Button
                  variant="outline"
                  onClick={leaveCommunity}
                  disabled={joiningLeaving}
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  {joiningLeaving ? 'Leaving...' : 'Leave Community'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Community Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {community.description || 'No description provided.'}
                </CardDescription>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(community.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Members:</span>
                    <span>{community.member_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{community.is_private ? 'Private' : 'Public'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Members List */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Members ({members.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">
                          {member.profiles?.display_name || 'Anonymous User'}
                        </span>
                      </div>
                      {member.role !== 'member' && (
                        <Badge variant="secondary" className="text-xs">
                          {member.role}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Community Posts */}
          <div className="lg:col-span-2">
            {isMember || isCreator || !community.is_private ? (
              <CommunityPosts 
                communityId={community.id} 
                communityName={community.name}
              />
            ) : (
              <Card className="h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Private Community</h3>
                  <p className="text-muted-foreground mb-4">
                    You need to join this community to see the discussion.
                  </p>
                  <Button onClick={joinCommunity} disabled={joiningLeaving}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {joiningLeaving ? 'Joining...' : 'Join Community'}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityDetail;