import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  ArrowLeft,
  Users,
  Search,
  Crown,
  Shield,
  MoreVertical,
  MessageCircle,
  UserMinus,
  UserCheck,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ResponsiveLayout from '@/components/ResponsiveLayout';

interface Member {
  id: string;
  user_id: string;
  community_id: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joined_at: string;
  profiles?: {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
  };
}

interface Community {
  id: string;
  name: string;
  description: string;
  creator_id: string;
}

const SimpleMembers: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<string>('member');

  useEffect(() => {
    if (user && id) {
      fetchData();
    }
  }, [user, id]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMembers(members);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredMembers(
        members.filter(member => {
          const name = getDisplayName(member);
          const email = member.profiles?.email || '';
          return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
        })
      );
    }
  }, [searchQuery, members]);

  const fetchData = async () => {
    if (!id || !user) return;

    try {
      setLoading(true);

      // Fetch community
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select('id, name, description, creator_id')
        .eq('id', id)
        .single();

      if (communityError) throw communityError;
      setCommunity(communityData);

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('community_members')
        .select(`
          id,
          user_id,
          community_id,
          role,
          joined_at,
          profiles (
            id,
            email,
            display_name,
            avatar_url
          )
        `)
        .eq('community_id', id)
        .order('joined_at', { ascending: false });

      if (membersError) throw membersError;

      setMembers(membersData || []);
      setFilteredMembers(membersData || []);

      // Determine current user's role
      const currentMember = membersData?.find(m => m.user_id === user.id);
      if (currentMember) {
        setCurrentUserRole(currentMember.role);
      } else if (communityData.creator_id === user.id) {
        setCurrentUserRole('owner');
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load community members",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (member: Member): string => {
    return member.profiles?.display_name || 
           member.profiles?.email?.split('@')[0] || 
           'Unknown User';
  };

  const getAvatarUrl = (member: Member): string => {
    return member.profiles?.avatar_url || '';
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Crown className="w-3 h-3 mr-1" />
            Owner
          </Badge>
        );
      case 'admin':
      case 'moderator':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Shield className="w-3 h-3 mr-1" />
            Moderator
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            Member
          </Badge>
        );
    }
  };

  const canManageMember = (memberRole: string): boolean => {
    if (!user || !community) return false;
    
    const isOwner = community.creator_id === user.id;
    const isModerator = ['admin', 'moderator'].includes(currentUserRole);
    
    if (isOwner) return memberRole !== 'owner';
    if (isModerator) return memberRole === 'member';
    return false;
  };

  const handlePromote = async (member: Member) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .update({ role: 'moderator' })
        .eq('id', member.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${getDisplayName(member)} promoted to moderator`
      });
      
      fetchData();
    } catch (error) {
      console.error('Error promoting member:', error);
      toast({
        title: "Error",
        description: "Failed to promote member",
        variant: "destructive"
      });
    }
  };

  const handleDemote = async (member: Member) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .update({ role: 'member' })
        .eq('id', member.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${getDisplayName(member)} demoted to member`
      });
      
      fetchData();
    } catch (error) {
      console.error('Error demoting member:', error);
      toast({
        title: "Error",
        description: "Failed to demote member",
        variant: "destructive"
      });
    }
  };

  const handleRemove = async (member: Member) => {
    if (!confirm(`Remove ${getDisplayName(member)} from the community?`)) return;

    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('id', member.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${getDisplayName(member)} removed from community`
      });
      
      fetchData();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <ResponsiveLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400">Loading members...</p>
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  if (!community) {
    return (
      <ResponsiveLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">Community not found</h3>
            <Button onClick={() => navigate('/communities')}>
              Back to Communities
            </Button>
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  const stats = {
    total: members.length,
    moderators: members.filter(m => ['owner', 'admin', 'moderator'].includes(m.role)).length,
    newThisWeek: members.filter(m => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(m.joined_at) > weekAgo;
    }).length
  };

  return (
    <ResponsiveLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                onClick={() => navigate(`/community/${id}`)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="w-8 h-8 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {community.name} Members
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {stats.total} member{stats.total !== 1 ? 's' : ''}
                </p>
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

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Shield className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Moderators</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.moderators}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Users className="w-5 h-5 text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">New This Week</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.newThisWeek}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Members List */}
          <Card>
            <CardContent className="p-0">
              {filteredMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                    No members found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500">
                    {searchQuery ? 'Try a different search term.' : 'This community has no members yet.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredMembers.map((member) => (
                    <div key={member.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={getAvatarUrl(member)} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {getDisplayName(member).substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {getDisplayName(member)}
                              </p>
                              {getRoleBadge(member.role)}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {member.profiles?.email}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        
                        {canManageMember(member.role) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                toast({
                                  title: "Coming soon",
                                  description: "Messaging will be available soon!"
                                });
                              }}>
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Message
                              </DropdownMenuItem>
                              
                              {member.role === 'member' && (
                                <DropdownMenuItem onClick={() => handlePromote(member)}>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Make Moderator
                                </DropdownMenuItem>
                              )}
                              
                              {member.role !== 'member' && currentUserRole === 'owner' && (
                                <DropdownMenuItem onClick={() => handleDemote(member)}>
                                  <UserMinus className="w-4 h-4 mr-2" />
                                  Remove Moderator
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem 
                                onClick={() => handleRemove(member)}
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default SimpleMembers;