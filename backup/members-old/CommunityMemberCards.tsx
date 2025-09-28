import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Crown,
  Shield,
  Star,
  MessageSquare,
  MoreVertical,
  UserPlus,
  UserMinus,
  Search,
  Filter,
  Award,
  Calendar,
  Activity,
  Mail,
  Ban,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface Member {
  id: string;
  user_id: string;
  community_id: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joined_at: string;
  contribution_points: number;
  is_active: boolean;
  user: {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
    location?: string;
    skills?: string[];
  };
  stats: {
    posts: number;
    comments: number;
    likes_given: number;
    likes_received: number;
  };
}

interface CommunityMemberCardsProps {
  communityId: string;
  isOwner: boolean;
  isModerator?: boolean;
}

export const CommunityMemberCards: React.FC<CommunityMemberCardsProps> = ({
  communityId,
  isOwner,
  isModerator = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchMembers();
  }, [communityId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      
      // Mock members data
      const mockMembers: Member[] = [
        {
          id: '1',
          user_id: 'user1',
          community_id: communityId,
          role: 'owner',
          joined_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          contribution_points: 2500,
          is_active: true,
          user: {
            id: 'user1',
            email: 'owner@example.com',
            display_name: 'Community Owner',
            avatar_url: '',
            bio: 'Building amazing communities and connecting people worldwide.',
            location: 'San Francisco, CA',
            skills: ['Leadership', 'Community Building', 'Strategy']
          },
          stats: {
            posts: 45,
            comments: 120,
            likes_given: 200,
            likes_received: 350
          }
        },
        {
          id: '2',
          user_id: 'user2',
          community_id: communityId,
          role: 'admin',
          joined_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          contribution_points: 1800,
          is_active: true,
          user: {
            id: 'user2',
            email: 'admin@example.com',
            display_name: 'Sarah Chen',
            avatar_url: '',
            bio: 'Passionate about technology and community engagement.',
            location: 'New York, NY',
            skills: ['Management', 'Content Creation', 'Analytics']
          },
          stats: {
            posts: 32,
            comments: 89,
            likes_given: 150,
            likes_received: 210
          }
        },
        {
          id: '3',
          user_id: 'user3',
          community_id: communityId,
          role: 'moderator',
          joined_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          contribution_points: 1200,
          is_active: true,
          user: {
            id: 'user3',
            email: 'mod@example.com',
            display_name: 'Alex Johnson',
            avatar_url: '',
            bio: 'Helping maintain a positive community environment.',
            location: 'Austin, TX',
            skills: ['Moderation', 'Communication', 'Problem Solving']
          },
          stats: {
            posts: 28,
            comments: 95,
            likes_given: 180,
            likes_received: 165
          }
        },
        {
          id: '4',
          user_id: 'user4',
          community_id: communityId,
          role: 'member',
          joined_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          contribution_points: 750,
          is_active: true,
          user: {
            id: 'user4',
            email: 'member1@example.com',
            display_name: 'Emily Davis',
            avatar_url: '',
            bio: 'Love learning and sharing knowledge with others.',
            location: 'Seattle, WA',
            skills: ['Design', 'Writing', 'Photography']
          },
          stats: {
            posts: 18,
            comments: 42,
            likes_given: 85,
            likes_received: 92
          }
        },
        {
          id: '5',
          user_id: 'user5',
          community_id: communityId,
          role: 'member',
          joined_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          contribution_points: 450,
          is_active: false,
          user: {
            id: 'user5',
            email: 'member2@example.com',
            display_name: 'Michael Brown',
            avatar_url: '',
            bio: 'Entrepreneur and tech enthusiast.',
            location: 'Boston, MA',
            skills: ['Business', 'Marketing', 'Development']
          },
          stats: {
            posts: 12,
            comments: 28,
            likes_given: 45,
            likes_received: 52
          }
        }
      ];

      setMembers(mockMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!isOwner) return;

    try {
      // Update member role
      setMembers(members.map(m => 
        m.id === memberId ? { ...m, role: newRole as Member['role'] } : m
      ));

      toast({
        title: "Role updated",
        description: "Member role has been changed successfully",
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update member role",
        variant: "destructive"
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!isOwner && !isModerator) return;

    try {
      setMembers(members.filter(m => m.id !== memberId));
      
      toast({
        title: "Member removed",
        description: "Member has been removed from the community",
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive"
      });
    }
  };

  const getRoleBadge = (role: Member['role']) => {
    switch (role) {
      case 'owner':
        return (
          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black">
            <Crown className="w-3 h-3 mr-1" />
            Owner
          </Badge>
        );
      case 'admin':
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      case 'moderator':
        return (
          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
            <Star className="w-3 h-3 mr-1" />
            Moderator
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Users className="w-3 h-3 mr-1" />
            Member
          </Badge>
        );
    }
  };

  const getContributionBadge = (points: number) => {
    if (points >= 2000) {
      return (
        <Badge className="bg-gradient-to-r from-purple-400 to-pink-400 text-white">
          <Award className="w-3 h-3 mr-1" />
          Top Contributor
        </Badge>
      );
    } else if (points >= 1000) {
      return (
        <Badge className="bg-gradient-to-r from-blue-400 to-cyan-400 text-white">
          <Star className="w-3 h-3 mr-1" />
          Active Contributor
        </Badge>
      );
    } else if (points >= 500) {
      return (
        <Badge variant="outline">
          <Activity className="w-3 h-3 mr-1" />
          Regular
        </Badge>
      );
    }
    return null;
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const MemberCard = ({ member }: { member: Member }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden hover:shadow-xl transition-all">
        <div className="h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        
        <CardContent className="relative -mt-10 pb-6">
          <div className="flex items-start justify-between mb-4">
            <Avatar className="w-20 h-20 border-4 border-white dark:border-gray-800">
              <AvatarImage src={member.user.avatar_url} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl">
                {member.user.display_name?.substring(0, 2).toUpperCase() || 'AN'}
              </AvatarFallback>
            </Avatar>
            
            {(isOwner || isModerator) && member.role !== 'owner' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 mt-12">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isOwner && (
                    <>
                      <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'admin')}>
                        <Shield className="w-4 h-4 mr-2" />
                        Make Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'moderator')}>
                        <Star className="w-4 h-4 mr-2" />
                        Make Moderator
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'member')}>
                        <Users className="w-4 h-4 mr-2" />
                        Make Member
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem className="text-red-600" onClick={() => handleRemoveMember(member.id)}>
                    <UserMinus className="w-4 h-4 mr-2" />
                    Remove Member
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{member.user.display_name || 'Anonymous'}</h3>
              {member.is_active ? (
                <div className="w-2 h-2 bg-green-500 rounded-full" title="Online" />
              ) : (
                <div className="w-2 h-2 bg-gray-400 rounded-full" title="Offline" />
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {getRoleBadge(member.role)}
              {getContributionBadge(member.contribution_points)}
            </div>
            
            {member.user.bio && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {member.user.bio}
              </p>
            )}
            
            {member.user.location && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {member.user.location}
              </p>
            )}
            
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 pt-3 mt-3 border-t">
              <div className="text-center">
                <p className="text-lg font-semibold">{member.stats.posts}</p>
                <p className="text-xs text-gray-500">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{member.stats.comments}</p>
                <p className="text-xs text-gray-500">Comments</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{member.contribution_points}</p>
                <p className="text-xs text-gray-500">Points</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{member.stats.likes_received}</p>
                <p className="text-xs text-gray-500">Likes</p>
              </div>
            </div>
            
            {/* Skills */}
            {member.user.skills && member.user.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-3">
                {member.user.skills.map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-2 pt-3">
              <Button size="sm" variant="outline" className="flex-1">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                <UserPlus className="w-4 h-4 mr-2" />
                Follow
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Community Members</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {members.length} members • {members.filter(m => m.is_active).length} online
          </p>
        </div>
        
        {isOwner && (
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Members
          </Button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              {filterRole === 'all' ? 'All Roles' : filterRole}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterRole('all')}>
              All Roles
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterRole('owner')}>
              <Crown className="w-4 h-4 mr-2" />
              Owners
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterRole('admin')}>
              <Shield className="w-4 h-4 mr-2" />
              Admins
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterRole('moderator')}>
              <Star className="w-4 h-4 mr-2" />
              Moderators
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterRole('member')}>
              <Users className="w-4 h-4 mr-2" />
              Members
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Members Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <div className="h-20 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <CardContent className="pt-12">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No members found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? 'Try adjusting your search' : 'Be the first to join this community!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};