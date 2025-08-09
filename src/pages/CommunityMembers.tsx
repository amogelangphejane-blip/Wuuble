import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Users, Search, Crown, UserPlus, Mail, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CommunitySearch } from '@/components/CommunitySearch';

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

const CommunityMembers = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<CommunityMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);

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

  useEffect(() => {
    const filtered = members.filter(member => {
      const displayName = member.profiles?.display_name || 'Anonymous User';
      return displayName.toLowerCase().includes(searchTerm.toLowerCase());
    });
    setFilteredMembers(filtered);
  }, [searchTerm, members]);

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

      // Fetch profiles separately
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

      if (!membersError) {
        setMembers(enrichedMembers);
        setFilteredMembers(enrichedMembers);
      }
    } catch (error) {
      console.error('Error fetching community details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading members...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Community not found</h3>
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
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/communities/${id}`)}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to {community.name}
              </button>
            </div>
            <div className="flex items-center gap-3">
              {isCreator && (
                <CommunitySearch communityId={community.id} isCreator={isCreator} />
              )}
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Members
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Members</h1>
            <Badge variant="secondary" className="ml-2">
              {members.length} members
            </Badge>
          </div>
          <p className="text-gray-600">
            Connect with other members of {community.name}.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Members List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>All Members ({filteredMembers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMembers.map((member) => (
                    <div key={member.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage 
                            src={member.profiles?.avatar_url || undefined} 
                            alt={member.profiles?.display_name || 'Member'}
                            onError={() => {
                              console.warn('Member avatar failed to load:', member.profiles?.avatar_url);
                            }}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                            {(member.profiles?.display_name || 'A')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {member.profiles?.display_name || 'Anonymous User'}
                            </h3>
                            {member.user_id === community?.creator_id && (
                              <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                            )}
                          </div>
                          {member.role !== 'member' && (
                            <Badge variant="outline" className="text-xs mb-2 capitalize">
                              {member.role}
                            </Badge>
                          )}
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                            <Calendar className="h-3 w-3" />
                            <span>Joined {new Date(member.joined_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              <Mail className="h-3 w-3 mr-1" />
                              Message
                            </Button>
                            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {filteredMembers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No members found matching your search.' : 'No members found.'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Member Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Members</span>
                  <span className="font-semibold">{members.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Today</span>
                  <span className="font-semibold text-green-600">
                    {Math.floor(members.length * 0.3)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">New This Week</span>
                  <span className="font-semibold text-blue-600">
                    {Math.floor(members.length * 0.1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Moderators</span>
                  <span className="font-semibold">
                    {members.filter(m => m.role === 'moderator' || m.user_id === community?.creator_id).length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Member Roles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Creator</span>
                    </div>
                    <Badge variant="outline">1</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Moderators</span>
                    </div>
                    <Badge variant="outline">
                      {members.filter(m => m.role === 'moderator').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                      <span className="text-sm">Members</span>
                    </div>
                    <Badge variant="outline">
                      {members.filter(m => m.role === 'member').length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">3 new members joined today</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">12 members active in last hour</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-600">5 new discussions started</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityMembers;