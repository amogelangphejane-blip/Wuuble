import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Star,
  Users,
  Zap,
  Heart,
  Eye,
  Calendar,
  MapPin,
  ExternalLink,
  UserPlus,
  UserMinus,
  Ban
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { EnhancedMemberProfile } from '@/types/community-members';
import { formatDistanceToNow, format } from 'date-fns';

interface MemberCardProps {
  member: EnhancedMemberProfile;
  currentUserRole?: 'member' | 'moderator' | 'creator';
  currentUserId?: string;
  compact?: boolean;
  showActions?: boolean;
  onProfileClick?: (member: EnhancedMemberProfile) => void;
  onMessage?: (member: EnhancedMemberProfile) => void;
  onFollow?: (member: EnhancedMemberProfile) => void;
  onPromote?: (member: EnhancedMemberProfile) => void;
  onDemote?: (member: EnhancedMemberProfile) => void;
  onRemove?: (member: EnhancedMemberProfile) => void;
  onAwardBadge?: (member: EnhancedMemberProfile) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({
  member,
  currentUserRole = 'member',
  currentUserId,
  compact = false,
  showActions = true,
  onProfileClick,
  onMessage,
  onFollow,
  onPromote,
  onDemote,
  onRemove,
  onAwardBadge
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Calculate derived properties
  const isCurrentUser = currentUserId === member.user_id;
  const canManage = currentUserRole !== 'member' && !isCurrentUser && member.role !== 'creator';
  const statusInfo = getStatusInfo(member);
  const roleConfig = getRoleConfig(member.role);

  // Get status indicator info
  function getStatusInfo(member: EnhancedMemberProfile) {
    if (member.is_online) {
      return { 
        color: 'bg-green-500', 
        text: 'Online now',
        dot: 'bg-green-500',
        pulse: true 
      };
    }
    if (member.is_recently_active) {
      return { 
        color: 'bg-amber-500', 
        text: `Active ${formatDistanceToNow(new Date(member.last_seen_at), { addSuffix: true })}`,
        dot: 'bg-amber-500',
        pulse: false 
      };
    }
    return { 
      color: 'bg-gray-400', 
      text: `Last seen ${formatDistanceToNow(new Date(member.last_seen_at), { addSuffix: true })}`,
      dot: 'bg-gray-400',
      pulse: false 
    };
  }

  // Get role configuration
  function getRoleConfig(role: string) {
    switch (role) {
      case 'creator':
        return {
          icon: Crown,
          gradient: 'from-yellow-400 via-orange-500 to-red-500',
          badgeClass: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
          borderClass: 'border-yellow-400/50',
          label: 'Creator'
        };
      case 'moderator':
        return {
          icon: Shield,
          gradient: 'from-blue-400 via-blue-500 to-blue-600',
          badgeClass: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
          borderClass: 'border-blue-400/50',
          label: 'Moderator'
        };
      default:
        return {
          icon: Users,
          gradient: 'from-gray-400 via-gray-500 to-gray-600',
          badgeClass: 'bg-gradient-to-r from-gray-400 to-gray-600 text-white',
          borderClass: 'border-gray-300/50',
          label: 'Member'
        };
    }
  }

  // Get engagement level styling
  function getEngagementStyling(score: number) {
    if (score >= 80) return { color: 'text-green-600', bg: 'bg-green-100', label: 'High' };
    if (score >= 50) return { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Medium' };
    return { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Low' };
  }

  const RoleIcon = roleConfig.icon;
  const engagement = getEngagementStyling(member.activity_score);

  // Handle actions
  const handleAction = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    switch (action) {
      case 'message':
        onMessage?.(member);
        break;
      case 'follow':
        onFollow?.(member);
        break;
      case 'promote':
        onPromote?.(member);
        break;
      case 'demote':
        onDemote?.(member);
        break;
      case 'remove':
        onRemove?.(member);
        break;
      case 'award_badge':
        onAwardBadge?.(member);
        break;
    }
  };

  // Compact layout for list view
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01, y: -2 }}
        transition={{ duration: 0.2 }}
        className="w-full"
      >
        <Card 
          className={cn(
            "hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 group",
            roleConfig.borderClass,
            isHovered && "shadow-xl"
          )}
          onClick={() => onProfileClick?.(member)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Avatar with status */}
              <div className="relative">
                <Avatar className="w-12 h-12 ring-2 ring-white shadow-md">
                  <AvatarImage 
                    src={member.avatar_url || undefined} 
                    alt={member.display_name || 'Member'}
                    onLoad={() => setImageLoaded(true)}
                  />
                  <AvatarFallback className={cn(
                    "bg-gradient-to-br text-white font-bold text-lg",
                    `bg-gradient-to-br ${roleConfig.gradient}`
                  )}>
                    {(member.display_name || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                        statusInfo.dot,
                        statusInfo.pulse && "animate-pulse"
                      )} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{statusInfo.text}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Member info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate text-lg">
                    {member.display_name || 'Anonymous User'}
                  </h3>
                  <Badge className={cn(roleConfig.badgeClass, "text-xs")}>
                    <RoleIcon className="h-3 w-3 mr-1" />
                    {roleConfig.label}
                  </Badge>
                  {member.current_streak > 7 && (
                    <Badge variant="outline" className="text-xs">
                      <Zap className="h-3 w-3 mr-1 text-orange-500" />
                      {member.current_streak}d
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    <span>{member.activity_score}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    <span>{member.badges.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{member.days_since_joined}d</span>
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {member.total_points.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">points</div>
              </div>

              {/* Actions */}
              <AnimatePresence>
                {showActions && isHovered && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex gap-2"
                  >
                    {!isCurrentUser && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleAction('message', e)}
                        className="h-8 w-8 p-0"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {member.role === 'member' && (
                            <DropdownMenuItem onClick={(e) => handleAction('promote', e)}>
                              <Shield className="h-4 w-4 mr-2" />
                              Promote to Moderator
                            </DropdownMenuItem>
                          )}
                          {member.role === 'moderator' && currentUserRole === 'creator' && (
                            <DropdownMenuItem onClick={(e) => handleAction('demote', e)}>
                              <Users className="h-4 w-4 mr-2" />
                              Demote to Member
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={(e) => handleAction('award_badge', e)}>
                            <Award className="h-4 w-4 mr-2" />
                            Award Badge
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={(e) => handleAction('remove', e)} 
                            className="text-red-600"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Full card layout for grid view
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="w-full"
    >
      <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer group relative">
        {/* Gradient Header */}
        <div className={cn(
          "h-32 bg-gradient-to-r relative overflow-hidden",
          `bg-gradient-to-r ${roleConfig.gradient}`
        )}>
          <div className="absolute inset-0 bg-black/10" />
          
          {/* Animated shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
            initial={{ x: -400 }}
            animate={isHovered ? { x: 400 } : { x: -400 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          
          {/* Header actions */}
          <div className="absolute top-4 right-4">
            <AnimatePresence>
              {showActions && isHovered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex gap-2"
                >
                  {!isCurrentUser && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => handleAction('message', e)}
                      className="bg-white/20 backdrop-blur-sm border-0 hover:bg-white/30"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-white/20 backdrop-blur-sm border-0 hover:bg-white/30"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {member.role === 'member' && (
                          <DropdownMenuItem onClick={(e) => handleAction('promote', e)}>
                            <Shield className="h-4 w-4 mr-2" />
                            Promote to Moderator
                          </DropdownMenuItem>
                        )}
                        {member.role === 'moderator' && currentUserRole === 'creator' && (
                          <DropdownMenuItem onClick={(e) => handleAction('demote', e)}>
                            <Users className="h-4 w-4 mr-2" />
                            Demote to Member
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={(e) => handleAction('award_badge', e)}>
                          <Award className="h-4 w-4 mr-2" />
                          Award Badge
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => handleAction('remove', e)} 
                          className="text-red-600"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <CardContent 
          className="relative -mt-16 p-6 bg-white"
          onClick={() => onProfileClick?.(member)}
        >
          {/* Avatar Section */}
          <div className="flex items-start justify-between mb-6">
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <Avatar className="w-24 h-24 border-4 border-white shadow-2xl ring-4 ring-white/50">
                  <AvatarImage 
                    src={member.avatar_url || undefined} 
                    alt={member.display_name || 'Member'}
                    onLoad={() => setImageLoaded(true)}
                  />
                  <AvatarFallback className={cn(
                    "bg-gradient-to-br text-white text-3xl font-bold",
                    `bg-gradient-to-br ${roleConfig.gradient}`
                  )}>
                    {(member.display_name || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Status indicator */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white shadow-lg",
                        statusInfo.color,
                        statusInfo.pulse && "animate-pulse"
                      )} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{statusInfo.text}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.div>
            </div>
          </div>
          
          {/* Member Details */}
          <div className="space-y-4">
            {/* Name and Role */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 truncate">
                  {member.display_name || 'Anonymous User'}
                </h3>
                <Badge className={cn(roleConfig.badgeClass, "text-sm")}>
                  <RoleIcon className="h-4 w-4 mr-1" />
                  {roleConfig.label}
                </Badge>
              </div>
              
              {/* Bio */}
              <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 min-h-[2.5rem]">
                {member.bio || 'No bio available'}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-700">
                  {member.activity_score}%
                </div>
                <div className="text-xs text-blue-600">Activity</div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-700">
                  {member.total_points.toLocaleString()}
                </div>
                <div className="text-xs text-purple-600">Points</div>
              </div>
            </div>

            {/* Engagement & Streak */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", 
                  member.activity_score >= 80 ? 'bg-green-500' :
                  member.activity_score >= 50 ? 'bg-amber-500' : 'bg-gray-400'
                )} />
                <span className="text-sm text-gray-600">
                  {engagement.label} Engagement
                </span>
              </div>
              
              {member.current_streak > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Zap className="h-3 w-3 mr-1 text-orange-500" />
                  {member.current_streak} day streak
                </Badge>
              )}
            </div>

            {/* Badges Preview */}
            {member.badges.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {member.badges.slice(0, 3).map((badge, index) => (
                  <TooltipProvider key={badge.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 border-white shadow-md"
                          style={{ backgroundColor: badge.color }}
                        >
                          {badge.icon}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{badge.name}</p>
                        <p className="text-xs opacity-80">{badge.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                {member.badges.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white shadow-md">
                    +{member.badges.length - 3}
                  </div>
                )}
              </div>
            )}

            {/* Additional Info */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                </span>
              </div>
              
              {member.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{member.location}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {showActions && !isCurrentUser && (
              <div className="flex gap-2 pt-4">
                <Button 
                  size="sm" 
                  onClick={(e) => handleAction('message', e)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => handleAction('follow', e)}
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MemberCard;