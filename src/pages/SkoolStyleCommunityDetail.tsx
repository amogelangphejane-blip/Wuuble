import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SkoolDiscussions } from '@/components/SkoolDiscussions';
import { SkoolMembers } from '@/components/SkoolMembers';
import { SkoolClassroom } from '@/components/SkoolClassroom';
import { SkoolCalendar } from '@/components/SkoolCalendar';
import { SkoolLeaderboard } from '@/components/SkoolLeaderboard';
import { SkoolAbout } from '@/components/SkoolAbout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home,
  MessageSquare, 
  Users, 
  Calendar, 
  Trophy,
  BookOpen,
  Settings,
  Bell,
  Search,
  Plus,
  ChevronLeft,
  MoreHorizontal,
  Lock,
  Globe,
  Star,
  Zap,
  ArrowUp,
  Menu,
  X,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Community {
  id: string;
  name: string;
  description: string;
  avatar_url?: string;
  member_count: number;
  is_private: boolean;
  category?: string;
  created_at: string;
  owner_id: string;
  activity_score?: number;
}

const SkoolStyleCommunityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [activeSection, setActiveSection] = useState('community');
  const [userLevel, setUserLevel] = useState(3);
  const [userPoints, setUserPoints] = useState(450);
  const [notifications, setNotifications] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Get saved preference from localStorage
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    if (id) {
      fetchCommunity();
    }
  }, [id]);

  useEffect(() => {
    // Save sidebar preference to localStorage
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const fetchCommunity = async () => {
    try {
      setLoading(true);
      // Mock data
      const mockCommunity: Community = {
        id: id!,
        name: 'Growth Hackers Pro',
        description: 'Master the art of growth hacking and scale your business to new heights',
        avatar_url: '',
        member_count: 2847,
        is_private: false,
        category: 'business',
        created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        owner_id: 'owner123',
        activity_score: 92
      };
      setCommunity(mockCommunity);
      setIsMember(true); // Simulate user is a member
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const navigationItems = [
    { id: 'community', label: 'Community', icon: Home, badge: null },
    { id: 'classroom', label: 'Classroom', icon: BookOpen, badge: '3 new' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, badge: '2' },
    { id: 'members', label: 'Members', icon: Users, badge: community?.member_count },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, badge: null },
    { id: 'about', label: 'About', icon: Settings, badge: null },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Community Not Found</h2>
          <Button onClick={() => navigate('/communities')}>
            Back to Communities
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Top Header Bar - Skool Style */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-40">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left Section */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
              title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/communities')}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={community.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs">
                  {community.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-semibold text-sm">{community.name}</h1>
                <div className="flex items-center gap-2">
                  {community.is_private ? (
                    <Lock className="w-3 h-3 text-gray-500" />
                  ) : (
                    <Globe className="w-3 h-3 text-gray-500" />
                  )}
                  <span className="text-xs text-gray-500">
                    {community.member_count.toLocaleString()} members
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Section - Search */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search community..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotifications(!notifications)}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Bell className={cn("w-4 h-4", notifications && "text-blue-600")} />
            </Button>
            
            {/* User Level Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">Level {userLevel}</span>
            </div>

            {/* User Avatar */}
            <Avatar className="w-8 h-8 cursor-pointer">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-xs">
                {user?.email?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Level {userLevel}</span>
            <span>{userPoints} / 1000 points</span>
            <span>Level {userLevel + 1}</span>
          </div>
          <Progress value={(userPoints / 1000) * 100} className="h-1" />
        </div>
      </div>

      <div className="flex h-[calc(100vh-5rem)]">
        {/* Left Sidebar - Skool Style */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 256, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-hidden"
            >
          <div className="p-4">
            <Button 
              className="w-full bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black text-white"
              onClick={() => setActiveSection('community')}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </div>

          <nav className="px-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-colors",
                    isActive 
                      ? "bg-white dark:bg-gray-800 shadow-sm text-black dark:text-white" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn(
                      "w-4 h-4",
                      isActive ? "text-black dark:text-white" : "text-gray-500"
                    )} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge 
                      variant={isActive ? "default" : "secondary"} 
                      className="text-xs px-1.5 py-0 h-5"
                    >
                      {typeof item.badge === 'number' && item.badge > 999 
                        ? `${Math.floor(item.badge / 1000)}k+` 
                        : item.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Activity Score */}
          <div className="p-4 mt-auto border-t border-gray-200 dark:border-gray-800">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">Activity Score</span>
                <ArrowUp className="w-3 h-3 text-green-500" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold">{community.activity_score}</span>
                <span className="text-xs text-green-500 mb-1">+12%</span>
              </div>
              <Progress value={community.activity_score} className="h-1 mt-2" />
            </div>
          </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-950 relative">
          {/* Floating Sidebar Toggle for Mobile/Tablet */}
          {!sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="lg:hidden fixed bottom-4 left-4 z-50"
            >
              <Button
                onClick={toggleSidebar}
                size="icon"
                className="w-12 h-12 rounded-full shadow-lg bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black text-white"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </motion.div>
          )}
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              {activeSection === 'community' && (
                <SkoolDiscussions communityId={community.id} />
              )}
              {activeSection === 'classroom' && (
                <SkoolClassroom communityId={community.id} />
              )}
              {activeSection === 'calendar' && (
                <SkoolCalendar communityId={community.id} />
              )}
              {activeSection === 'members' && (
                <SkoolMembers communityId={community.id} memberCount={community.member_count} />
              )}
              {activeSection === 'leaderboard' && (
                <SkoolLeaderboard communityId={community.id} />
              )}
              {activeSection === 'about' && (
                <SkoolAbout community={community} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Sidebar - Quick Stats */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4 hidden xl:block overflow-hidden"
            >
          {/* Upcoming Events */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-sm mb-3">Upcoming Events</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Weekly Mastermind</p>
                  <p className="text-xs text-gray-500">Tomorrow at 2:00 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Q&A Session</p>
                  <p className="text-xs text-gray-500">Friday at 4:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Contributors */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-sm mb-3">Top Contributors</h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-4">#{i}</span>
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                      U{i}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">User {i}</p>
                    <p className="text-xs text-gray-500">{1000 - i * 100} points</p>
                  </div>
                  {i === 1 && <Trophy className="w-4 h-4 text-yellow-500" />}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <MessageSquare className="w-4 h-4 mr-2" />
                Start Discussion
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Event
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Invite Members
              </Button>
            </div>
          </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SkoolStyleCommunityDetail;