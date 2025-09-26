import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Info, 
  Users, 
  Calendar, 
  Globe, 
  Shield, 
  Target,
  Award,
  TrendingUp,
  Settings,
  Bell,
  CreditCard,
  LogOut
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SkoolAboutProps {
  community: {
    id: string;
    name: string;
    description: string;
    created_at: string;
    member_count: number;
    is_private: boolean;
  };
}

export const SkoolAbout: React.FC<SkoolAboutProps> = ({ community }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">About</h1>
        <p className="text-gray-500 text-sm mt-1">Community information and settings</p>
      </div>

      <div className="space-y-6">
        {/* Community Info */}
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-2">Community Overview</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {community.description}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Members</p>
                  <p className="text-lg font-semibold">{community.member_count.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Founded</p>
                  <p className="text-lg font-semibold">
                    {formatDistanceToNow(new Date(community.created_at), { addSuffix: false })} ago
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="text-lg font-semibold">
                    {community.is_private ? 'Private' : 'Public'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Activity</p>
                  <p className="text-lg font-semibold">Very Active</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Community Rules */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-3">Community Guidelines</h2>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Be respectful and professional in all interactions</li>
                <li>• No spam, self-promotion without value, or irrelevant content</li>
                <li>• Share knowledge and help other members grow</li>
                <li>• Keep discussions constructive and on-topic</li>
                <li>• Report any inappropriate behavior to moderators</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Settings */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Settings</h2>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Bell className="w-4 h-4 mr-3" />
              Notification Preferences
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <CreditCard className="w-4 h-4 mr-3" />
              Billing & Subscription
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Settings className="w-4 h-4 mr-3" />
              Account Settings
            </Button>
            <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
              <LogOut className="w-4 h-4 mr-3" />
              Leave Community
            </Button>
          </div>
        </Card>

        {/* Achievements */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-3">Your Achievements</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Badge variant="secondary" className="py-2 justify-center">
                  🎯 First Post
                </Badge>
                <Badge variant="secondary" className="py-2 justify-center">
                  💬 10 Comments
                </Badge>
                <Badge variant="secondary" className="py-2 justify-center">
                  🔥 7 Day Streak
                </Badge>
                <Badge variant="secondary" className="py-2 justify-center">
                  ❤️ 100 Likes Given
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};