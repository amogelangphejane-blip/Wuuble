import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  Shield, 
  MessageCircle, 
  MoreVertical,
  Award,
  Activity,
  Clock,
  MapPin,
  Star,
  Users,
  Zap,
  Eye,
  Heart
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { EnhancedCommunityMember } from '@/types/members';
import { formatDistanceToNow } from 'date-fns';
import MemberProfileDialog from './MemberProfileDialog';

interface ModernMemberCardProps {
  member: EnhancedCommunityMember;
  currentUserRole?: 'member' | 'moderator' | 'creator';
  isCreator?: boolean;
  onMessage?: () => void;
  onAction?: (action: string, member: EnhancedCommunityMember) => void;
  compact?: boolean;
  showQuickActions?: boolean;
}

const ModernMemberCard: React.FC<ModernMemberCardProps> = ({
  member,
  currentUserRole = 'member',
  isCreator = false,
  onMessage,
  onAction,
  compact = false,
  showQuickActions = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const getStatusInfo = () => {
    if (member.is_online) {
      return { 
        color: 'bg-green-500', 
        text: 'Online', 
        pulse: true 
      };
    }
    if (member.is_recently_active) {
      return { 
        color: 'bg-yellow-500', 
        text: `Active ${formatDistanceToNow(new Date(member.last_active_at), { addSuffix: true })}`,
        pulse: false 
      };
    }
    return { 
      color: 'bg-gray-400', 
      text: `Last seen ${formatDistanceToNow(new Date(member.last_active_at), { addSuffix: true })}`,
      pulse: false 
    };
  };

  const getRoleConfig = () => {
    switch (member.role) {
      case 'creator':
        return {
          icon: Crown,
          color: 'from-yellow-400 to-orange-500',
          badgeColor: 'bg-gradient-to-r from-yellow-500 to-orange-500',
          label: 'Creator'
        };
      case 'moderator':
        return {
          icon: Shield,
          color: 'from-blue-400 to-blue-600',
          badgeColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
          label: 'Moderator'
        };
      default:
        return {
          icon: Users,
          color: 'from-gray-400 to-gray-600',
          badgeColor: 'bg-gradient-to-r from-gray-500 to-gray-600',
          label: 'Member'
        };
    }
  };

  const getEngagementLevel = () => {
    const score = member.activity_score || 0;
    if (score >= 80) return { level: 'High', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 50) return { level: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { level: 'Low', color: 'text-gray-600', bgColor: 'bg-gray-100' };
  };

  const statusInfo = getStatusInfo();
  const roleConfig = getRoleConfig();
  const engagement = getEngagementLevel();
  const RoleIcon = roleConfig.icon;

  const handleAction = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAction) {
      onAction(action, member);
    }
  };

  if (compact) {
    return (
      <motion.div
        whileHover={{ y: -2, scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <Card 
          className="hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4"
          style={{ borderLeftColor: member.is_online ? '#10b981' : '#6b7280' }}
          onClick={() => setShowProfile(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarImage 
                    src={member.profiles?.avatar_url || undefined} 
                    alt={member.profiles?.display_name || 'Member'}
                  />
                  <AvatarFallback className={cn(
                    "bg-gradient-to-br text-white font-semibold",
                    `bg-gradient-to-br ${roleConfig.color}`
                  )}>
                    {(member.profiles?.display_name || 'A')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
                  statusInfo.color,
                  statusInfo.pulse && "animate-pulse"
                )} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {member.profiles?.display_name || 'Anonymous User'}
                  </h3>
                  <Badge variant="secondary" className={roleConfig.badgeColor + " text-white text-xs"}>
                    <RoleIcon className="h-3 w-3 mr-1" />
                    {roleConfig.label}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">{statusInfo.text}</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-center">
                  <div className="text-sm font-bold text-gray-900">
                    {member.activity_score || 0}
                  </div>
                  <div className="text-xs text-gray-500">Score</div>
                </div>
                
                {showQuickActions && isHovered && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-1"
                  >
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onMessage?.(); }}>
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    {(isCreator || currentUserRole === 'moderator') && member.role !== 'creator' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="ghost">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => handleAction('promote', e)}>
                            <Shield className="h-4 w-4 mr-2" />
                            Promote
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleAction('remove', e)} className="text-red-600">
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <Card 
          className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group relative"
          onClick={() => setShowProfile(true)}
        >
          {/* Header Gradient */}
          <div className={cn(
            "h-24 bg-gradient-to-r relative overflow-hidden",
            `bg-gradient-to-r ${roleConfig.color}`
          )}>
            <div className="absolute inset-0 bg-black/10" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
              initial={{ x: -100 }}
              animate={isHovered ? { x: 300 } : { x: -100 }}
              transition={{ duration: 0.6 }}
            />
          </div>
        
        <CardContent className="relative -mt-12 p-6">
          {/* Avatar Section */}
          <div className="flex items-start justify-between mb-4">
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <Avatar className="w-20 h-20 border-4 border-white shadow-xl">
                  <AvatarImage 
                    src={member.profiles?.avatar_url || undefined} 
                    alt={member.profiles?.display_name || 'Member'}
                  />
                  <AvatarFallback className={cn(
                    "bg-gradient-to-br text-white text-2xl font-bold",
                    `bg-gradient-to-br ${roleConfig.color}`
                  )}>
                    {(member.profiles?.display_name || 'A')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              
              {/* Status Indicator */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-white shadow-md",
                    statusInfo.color,
                    statusInfo.pulse && "animate-pulse"
                  )} />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{statusInfo.text}</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Quick Actions */}
            <AnimatePresence>
              {isHovered && showQuickActions && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex gap-2"
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white/90 backdrop-blur-sm"
                    onClick={(e) => { e.stopPropagation(); onMessage?.(); }}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  
                  {(isCreator || currentUserRole === 'moderator') && member.role !== 'creator' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white/90 backdrop-blur-sm"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => handleAction('promote', e)}>
                          <Shield className="h-4 w-4 mr-2" />
                          Promote to Moderator
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleAction('award_badge', e)}>
                          <Award className="h-4 w-4 mr-2" />
                          Award Badge
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => handleAction('remove', e)} className="text-red-600">
                          Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Member Info */}
          <div className="space-y-3">
            {/* Name and Role */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-gray-900 truncate">
                  {member.profiles?.display_name || 'Anonymous User'}
                </h3>
                <Badge className={cn(roleConfig.badgeColor, "text-white")}>
                  <RoleIcon className="h-3 w-3 mr-1" />
                  {roleConfig.label}
                </Badge>
              </div>
            </div>

            {/* Bio */}
            <div className="min-h-[3rem]">
              {(member.member_bio || member.profiles?.bio) ? (
                <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                  {member.member_bio || member.profiles?.bio}
                </p>
              ) : (
                <p className="text-gray-400 text-sm italic">
                  No bio available
                </p>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-blue-600">
                  {member.activity_score || 0}
                </div>
                <div className="text-xs text-gray-600">Activity Score</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-purple-600">
                  {member.days_since_joined || 0}
                </div>
                <div className="text-xs text-gray-600">Days</div>
              </div>
            </div>

            {/* Engagement Bar */}
            <div>
              <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Engagement
                </span>
                <Badge variant="secondary" className={cn(engagement.bgColor, engagement.color)}>
                  {engagement.level}
                </Badge>
              </div>
              <Progress 
                value={member.activity_score || 0} 
                className="h-2" 
              />
            </div>

            {/* Badges */}
            {member.badges && member.badges.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {member.badges.slice(0, 3).map((badge, index) => (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ borderColor: badge.color, color: badge.color }}
                      >
                        <span className="mr-1">{badge.icon}</span>
                        {badge.name}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{badge.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {member.badges.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{member.badges.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Join Date */}
            <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
              <Clock className="h-3 w-3" />
              <span>
                Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      </motion.div>

      {/* Member Profile Dialog */}
      <MemberProfileDialog
        member={member}
        open={showProfile}
        onOpenChange={setShowProfile}
        currentUserRole={currentUserRole}
        isCreator={isCreator}
        onMessage={onMessage}
        onAction={onAction}
      />
    </>
  );
};

export default ModernMemberCard;