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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SimpleHeader } from '@/components/SimpleHeader';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Users,
  Search,
  Crown,
  Shield,
  Mail,
  Loader2,
  UserPlus,
  Filter
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Member {
  id: string;
  user_id: string;
  community_id: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joined_at: string;
  profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  } | null;
  auth_users: {
    email: string;
  } | null;
}

interface Community {
  id: string;
  name: string;
  description: string;
  avatar_url?: string;
  member_count: number;
  creator_id?: string;
  owner_id?: string;
}

const NewCommunityMembers: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentUserRole, setCurrentUserRole] = useState<string>('member');

  useEffect(() => {
    if (user && id) {
      fetchCommunityAndMembers();
    }
  }, [user, id]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, roleFilter, members]);

  const applyFilters = () => {
    let filtered = [...members];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(member => {
        const displayName = getDisplayName(member);
        const email = member.auth_users?.email || '';
        const bio = member.profiles?.bio || '';
        const query = searchQuery.toLowerCase();
        
        return displayName.toLowerCase().includes(query) ||
               email.toLowerCase().includes(query) ||
               bio.toLowerCase().includes(query);
      });
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(member => member.role === roleFilter);
    }

    setFilteredMembers(filtered);
  };

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

      // Fetch members with real user profiles from profiles table
      const { data: membersData, error: membersError } = await supabase
        .from('community_members')
        .select(`
          *,
          profiles (
            id,
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

      // Get user emails from profiles or generate placeholder
      const finalMembers = (membersData || []).map((member: any) => ({
        id: member.id,
        user_id: member.user_id,
        community_id: member.community_id,
        role: member.role as 'owner' | 'admin' | 'moderator' | 'member',
        joined_at: member.joined_at,
        profiles: member.profiles || null,
        auth_users: { email: member.profiles?.display_name ? `${member.profiles.display_name.toLowerCase().replace(/\s+/g, '')}@example.com` : 'member@community.com' }
      }));

      setMembers(finalMembers);
      setFilteredMembers(finalMembers);

      // Get current user's role
      const currentMember = finalMembers?.find(m => m.user_id === user.id);
      if (currentMember) {
        setCurrentUserRole(currentMember.role);
      } else if (communityData.creator_id === user.id || (communityData as any).owner_id === user.id) {
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

  const getDisplayName = (member: Member): string => {
    if (member.profiles?.display_name) {
      return member.profiles.display_name;
    }
    
    if (member.auth_users?.email) {
      return member.auth_users.email.split('@')[0];
    }
    
    return 'Anonymous User';
  };

  const getAvatarUrl = (member: Member): string => {
    if (member.profiles?.avatar_url) {
      return member.profiles.avatar_url;
    }
    
    const name = getDisplayName(member);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=ffffff&size=150&bold=true&rounded=true`;
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300';
      case 'admin':
      case 'moderator':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-300';
    }
  };

  const handleMessageMember = (member: Member) => {
    toast({
      title: "Coming soon",
      description: `Direct messaging with ${getDisplayName(member)} will be available soon!`
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <SimpleHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400">Loading members...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <SimpleHeader />
        <div className="flex items-center justify-center py-20">
          <Card className="max-w-md w-full">
            <CardContent className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">Community not found</h3>
              <Button onClick={() => navigate('/communities')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Communities
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SimpleHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/community/${id}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {community.name}
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Community Members
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {members.length} member{members.length !== 1 ? 's' : ''} in {community.name}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{members.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                  <Crown className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Admins</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {members.filter(m => ['owner', 'admin', 'moderator'].includes(m.role)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <UserPlus className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
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
          
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Members</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {members.filter(m => m.role === 'member').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8 border-2">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search members by name, email, or bio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Members ({filteredMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredMembers.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Users className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No members found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery || roleFilter !== 'all' 
                    ? 'Try adjusting your search or filters.' 
                    : 'This community has no members yet.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMembers.map((member) => (
                  <div 
                    key={member.id} 
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <Avatar className="w-14 h-14 ring-2 ring-gray-200 dark:ring-gray-700">
                          <AvatarImage src={getAvatarUrl(member)} className="object-cover" />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                            {getDisplayName(member).substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                              {getDisplayName(member)}
                            </p>
                            {getRoleIcon(member.role)}
                            <Badge className={cn("text-xs border", getRoleBadgeColor(member.role))}>
                              {member.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {member.auth_users?.email || 'Email hidden'}
                          </p>
                          {member.profiles?.bio && (
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 line-clamp-1">
                              {member.profiles.bio}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMessageMember(member)}
                        className="gap-2 shrink-0"
                      >
                        <Mail className="w-4 h-4" />
                        Message
                      </Button>
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

export default NewCommunityMembers;