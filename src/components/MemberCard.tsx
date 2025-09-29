import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Crown, 
  Shield, 
  User, 
  MoreVertical, 
  MessageCircle, 
  UserPlus, 
  UserMinus,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SimpleMember } from '@/types/simple-members';
import { cn } from '@/lib/utils';

interface MemberCardProps {
  member: SimpleMember;
  currentUserRole: 'creator' | 'moderator' | 'member';
  currentUserId?: string;
  onMessage?: (member: SimpleMember) => void;
  onPromote?: (member: SimpleMember) => void;
  onDemote?: (member: SimpleMember) => void;
  onRemove?: (member: SimpleMember) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({
  member,
  currentUserRole,
  currentUserId,
  onMessage,
  onPromote,
  onDemote,
  onRemove
}) => {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'creator':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'creator':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 'moderator':
        return 'bg-gradient-to-r from-blue-400 to-blue-600 text-white';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const canManage = () => {
    if (currentUserId === member.user_id) return false; // Can't manage yourself
    if (member.role === 'creator') return false; // Can't manage creator
    if (currentUserRole === 'creator') return true; // Creator can manage all
    if (currentUserRole === 'moderator' && member.role === 'member') return true; // Mod can manage members
    return false;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarUrl = () => {
    return member.avatar_url || 
           `https://ui-avatars.com/api/?name=${encodeURIComponent(member.display_name)}&background=6366f1&color=ffffff&size=150&bold=true&rounded=true`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-12 h-12 ring-2 ring-white shadow-md">
                  <AvatarImage 
                    src={getAvatarUrl()} 
                    alt={member.display_name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                    {getInitials(member.display_name)}
                  </AvatarFallback>
                </Avatar>
                
                {/* Online status indicator */}
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white",
                  member.is_online 
                    ? "bg-green-500 animate-pulse" 
                    : "bg-gray-300"
                )} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {member.display_name}
                  </h3>
                  {getRoleIcon(member.role)}
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {member.email}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>

            {canManage() && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0 opacity-60 hover:opacity-100">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {onMessage && (
                    <DropdownMenuItem onClick={() => onMessage(member)}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send Message
                    </DropdownMenuItem>
                  )}
                  
                  {member.role === 'member' && onPromote && (
                    <DropdownMenuItem onClick={() => onPromote(member)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Promote to Moderator
                    </DropdownMenuItem>
                  )}
                  
                  {member.role === 'moderator' && currentUserRole === 'creator' && onDemote && (
                    <DropdownMenuItem onClick={() => onDemote(member)}>
                      <UserMinus className="w-4 h-4 mr-2" />
                      Demote to Member
                    </DropdownMenuItem>
                  )}
                  
                  {onRemove && (
                    <DropdownMenuItem 
                      onClick={() => onRemove(member)}
                      className="text-red-600 dark:text-red-400"
                    >
                      <UserMinus className="w-4 h-4 mr-2" />
                      Remove Member
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Badge className={cn("text-xs font-medium", getRoleBadgeStyle(member.role))}>
              {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
            </Badge>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className={cn(
                "w-2 h-2 rounded-full",
                member.is_online ? "bg-green-500" : "bg-gray-300"
              )} />
              <span>
                {member.is_online 
                  ? 'Online now' 
                  : `Active ${formatDistanceToNow(new Date(member.last_active_at), { addSuffix: true })}`
                }
              </span>
            </div>
          </div>

          {member.bio && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-600 line-clamp-2">
                {member.bio}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MemberCard;