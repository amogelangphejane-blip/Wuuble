import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
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
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Member {
  id: string;
  name: string;
  avatar?: string;
  bio: string;
  level: number;
  points: number;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: Date;
  lastActive: Date;
  location?: string;
  website?: string;
  social?: {
    twitter?: string;
    linkedin?: string;
  };
  contributions: {
    posts: number;
    comments: number;
    likes: number;
  };
  isOnline: boolean;
  isFollowing: boolean;
}

interface SkoolMembersProps {
  communityId: string;
  memberCount: number;
}

export const SkoolMembers: React.FC<SkoolMembersProps> = ({ communityId, memberCount }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [sortBy, setSortBy] = useState('active');
  
  const [members] = useState<Member[]>([
    {
      id: '1',
      name: 'John Davidson',
      bio: 'Founder & Growth Expert. Helping entrepreneurs scale to 7 figures.',
      level: 10,
      points: 5420,
      role: 'owner',
      joinedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      lastActive: new Date(),
      location: 'San Francisco, CA',
      website: 'johndavidson.com',
      social: {
        twitter: 'johndavidson',
        linkedin: 'johndavidson'
      },
      contributions: {
        posts: 156,
        comments: 892,
        likes: 2341
      },
      isOnline: true,
      isFollowing: false
    },
    {
      id: '2',
      name: 'Emma Wilson',
      bio: 'Marketing strategist | SaaS consultant | Coffee enthusiast ☕',
      level: 8,
      points: 3890,
      role: 'admin',
      joinedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
      location: 'New York, NY',
      contributions: {
        posts: 89,
        comments: 456,
        likes: 1234
      },
      isOnline: true,
      isFollowing: true
    },
    {
      id: '3',
      name: 'Michael Chen',
      bio: 'Product designer turned entrepreneur. Building in public.',
      level: 6,
      points: 2150,
      role: 'member',
      joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000),
      location: 'Austin, TX',
      social: {
        twitter: 'michaelchen'
      },
      contributions: {
        posts: 45,
        comments: 234,
        likes: 567
      },
      isOnline: false,
      isFollowing: false
    },
    {
      id: '4',
      name: 'Sarah Martinez',
      bio: 'Growth hacker | Performance marketer | Data-driven decisions',
      level: 7,
      points: 2980,
      role: 'moderator',
      joinedAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000),
      lastActive: new Date(Date.now() - 5 * 60 * 60 * 1000),
      location: 'Miami, FL',
      website: 'sarahgrowth.io',
      contributions: {
        posts: 67,
        comments: 345,
        likes: 890
      },
      isOnline: false,
      isFollowing: true
    }
  ]);

  const getRoleBadge = (role: Member['role']) => {
    switch (role) {
      case 'owner':
        return <Badge className="bg-black text-white dark:bg-white dark:text-black">Owner</Badge>;
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">Admin</Badge>;
      case 'moderator':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Moderator</Badge>;
      default:
        return null;
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.bio.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-gray-500 text-sm mt-1">{memberCount.toLocaleString()} total members</p>
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
                Role: {filterRole === 'all' ? 'All' : filterRole}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterRole('all')}>All Roles</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterRole('owner')}>Owners</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterRole('admin')}>Admins</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterRole('moderator')}>Moderators</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterRole('member')}>Members</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Sort: {sortBy === 'active' ? 'Most Active' : sortBy === 'points' ? 'Top Points' : 'Newest'}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy('active')}>Most Active</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('points')}>Top Points</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('newest')}>Newest Members</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-lg">
                      {member.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {member.isOnline && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{member.name}</h3>
                    {getRoleBadge(member.role)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {member.bio}
                  </p>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium">Level {member.level}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-orange-500" />
                      <span className="font-medium">{member.points.toLocaleString()} pts</span>
                    </div>
                  </div>
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
                  <DropdownMenuItem>Report</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Additional Info */}
            <div className="space-y-2 mb-4">
              {member.location && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span>{member.location}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-3 h-3" />
                <span>Joined {formatDistanceToNow(member.joinedAt, { addSuffix: true })}</span>
              </div>
              
              {member.website && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Globe className="w-3 h-3" />
                  <a href={`https://${member.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                    {member.website}
                  </a>
                </div>
              )}
            </div>

            {/* Contribution Stats */}
            <div className="grid grid-cols-3 gap-4 py-3 border-t border-b mb-4">
              <div className="text-center">
                <p className="text-lg font-semibold">{member.contributions.posts}</p>
                <p className="text-xs text-gray-500">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{member.contributions.comments}</p>
                <p className="text-xs text-gray-500">Comments</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{member.contributions.likes}</p>
                <p className="text-xs text-gray-500">Likes Given</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button 
                variant={member.isFollowing ? "outline" : "default"}
                size="sm" 
                className={cn(
                  "flex-1",
                  !member.isFollowing && "bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black text-white"
                )}
              >
                {member.isFollowing ? 'Following' : 'Follow'}
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </Button>
            </div>

            {/* Social Links */}
            {member.social && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                {member.social.twitter && (
                  <a href={`https://twitter.com/${member.social.twitter}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Twitter className="w-4 h-4" />
                    </Button>
                  </a>
                )}
                {member.social.linkedin && (
                  <a href={`https://linkedin.com/in/${member.social.linkedin}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Linkedin className="w-4 h-4" />
                    </Button>
                  </a>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};