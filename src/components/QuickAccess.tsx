import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Zap,
  MessageSquare,
  Calendar,
  Users,
  BookOpen,
  Trophy,
  Settings,
  ArrowRight,
  Activity
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { validateAvatarUrl } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';


interface QuickAccessProps {
  communityId: string;
  communityName: string;
  isMember: boolean;
  isCreator: boolean;
}

export const QuickAccess = ({ communityId, communityName, isMember, isCreator }: QuickAccessProps) => {
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!isMember) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Zap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Join to access quick features</h3>
          <p className="text-muted-foreground">
            Become a member to access community discussions, events, and other features.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Discussions */}
            <Button 
              size="lg" 
              variant="outline" 
              className="h-16 flex-col gap-2"
              onClick={() => navigate(`/community/${communityId}`)}
            >
              <MessageSquare className="w-6 h-6" />
              <span>Discussions</span>
            </Button>
            
            {/* Classroom */}
            <Button 
              size="lg" 
              variant="outline" 
              className="h-16 flex-col gap-2"
              onClick={() => navigate(`/community/${communityId}`)}
            >
              <BookOpen className="w-6 h-6" />
              <span>Classroom</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Quick Discussion */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/community/${communityId}`)}>
          <CardContent className="p-6 text-center">
            <MessageSquare className="w-12 h-12 text-primary mx-auto mb-4" />
            <h4 className="font-semibold mb-2">Discussion</h4>
            <p className="text-sm text-muted-foreground">
              Join community discussions
            </p>
          </CardContent>
        </Card>

        {/* Quick Calendar */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/community/${communityId}`)}>
          <CardContent className="p-6 text-center">
            <Calendar className="w-12 h-12 text-primary mx-auto mb-4" />
            <h4 className="font-semibold mb-2">Events</h4>
            <p className="text-sm text-muted-foreground">
              View upcoming events
            </p>
          </CardContent>
        </Card>

        {/* Quick Members */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/community/${communityId}`)}>
          <CardContent className="p-6 text-center">
            <Users className="w-12 h-12 text-primary mx-auto mb-4" />
            <h4 className="font-semibold mb-2">Members</h4>
            <p className="text-sm text-muted-foreground">
              Connect with members
            </p>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/community/${communityId}`)}>
          <CardContent className="p-6 text-center">
            <Trophy className="w-12 h-12 text-primary mx-auto mb-4" />
            <h4 className="font-semibold mb-2">Leaderboard</h4>
            <p className="text-sm text-muted-foreground">
              View top contributors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tips Card */}
      <Card className="border-dashed">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-muted-foreground mt-1" />
            <div>
              <h4 className="font-semibold mb-2">Quick Access Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Participate in community discussions</li>
                <li>• Quick navigation to classroom and events</li>
                <li>• View leaderboard and achievements</li>
                <li>• Connect with community members</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};