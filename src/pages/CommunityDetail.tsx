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

      // Fetch community members with profiles
      const { data: membersData, error: membersError } = await supabase
        .from('community_members')
        .select(`
          id,
          user_id,
          role,
          joined_at
        `)
        .eq('community_id', id);

      // Fetch profiles separately for now to avoid the foreign key issue
      let enrichedMembers: CommunityMember[] = [];
      if (membersData) {
        const userIds = membersData.map(m => m.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);

        enrichedMembers = membersData.map(member => ({
          ...member,
          profiles: profilesData?.find(p => p.user_id === member.user_id) || null
        }));
      }

      if (membersError) {
        console.error('Error fetching members:', membersError);
      } else {
        setMembers(enrichedMembers);
        setIsMember(enrichedMembers.some(member => member.user_id === user?.id) || false);
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
    <div className="min-h-screen bg-white">
      {/* Skool-style Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/communities')}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Communities
              </button>
            </div>

            <div className="flex items-center gap-3">
              {!isMember && !isCreator && (
                <button
                  onClick={joinCommunity}
                  disabled={joiningLeaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {joiningLeaving ? 'Joining...' : 'Join Community'}
                </button>
              )}
              
              {isMember && !isCreator && (
                <button
                  onClick={leaveCommunity}
                  disabled={joiningLeaving}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  {joiningLeaving ? 'Leaving...' : 'Leave Community'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Community Hero Section */}
      <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 relative">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="max-w-6xl mx-auto px-6 py-16 relative">
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-3 mb-4">
              <h1 className="text-4xl font-bold">
                {community.name}
              </h1>
              {community.is_private && <Lock className="h-6 w-6" />}
              {isCreator && <Crown className="h-6 w-6 text-yellow-400" />}
            </div>
            
            <p className="text-white/90 text-lg mb-6 max-w-2xl mx-auto">
              {community.description || 'Welcome to our amazing community! Connect, learn, and grow together.'}
            </p>
            
            <div className="flex items-center justify-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="font-medium">{community.member_count} Members</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <span className="font-medium">{community.is_private ? 'Private' : 'Public'} Community</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Created {new Date(community.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skool-style Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Navigation Menu */}
            <div className="bg-white rounded-lg border p-4 mb-6">
              <nav className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg">
                  💬 Discussion
                </button>
                <button className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                  📚 Classroom
                </button>
                <button className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                  📅 Calendar
                </button>
                <button className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                  👥 Members
                </button>
                <button className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                  ℹ️ About
                </button>
              </nav>
            </div>

            {/* Members List */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Members ({members.length})</h3>
              <div className="space-y-3">
                {members.slice(0, 8).map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {(member.profiles?.display_name || 'A')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {member.profiles?.display_name || 'Anonymous User'}
                        </div>
                        {member.role !== 'member' && (
                          <div className="text-xs text-gray-500 capitalize">{member.role}</div>
                        )}
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                ))}
                {members.length > 8 && (
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View all {members.length} members
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {isMember || isCreator || !community.is_private ? (
              <div className="bg-white rounded-lg border">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Community Discussion</h2>
                  <p className="text-gray-600">Share updates, ask questions, and connect with the community.</p>
                </div>
                
                <div className="h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.565-.372l-3.6 1.8a.75.75 0 01-1.06-.671V14.5A8 8 0 013 12a8 8 0 018-8h.01M21 12a8 8 0 01-8 8v0a8 8 0 01-8-8" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Discussion Coming Soon</h3>
                    <p className="text-gray-600">
                      Community discussion features are being updated to provide the best experience.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Private Community</h3>
                  <p className="text-gray-600 mb-6">
                    You need to join this community to see the discussion.
                  </p>
                  <button 
                    onClick={joinCommunity} 
                    disabled={joiningLeaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {joiningLeaving ? 'Joining...' : 'Join Community'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityDetail;