import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Crown, 
  Shield, 
  MessageCircle, 
  Users,
  Activity,
  Award,
  Calendar,
  Clock,
  MapPin,
  Star,
  TrendingUp,
  Heart,
  MessageSquare,
  Eye,
  Zap,
  Gift,
  Target
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { EnhancedCommunityMember } from '@/types/members';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MemberProfileDialogProps {
  member: EnhancedCommunityMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserRole?: 'member' | 'moderator' | 'creator';
  isCreator?: boolean;
  onMessage?: () => void;
  onAction?: (action: string, member: EnhancedCommunityMember) => void;
}

const MemberProfileDialog: React.FC<MemberProfileDialogProps> = ({
  member,
  open,
  onOpenChange,
  currentUserRole = 'member',
  isCreator = false,
  onMessage,
  onAction
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!member) return null;

  const getStatusInfo = () => {
    if (member.is_online) {
      return { 
        color: 'bg-green-500', 
        text: 'Online now', 
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

  const statusInfo = getStatusInfo();
  const roleConfig = getRoleConfig();
  const RoleIcon = roleConfig.icon;

  const mockActivities = [
    { id: 1, type: 'post', description: 'Created a new post', date: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { id: 2, type: 'comment', description: 'Commented on "Community Guidelines"', date: new Date(Date.now() - 5 * 60 * 60 * 1000) },
    { id: 3, type: 'reaction', description: 'Liked 3 posts', date: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    { id: 4, type: 'event', description: 'Joined "Weekly Meetup"', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
  ];

  const mockStats = {
    posts: 23,
    comments: 89,
    likes_given: 156,
    likes_received: 234,
    events_joined: 12,
    streak_days: 15
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        {/* Header with gradient background */}
        <div className={cn(
          "h-32 bg-gradient-to-r relative overflow-hidden",
          `bg-gradient-to-r ${roleConfig.color}`
        )}>
          <div className="absolute inset-0 bg-black/20" />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
            animate={{ x: [-100, 300] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          />
        </div>

        <div className="relative -mt-16 px-6 pb-6">
          {/* Avatar and basic info */}
          <div className="flex items-start gap-6 mb-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
                <AvatarImage 
                  src={member.profiles?.avatar_url || undefined} 
                  alt={member.profiles?.display_name || 'Member'}
                />
                <AvatarFallback className={cn(
                  "bg-gradient-to-br text-white text-3xl font-bold",
                  `bg-gradient-to-br ${roleConfig.color}`
                )}>
                  {(member.profiles?.display_name || 'A')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-3 border-white shadow-lg",
                    statusInfo.color,
                    statusInfo.pulse && "animate-pulse"
                  )} />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{statusInfo.text}</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex-1">
              <DialogHeader className="text-left">
                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                  {member.profiles?.display_name || 'Anonymous User'}
                  <Badge className={cn(roleConfig.badgeColor, "text-white")}>
                    <RoleIcon className="h-4 w-4 mr-1" />
                    {roleConfig.label}
                  </Badge>
                </DialogTitle>
                <p className="text-gray-600 mt-2">{statusInfo.text}</p>
              </DialogHeader>
              
              {(member.member_bio || member.profiles?.bio) && (
                <p className="text-gray-700 mt-3 leading-relaxed">
                  {member.member_bio || member.profiles?.bio}
                </p>
              )}

              <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  <span>{member.activity_score || 0}% active</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button onClick={onMessage} className="bg-blue-600 hover:bg-blue-700">
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
              
              {(isCreator || currentUserRole === 'moderator') && member.role !== 'creator' && (
                <Button variant="outline">
                  <Gift className="h-4 w-4 mr-2" />
                  Award Badge
                </Button>
              )}
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{member.activity_score || 0}%</div>
                <div className="text-xs text-gray-600">Activity Score</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{member.days_since_joined || 0}</div>
                <div className="text-xs text-gray-600">Days Member</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">{member.badges?.length || 0}</div>
                <div className="text-xs text-gray-600">Badges Earned</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">{mockStats.streak_days}</div>
                <div className="text-xs text-gray-600">Day Streak</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
            </TabsList>

            <div className="mt-6 max-h-96 overflow-y-auto">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                {/* Engagement metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Engagement Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Posts Created</span>
                          <Badge variant="outline">{mockStats.posts}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Comments</span>
                          <Badge variant="outline">{mockStats.comments}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Events Joined</span>
                          <Badge variant="outline">{mockStats.events_joined}</Badge>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Likes Given</span>
                          <Badge variant="outline">{mockStats.likes_given}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Likes Received</span>
                          <Badge variant="outline">{mockStats.likes_received}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Active Streak</span>
                          <Badge className="bg-orange-100 text-orange-700">
                            {mockStats.streak_days} days
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Score Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      Activity Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Overall Activity</span>
                        <span className="text-sm font-semibold">{member.activity_score || 0}%</span>
                      </div>
                      <Progress value={member.activity_score || 0} className="h-3" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">85%</div>
                        <div className="text-xs text-gray-600">Participation</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">92%</div>
                        <div className="text-xs text-gray-600">Helpfulness</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">78%</div>
                        <div className="text-xs text-gray-600">Consistency</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-gray-600" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockActivities.map((activity, index) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            {activity.type === 'post' && <MessageSquare className="h-4 w-4 text-blue-600" />}
                            {activity.type === 'comment' && <MessageCircle className="h-4 w-4 text-green-600" />}
                            {activity.type === 'reaction' && <Heart className="h-4 w-4 text-red-600" />}
                            {activity.type === 'event' && <Calendar className="h-4 w-4 text-purple-600" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.description}</p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(activity.date, { addSuffix: true })}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Badges Tab */}
              <TabsContent value="badges" className="space-y-4">
                {member.badges && member.badges.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {member.badges.map((badge, index) => (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                                style={{ backgroundColor: `${badge.color}20`, color: badge.color }}
                              >
                                {badge.icon}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold">{badge.name}</h4>
                                <p className="text-xs text-gray-600">{badge.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-700 mb-2">No badges yet</h3>
                      <p className="text-sm text-gray-500">
                        {member.profiles?.display_name || 'This member'} hasn't earned any badges yet.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemberProfileDialog;