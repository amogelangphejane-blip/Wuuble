import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useEnsureProfile } from '@/hooks/useEnsureProfile';
import {
  ArrowLeft,
  Users,
  Search,
  Crown,
  Shield,
  MoreVertical,
  UserPlus,
  MessageCircle,
  UserMinus,
  UserCheck,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface CommunityMember {
  id: string;
  user_id: string;
  community_id: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joined_at: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  } | null;
}

interface Community {
  id: string;
  name: string;
  description: string;
  avatar_url?: string;
  creator_id: string;
  owner_id: string;
  is_private: boolean;
  member_count: number;
}

export const SimpleCommunityMembers: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<string>('member');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Ensure current user has a profile
  useEnsureProfile();

  useEffect(() => {
    if (user && id) {
      fetchCommunityAndMembers();
    }
  }, [user, id]);

  useEffect(() => {
    // Filter members based on search query
    if (searchQuery.trim() === '') {
      setFilteredMembers(members);
    } else {
      const filtered = members.filter(member => {
        const displayName = getDisplayName(member);
        const bio = member.profiles?.bio || '';
        return displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               bio.toLowerCase().includes(searchQuery.toLowerCase());
      });
      setFilteredMembers(filtered);
    }
  }, [searchQuery, members]);

  const fetchCommunityAndMembers = async () => {
    if (!id || !user) return;

    try {
      setLoading(true);

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
          description: "Community not found",
          variant: "destructive"
        });
        navigate('/communities');
        return;
      }

      setCommunity(communityData);

      // Fetch members with user profiles
      const { data: membersData, error: membersError } = await supabase
        .from('community_members')
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url,
            bio
          )
        `)
        .eq('community_id', id)
        .order('joined_at', { ascending: false });

      if (membersError) {
        console.error('Error fetching members:', membersError);
        toast({
          title: "Error",
          description: "Failed to load members",
          variant: "destructive"
        });
        return;
      }

      setMembers(membersData || []);
      setFilteredMembers(membersData || []);

      // Get current user's role
      const currentMember = membersData?.find(m => m.user_id === user.id);
      if (currentMember) {
        setCurrentUserRole(currentMember.role);
      } else if (communityData.creator_id === user.id || communityData.owner_id === user.id) {
        setCurrentUserRole('owner');
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load community data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (member: CommunityMember): string => {
    return member.profiles?.display_name || 'Anonymous';
  };

  const getAvatarUrl = (member: CommunityMember): string => {
    return member.profiles?.avatar_url ||
           `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName(member))}&background=6366f1&color=ffffff&size=150&bold=true&rounded=true`;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'admin':
      case 'moderator':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const canManageMember = (memberRole: string): boolean => {
    if (!user) return false;
    
    const isOwner = community?.creator_id === user.id || community?.owner_id === user.id;
    const isAdmin = currentUserRole === 'admin' || currentUserRole === 'moderator';
    
    if (isOwner) return memberRole !== 'owner';
    if (isAdmin) return memberRole === 'member';
    return false;
  };

  const handleMemberAction = async (action: string, member: CommunityMember) => {
    if (!user || !community) return;
    
    setActionLoading(member.id);
    
    try {
      switch (action) {
        case 'promote':
          const newRole = member.role === 'member' ? 'moderator' : 'admin';
          const { error: promoteError } = await supabase
            .from('community_members')
            .update({ role: newRole })
            .eq('id', member.id);
            
          if (promoteError) throw promoteError;
          
          toast({
            title: "Member promoted",
            description: `${getDisplayName(member)} has been promoted to ${newRole}.`
          });
          break;
          
        case 'demote':
          const { error: demoteError } = await supabase
            .from('community_members')
            .update({ role: 'member' })
            .eq('id', member.id);
            
          if (demoteError) throw demoteError;
          
          toast({
            title: "Member demoted",
            description: `${getDisplayName(member)} has been demoted to member.`
          });
          break;
          
        case 'remove':
          const { error: removeError } = await supabase
            .from('community_members')
            .delete()
            .eq('id', member.id);
            
          if (removeError) throw removeError;
          
          toast({
            title: "Member removed",
            description: `${getDisplayName(member)} has been removed from the community.`
          });
          break;
          
        case 'message':
          toast({
            title: "Coming soon",
            description: "Direct messaging will be available soon!"
          });
          break;
      }
      
      // Refresh the members list
      fetchCommunityAndMembers();
      
    } catch (error) {
      console.error('Error performing action:', error);
      toast({
        title: "Error",
        description: "Failed to perform action. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400">Loading members...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center py-20">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate(`/community/${id}`)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Community
              </Button>
              
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-blue-600" />
                <div>
                  <h1 className="text-xl font-semibold">{community.name} Members</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {members.length} member{members.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Members</p>
                  <p className="text-2xl font-bold">{members.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <Crown className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Moderators</p>
                  <p className="text-2xl font-bold">
                    {members.filter(m => ['owner', 'admin', 'moderator'].includes(m.role)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <UserPlus className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">New This Week</p>
                  <p className="text-2xl font-bold">
                    {members.filter(m => {
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return new Date(m.joined_at) > weekAgo;
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Members ({filteredMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No members found</h3>
                <p className="text-gray-500">
                  {searchQuery ? 'Try adjusting your search query.' : 'This community has no members yet.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMembers.map((member) => (
                  <div key={member.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={getAvatarUrl(member)} className="object-cover" />
                          <AvatarFallback>
                            {getDisplayName(member).substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {getDisplayName(member)}
                            </p>
                            {getRoleIcon(member.role)}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {member.profiles?.bio || 'No bio available'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={cn("text-xs", getRoleColor(member.role))}>
                          {member.role}
                        </Badge>
                        
                        {canManageMember(member.role) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                                {actionLoading === member.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="w-4 h-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleMemberAction('message', member)}>
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Message
                              </DropdownMenuItem>
                              
                              {member.role === 'member' && (
                                <DropdownMenuItem onClick={() => handleMemberAction('promote', member)}>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Promote to Moderator
                                </DropdownMenuItem>
                              )}
                              
                              {member.role === 'moderator' && currentUserRole === 'owner' && (
                                <DropdownMenuItem onClick={() => handleMemberAction('demote', member)}>
                                  <UserMinus className="w-4 h-4 mr-2" />
                                  Demote to Member
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem 
                                onClick={() => handleMemberAction('remove', member)}
                                className="text-red-600 dark:text-red-400"
                              >
                                <UserMinus className="w-4 h-4 mr-2" />
                                Remove from Community
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};