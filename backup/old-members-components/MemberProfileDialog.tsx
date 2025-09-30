import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  Target,
  ExternalLink,
  Copy,
  Share,
  X,
  ChevronRight,
  Flame,
  Trophy
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EnhancedMemberProfile, MemberActivity } from '@/types/community-members';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface MemberProfileDialogProps {
  member: EnhancedMemberProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserRole?: 'member' | 'moderator' | 'creator';
  currentUserId?: string;
  onMessage?: (member: EnhancedMemberProfile) => void;
  onFollow?: (member: EnhancedMemberProfile) => void;
  onAwardBadge?: (member: EnhancedMemberProfile) => void;
  onPromote?: (member: EnhancedMemberProfile) => void;
  onRemove?: (member: EnhancedMemberProfile) => void;
}

const MemberProfileDialog: React.FC<MemberProfileDialogProps> = ({
  member,
  open,
  onOpenChange,
  currentUserRole = 'member',
  currentUserId,
  onMessage,
  onFollow,
  onAwardBadge,
  onPromote,
  onRemove
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isFollowing, setIsFollowing] = useState(false);

  // Reset tab when member changes
  useEffect(() => {
    if (member) {
      setActiveTab('overview');
    }
  }, [member?.id]);

  if (!member) return null;

  const isCurrentUser = currentUserId === member.user_id;
  const canManage = currentUserRole !== 'member' && !isCurrentUser && member.role !== 'creator';

  // Get status info
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
        color: 'bg-amber-500', 
        text: `Active ${formatDistanceToNow(new Date(member.last_seen_at), { addSuffix: true })}`,
        pulse: false 
      };
    }
    return { 
      color: 'bg-gray-400', 
      text: `Last seen ${formatDistanceToNow(new Date(member.last_seen_at), { addSuffix: true })}`,
      pulse: false 
    };
  };

  // Get role config
  const getRoleConfig = () => {
    switch (member.role) {
      case 'creator':
        return {
          icon: Crown,
          gradient: 'from-yellow-400 via-orange-500 to-red-500',
          badgeClass: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
          label: 'Creator'
        };
      case 'moderator':
        return {
          icon: Shield,
          gradient: 'from-blue-400 via-blue-500 to-blue-600',
          badgeClass: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
          label: 'Moderator'
        };
      default:
        return {
          icon: Users,
          gradient: 'from-gray-400 via-gray-500 to-gray-600',
          badgeClass: 'bg-gradient-to-r from-gray-400 to-gray-600 text-white',
          label: 'Member'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const roleConfig = getRoleConfig();
  const RoleIcon = roleConfig.icon;

  // Mock activity data (in real app, this would come from the member data)
  const mockActivities: MemberActivity[] = [
    {
      id: '1',
      member_id: member.id,
      community_id: member.community_id,
      activity_type: 'post_created',
      activity_subtype: null,
      activity_data: { title: 'Welcome to the community!' },
      points_earned: 10,
      engagement_weight: 1.5,
      related_entity_id: null,
      related_entity_type: null,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      occurred_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      member_id: member.id,
      community_id: member.community_id,
      activity_type: 'comment_created',
      activity_subtype: null,
      activity_data: { content: 'Great discussion!' },
      points_earned: 5,
      engagement_weight: 1.0,
      related_entity_id: null,
      related_entity_type: null,
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      occurred_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      member_id: member.id,
      community_id: member.community_id,
      activity_type: 'badge_earned',
      activity_subtype: null,
      activity_data: { badge_name: 'First Post' },
      points_earned: 50,
      engagement_weight: 2.0,
      related_entity_id: null,
      related_entity_type: null,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      occurred_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Mock stats
  const mockStats = {
    posts_created: 23,
    comments_made: 89,
    reactions_given: 156,
    reactions_received: 234,
    events_attended: 12,
    calls_joined: 8,
    badges_earned: member.badges.length,
    profile_views: 1247
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
        {/* Header with gradient background */}
        <div className={cn(
          "h-40 bg-gradient-to-r relative overflow-hidden",
          `bg-gradient-to-r ${roleConfig.gradient}`
        )}>
          <div className="absolute inset-0 bg-black/20" />
          
          {/* Animated background pattern */}
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, white 2px, transparent 2px), radial-gradient(circle at 80% 50%, white 2px, transparent 2px)',
              backgroundSize: '50px 50px',
            }}
          />

          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/30 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header stats */}
          <div className="absolute top-4 left-4 flex gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
              <div className="text-white text-sm font-medium">
                <Eye className="h-3 w-3 inline mr-1" />
                {mockStats.profile_views.toLocaleString()}
              </div>
              <div className="text-white/80 text-xs">views</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
              <div className="text-white text-sm font-medium">
                <Heart className="h-3 w-3 inline mr-1" />
                {mockStats.reactions_received.toLocaleString()}
              </div>
              <div className="text-white/80 text-xs">likes</div>
            </div>
          </div>
        </div>

        <div className="relative -mt-20 px-6 pb-6">
          {/* Avatar and basic info */}
          <div className="flex items-start gap-6 mb-6">
            <div className="relative">
              <Avatar className="w-32 h-32 border-6 border-white shadow-2xl">
                <AvatarImage 
                  src={member.avatar_url || undefined} 
                  alt={member.display_name || 'Member'}
                />
                <AvatarFallback className={cn(
                  "bg-gradient-to-br text-white text-4xl font-bold",
                  `bg-gradient-to-br ${roleConfig.gradient}`
                )}>
                  {(member.display_name || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white shadow-lg",
                      statusInfo.color,
                      statusInfo.pulse && "animate-pulse"
                    )} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{statusInfo.text}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold text-gray-900">
                      {member.display_name || 'Anonymous User'}
                    </h2>
                    <Badge className={cn(roleConfig.badgeClass, "text-sm")}>
                      <RoleIcon className="h-4 w-4 mr-1" />
                      {roleConfig.label}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-2">{statusInfo.text}</p>
                  
                  {member.location && (
                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>{member.location}</span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  {!isCurrentUser && (
                    <>
                      <Button onClick={() => onMessage?.(member)} className="bg-blue-600 hover:bg-blue-700">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsFollowing(!isFollowing);
                          onFollow?.(member);
                        }}
                      >
                        <Heart className={cn("h-4 w-4 mr-2", isFollowing && "fill-red-500 text-red-500")} />
                        {isFollowing ? 'Following' : 'Follow'}
                      </Button>
                    </>
                  )}
                  
                  {canManage && (
                    <>
                      <Button variant="outline" onClick={() => onAwardBadge?.(member)}>
                        <Gift className="h-4 w-4 mr-2" />
                        Award Badge
                      </Button>
                      <Button variant="outline" onClick={() => onPromote?.(member)}>
                        <Crown className="h-4 w-4 mr-2" />
                        Promote
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Bio */}
              {member.bio && (
                <p className="text-gray-700 leading-relaxed mb-4">
                  {member.bio}
                </p>
              )}

              {/* Quick stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{member.activity_score}%</div>
                  <div className="text-xs text-gray-600">Activity Score</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{member.total_points.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Total Points</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{member.badges.length}</div>
                  <div className="text-xs text-gray-600">Badges</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{member.current_streak}</div>
                  <div className="text-xs text-gray-600">Day Streak</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>

            <div className="mt-6 max-h-96 overflow-y-auto">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Membership Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Membership Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Member Since</div>
                      <div className="font-semibold">
                        {format(new Date(member.joined_at), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {member.days_since_joined} days ago
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Engagement Level</div>
                      <div className="font-semibold capitalize">{member.engagement_level}</div>
                      <div className="text-xs text-gray-500">
                        {member.engagement_percentage}% active
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Current Streak</div>
                      <div className="font-semibold flex items-center gap-1">
                        <Flame className="h-4 w-4 text-orange-500" />
                        {member.current_streak} days
                      </div>
                      <div className="text-xs text-gray-500">
                        Longest: {member.longest_streak} days
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Community Role</div>
                      <div className="font-semibold capitalize">{member.role}</div>
                      <div className="text-xs text-gray-500">
                        Since {format(new Date(member.joined_at), 'MMM yyyy')}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Activity Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Overall Activity</span>
                          <span className="text-sm font-semibold">{member.activity_score}%</span>
                        </div>
                        <Progress value={member.activity_score} className="h-3" />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 pt-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-900">{mockStats.posts_created}</div>
                          <div className="text-xs text-gray-600">Posts</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-900">{mockStats.comments_made}</div>
                          <div className="text-xs text-gray-600">Comments</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-900">{mockStats.reactions_given}</div>
                          <div className="text-xs text-gray-600">Reactions</div>
                        </div>
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
                      Recent Activity Timeline
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
                          className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            {activity.activity_type === 'post_created' && <MessageSquare className="h-5 w-5 text-blue-600" />}
                            {activity.activity_type === 'comment_created' && <MessageCircle className="h-5 w-5 text-green-600" />}
                            {activity.activity_type === 'badge_earned' && <Award className="h-5 w-5 text-yellow-600" />}
                            {activity.activity_type === 'reaction_added' && <Heart className="h-5 w-5 text-red-600" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium capitalize">
                              {activity.activity_type.replace('_', ' ')}
                            </p>
                            {activity.activity_data.title && (
                              <p className="text-sm text-gray-600">
                                "{activity.activity_data.title}"
                              </p>
                            )}
                            {activity.activity_data.badge_name && (
                              <p className="text-sm text-gray-600">
                                Earned "{activity.activity_data.badge_name}" badge
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(activity.occurred_at), { addSuffix: true })}
                              </span>
                              {activity.points_earned > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  +{activity.points_earned} pts
                                </Badge>
                              )}
                            </div>
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
                        <Card className="hover:shadow-lg transition-all duration-300">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shadow-lg"
                                style={{ backgroundColor: badge.color, color: 'white' }}
                              >
                                {badge.icon}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg">{badge.name}</h4>
                                <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant="outline"
                                    style={{ borderColor: badge.color, color: badge.color }}
                                    className="text-xs"
                                  >
                                    {badge.rarity}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {badge.badge_type}
                                  </Badge>
                                </div>
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
                      <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-700 mb-2">No badges yet</h3>
                      <p className="text-sm text-gray-500">
                        {member.display_name || 'This member'} hasn't earned any badges yet.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Statistics Tab */}
              <TabsContent value="stats" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Engagement Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Engagement</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Posts Created</span>
                        <span className="font-semibold">{mockStats.posts_created}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Comments Made</span>
                        <span className="font-semibold">{mockStats.comments_made}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Reactions Given</span>
                        <span className="font-semibold">{mockStats.reactions_given}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Reactions Received</span>
                        <span className="font-semibold">{mockStats.reactions_received}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Participation Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Participation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Events Attended</span>
                        <span className="font-semibold">{mockStats.events_attended}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Calls Joined</span>
                        <span className="font-semibold">{mockStats.calls_joined}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Badges Earned</span>
                        <span className="font-semibold">{mockStats.badges_earned}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Profile Views</span>
                        <span className="font-semibold">{mockStats.profile_views.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Activity Heatmap placeholder */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Activity Pattern</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-32 bg-gradient-to-r from-blue-100 via-green-100 to-yellow-100 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">Activity heatmap coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemberProfileDialog;