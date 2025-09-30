import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Shield, 
  MessageCircle, 
  MoreVertical,
  Award,
  Activity,
  Clock,
  UserPlus,
  UserMinus,
  Ban
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface EnhancedMemberCardProps {
  member: any;
  isCreator?: boolean;
  isModerator?: boolean;
  onMessage?: () => void;
  onAction?: (action: string, memberId: string) => void;
}

const validateAvatarUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/')) {
    return `${window.location.origin}${url}`;
  }
  return undefined;
};

const EnhancedMemberCard: React.FC<EnhancedMemberCardProps> = ({
  member,
  isCreator = false,
  isModerator = false,
  onMessage,
  onAction
}) => {
  const [showProfile, setShowProfile] = useState(false);
  const canModerate = isCreator || isModerator;

  const getStatusColor = (isOnline?: boolean, isRecentlyActive?: boolean) => {
    if (isOnline) return 'bg-green-500';
    if (isRecentlyActive) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  const formatLastActive = (date: string) => {
    const now = new Date();
    const lastActive = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - lastActive.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return lastActive.toLocaleDateString();
  };

  const handleAction = (action: string) => {
    if (onAction) {
      onAction(action, member.user_id);
    }
  };

  return (
    <>
      <Card 
        className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
        onClick={() => setShowProfile(true)}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Avatar with Status */}
            <div className="relative">
              <Avatar className="w-16 h-16">
                <AvatarImage 
                  src={validateAvatarUrl(member.profiles?.avatar_url)} 
                  alt={member.profiles?.display_name || 'Member'}
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-lg">
                  {(member.profiles?.display_name || 'A')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                getStatusColor(member.is_online, member.is_recently_active)
              )} />
            </div>

            {/* Member Info */}
            <div className="flex-1 min-w-0">
              {/* Name and Role */}
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {member.profiles?.display_name || 'Anonymous User'}
                </h3>
                {member.role === 'creator' && (
                  <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                    <Crown className="h-3 w-3 mr-1" />
                    Creator
                  </Badge>
                )}
                {member.role === 'moderator' && (
                  <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                    <Shield className="h-3 w-3 mr-1" />
                    Moderator
                  </Badge>
                )}
              </div>

              {/* Bio Section */}
              <div className="mb-3">
                {(member.member_bio || member.profiles?.bio) ? (
                  <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                    {member.member_bio || member.profiles?.bio}
                  </p>
                ) : (
                  <p className="text-gray-500 text-sm italic">
                    No bio available
                  </p>
                )}
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  <span>Level {member.level || 1}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  <span>{member.points || 0} points</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatLastActive(member.last_active || member.joined_at)}</span>
                </div>
              </div>

              {/* Progress Bar */}
              {member.level && member.progress_to_next_level !== undefined && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Level {member.level}</span>
                    <span>{member.progress_to_next_level}%</span>
                  </div>
                  <Progress value={member.progress_to_next_level} className="h-2" />
                </div>
              )}

              {/* Badges */}
              {member.badges && member.badges.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {member.badges.map((badge: any, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {badge.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-start gap-2">
              {onMessage && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMessage();
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              )}
              
              {canModerate && member.role !== 'creator' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => e.stopPropagation()}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {member.role === 'member' && (
                      <DropdownMenuItem onClick={() => handleAction('promote')}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Promote to Moderator
                      </DropdownMenuItem>
                    )}
                    {member.role === 'moderator' && isCreator && (
                      <DropdownMenuItem onClick={() => handleAction('demote')}>
                        <UserMinus className="h-4 w-4 mr-2" />
                        Demote to Member
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleAction('award_badge')}>
                      <Award className="h-4 w-4 mr-2" />
                      Award Badge
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleAction('remove')} 
                      className="text-red-600"
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Remove Member
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Member Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage 
                  src={validateAvatarUrl(member.profiles?.avatar_url)} 
                  alt={member.profiles?.display_name || 'Member'}
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                  {(member.profiles?.display_name || 'A')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xl font-semibold">
                {member.profiles?.display_name || 'Anonymous User'}
              </span>
            </DialogTitle>
            <DialogDescription>
              Member profile and activity details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Profile Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {member.level || 1}
                </div>
                <div className="text-sm text-gray-600">Level</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {member.points || 0}
                </div>
                <div className="text-sm text-gray-600">Points</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {member.badges?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Badges</div>
              </div>
            </div>

            {/* Bio */}
            {(member.member_bio || member.profiles?.bio) && (
              <div>
                <h4 className="font-semibold mb-2">About</h4>
                <p className="text-gray-700">
                  {member.member_bio || member.profiles?.bio}
                </p>
              </div>
            )}

            {/* Recent Activity */}
            {member.recent_activities && member.recent_activities.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Recent Activity</h4>
                <div className="space-y-2">
                  {member.recent_activities.map((activity: any) => (
                    <div key={activity.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-sm capitalize">{activity.activity_type.replace('_', ' ')}</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {formatLastActive(activity.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnhancedMemberCard;