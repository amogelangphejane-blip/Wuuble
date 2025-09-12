import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Mail, 
  MoreVertical, 
  Crown, 
  Shield, 
  Calendar, 
  Clock, 
  TrendingUp,
  UserMinus,
  UserPlus,
  Award,
  MessageCircle,
  Eye,
  Ban
} from 'lucide-react';
import { EnhancedCommunityMember, MemberBadge } from '@/types/members';
import { validateAvatarUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface EnhancedMemberCardProps {
  member: EnhancedCommunityMember;
  currentUserRole?: 'member' | 'moderator' | 'creator';
  isCreator?: boolean;
  onAction?: (action: string, member: EnhancedCommunityMember) => void;
  compact?: boolean;
}

const EnhancedMemberCard: React.FC<EnhancedMemberCardProps> = ({
  member,
  currentUserRole = 'member',
  isCreator = false,
  onAction,
  compact = false
}) => {
  const [showProfile, setShowProfile] = useState(false);

  const canManage = currentUserRole === 'creator' || 
    (currentUserRole === 'moderator' && member.role === 'member');

  const getStatusColor = (isOnline: boolean, isRecentlyActive: boolean) => {
    if (isOnline) return 'bg-green-500';
    if (isRecentlyActive) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getActivityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const formatLastActive = (lastActive: string) => {
    const diff = Date.now() - new Date(lastActive).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(lastActive).toLocaleDateString();
  };

  const handleAction = (action: string) => {
    onAction?.(action, member);
  };

  if (compact) {
    return (
      <div className="flex items-start gap-3 p-4 border rounded-lg hover:shadow-md transition-shadow">
        <div className="relative">
          <Avatar className="w-12 h-12">
            <AvatarImage 
              src={validateAvatarUrl(member.profiles?.avatar_url)} 
              alt={member.profiles?.display_name || 'Member'}
            />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm">
              {(member.profiles?.display_name || 'A')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className={cn(
            "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
            getStatusColor(member.is_online, member.is_recently_active)
          )} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm truncate">
              {member.profiles?.display_name || 'Anonymous User'}
            </h4>
            {member.role === 'creator' && <Crown className="h-3 w-3 text-yellow-500" />}
            {member.role === 'moderator' && <Shield className="h-3 w-3 text-blue-500" />}
          </div>
          
          {/* Bio in compact view */}
          {(member.member_bio || member.profiles?.bio) && (
            <p className="text-xs text-gray-600 line-clamp-2 mb-2 leading-relaxed">
              {member.member_bio || member.profiles?.bio}
            </p>
          )}
          
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>Joined {new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            <span>•</span>
            <span>{formatLastActive(member.last_active_at)}</span>
            {member.badges.length > 0 && (
              <>
                <span>•</span>
                <Badge variant="outline" className="text-xs py-0 px-1">
                  {member.badges.length} badges
                </Badge>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className={cn("text-sm font-medium", getActivityScoreColor(member.activity_score))}>
              {member.activity_score}%
            </div>
            <div className="text-xs text-gray-500">active</div>
          </div>
          
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleAction('message')}>
                  <Mail className="h-4 w-4 mr-2" />
                  Message
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction('view_profile')}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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
                  <UserMinus className="h-4 w-4 mr-2" />
                  Remove Member
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
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

              {/* Bio Section - Skool Style */}
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

              {/* Member Stats Row - Similar to Skool */}
              <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatLastActive(member.last_active_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className={getActivityScoreColor(member.activity_score)}>
                    {member.activity_score}% active
                  </span>
                </div>
              </div>

              {/* Badges Section */}
              {member.badges.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {member.badges.slice(0, 3).map((badge, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="text-xs bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200"
                    >
                      <Award className="h-3 w-3 mr-1" />
                      {badge.name}
                    </Badge>
                  ))}
                  {member.badges.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{member.badges.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              {/* Action Buttons Row - Skool Style */}
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleAction('message')}
                  className="flex-1"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowProfile(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Profile
                </Button>
                
                {canManage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="px-2">
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
          </div>
        </CardContent>
      </Card>
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                getStatusColor(member.is_online, member.is_recently_active)
              )} />
            </div>

            {/* Member Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg text-gray-900 truncate">
                  {member.profiles?.display_name || 'Anonymous User'}
                </h3>
                {member.role === 'creator' && (
                  <Crown className="h-5 w-5 text-yellow-500" title="Community Creator" />
                )}
                {member.role === 'moderator' && (
                  <Shield className="h-5 w-5 text-blue-500" title="Moderator" />
                )}
              </div>

              {/* Role Badge */}
              {member.role !== 'member' && (
                <Badge variant="outline" className="mb-3 capitalize">
                  {member.role}
                </Badge>
              )}

              {/* Member Bio */}
              {member.member_bio && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {member.member_bio}
                </p>
              )}

              {/* Member Badges */}
              {member.badges.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {member.badges.slice(0, 3).map((badge) => (
                    <Badge 
                      key={badge.id} 
                      variant="secondary" 
                      className="text-xs"
                      style={{ backgroundColor: `${badge.color}20`, color: badge.color }}
                    >
                      {badge.icon} {badge.name}
                    </Badge>
                  ))}
                  {member.badges.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{member.badges.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              {/* Activity Score */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Activity Score</span>
                  <span className={cn("text-sm font-medium", getActivityScoreColor(member.activity_score))}>
                    {member.activity_score}%
                  </span>
                </div>
                <Progress value={member.activity_score} className="h-2" />
              </div>

              {/* Member Stats */}
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {member.days_since_joined}
                  </div>
                  <div className="text-xs text-gray-500">days</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {member.recent_activities.length}
                  </div>
                  <div className="text-xs text-gray-500">recent</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {member.badges.length}
                  </div>
                  <div className="text-xs text-gray-500">badges</div>
                </div>
              </div>

              {/* Last Active */}
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
                <Clock className="h-3 w-3" />
                <span>Last active {formatLastActive(member.last_active_at)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleAction('message')}
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                Message
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowProfile(true)}
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                Profile
              </Button>

              {canManage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <MoreVertical className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
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
                      onClick={() => handleAction('ban')} 
                      className="text-orange-600"
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Ban Member
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleAction('remove')} 
                      className="text-red-600"
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
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
              <div>
                <div className="flex items-center gap-2">
                  {member.profiles?.display_name || 'Anonymous User'}
                  {member.role === 'creator' && <Crown className="h-4 w-4 text-yellow-500" />}
                  {member.role === 'moderator' && <Shield className="h-4 w-4 text-blue-500" />}
                </div>
                <div className="text-sm text-gray-500">
                  Joined {new Date(member.joined_at).toLocaleDateString()}
                </div>
              </div>
            </DialogTitle>
            <DialogDescription>
              Member profile and activity details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Bio */}
            {member.member_bio && (
              <div>
                <h4 className="font-medium mb-2">About</h4>
                <p className="text-gray-600">{member.member_bio}</p>
              </div>
            )}

            {/* Badges */}
            {member.badges.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Badges ({member.badges.length})</h4>
                <div className="grid grid-cols-2 gap-3">
                  {member.badges.map((badge) => (
                    <div 
                      key={badge.id} 
                      className="flex items-center gap-3 p-3 border rounded-lg"
                      style={{ borderColor: `${badge.color}40` }}
                    >
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                        style={{ backgroundColor: `${badge.color}20` }}
                      >
                        {badge.icon}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{badge.name}</div>
                        <div className="text-xs text-gray-500">{badge.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activities */}
            {member.recent_activities.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Recent Activity</h4>
                <div className="space-y-2">
                  {member.recent_activities.map((activity) => (
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