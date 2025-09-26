import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  ChevronDown,
  UserPlus,
  MessageSquare,
  MoreHorizontal,
  Trophy,
  Zap,
  Clock,
  MapPin,
  Link as LinkIcon,
  Twitter,
  Linkedin,
  Globe,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Member {
  id: string;
  name: string;
  avatar?: string;
  bio: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: Date;
  lastActive?: Date;
  isOnline: boolean;
}

interface SkoolMembersProps {
  communityId: string;
  memberCount: number;
}

export const SkoolMembers: React.FC<SkoolMembersProps> = ({ communityId }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [sortBy, setSortBy] = useState('active');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchMembers();
  }, [communityId, filterRole, sortBy]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('community_members')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url,
            bio
          )
        `)
        .eq('community_id', communityId);

      // Apply role filter
      if (filterRole !== 'all') {
        query = query.eq('role', filterRole);
      }

      // Apply sorting
      if (sortBy === 'active') {
        query = query.order('joined_at', { ascending: false });
      } else if (sortBy === 'oldest') {
        query = query.order('joined_at', { ascending: true });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching members:', error);
        return;
      }

      // Transform the data
      const transformedMembers: Member[] = (data || []).map(member => ({
        id: member.user_id,
        name: member.profiles?.username || 'Anonymous',
        avatar: member.profiles?.avatar_url,
        bio: member.profiles?.bio || 'No bio available',
        role: member.role || 'member',
        joinedAt: new Date(member.joined_at),
        lastActive: member.last_active ? new Date(member.last_active) : undefined,
        isOnline: false // Would need real-time presence for this
      }));

      setMembers(transformedMembers);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'admin':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'moderator':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.bio.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-gray-500">{members.length} members in this community</p>
        </div>
        
        <Button className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black text-white">
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Members
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                {filterRole === 'all' ? 'All Roles' : filterRole}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterRole('all')}>
                All Roles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterRole('owner')}>
                Owners
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterRole('admin')}>
                Admins
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterRole('moderator')}>
                Moderators
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterRole('member')}>
                Members
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {sortBy === 'active' ? 'Most Recent' : 'Oldest First'}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy('active')}>
                <Clock className="w-4 h-4 mr-2" />
                Most Recent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                <Trophy className="w-4 h-4 mr-2" />
                Oldest First
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Members Grid */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : filteredMembers.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery ? 'No members found' : 'No members yet'}
          </h3>
          <p className="text-gray-500">
            {searchQuery 
              ? 'Try adjusting your search or filters' 
              : 'Be the first to join this community!'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="hover:shadow-lg transition-all">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                          {member.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {member.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{member.name}</h3>
                      <Badge className={cn("text-xs", getRoleBadgeColor(member.role))}>
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>Send Message</DropdownMenuItem>
                      {user?.id !== member.id && (
                        <DropdownMenuItem>Block User</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {member.bio}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Joined {formatDistanceToNow(member.joinedAt, { addSuffix: true })}</span>
                  {member.lastActive && (
                    <span>Active {formatDistanceToNow(member.lastActive, { addSuffix: true })}</span>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  {user?.id !== member.id && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Follow
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};