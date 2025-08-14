import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Video, 
  Users, 
  MessageCircle, 
  Calendar,
  Zap,
  Play,
  Clock,
  UserPlus,
  Phone,
  Monitor,
  Headphones,
  Settings,
  Star,
  Activity
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { validateAvatarUrl } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface OngoingCall {
  id: string;
  title: string;
  current_participants: number;
  max_participants: number;
  started_at: string;
  creator_id: string;
  creator_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface QuickAccessProps {
  communityId: string;
  communityName: string;
  isMember: boolean;
  isCreator: boolean;
}

export const QuickAccess = ({ communityId, communityName, isMember, isCreator }: QuickAccessProps) => {
  const [ongoingCalls, setOngoingCalls] = useState<OngoingCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [createCallDialogOpen, setCreateCallDialogOpen] = useState(false);
  const [newCallTitle, setNewCallTitle] = useState('');
  const [newCallMaxParticipants, setNewCallMaxParticipants] = useState(10);
  const [creatingCall, setCreatingCall] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch ongoing calls
  const fetchOngoingCalls = async () => {
    if (!isMember) return;
    
    try {
      const { data: calls, error } = await supabase
        .from('community_group_calls')
        .select(`
          id,
          title,
          current_participants,
          max_participants,
          started_at,
          creator_id,
          profiles!community_group_calls_creator_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .eq('community_id', communityId)
        .eq('status', 'active')
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Error fetching ongoing calls:', error);
        return;
      }

      const callsWithProfiles = (calls || []).map(call => ({
        ...call,
        creator_profile: call.profiles
      }));

      setOngoingCalls(callsWithProfiles);
    } catch (error) {
      console.error('Error fetching ongoing calls:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create a new group video call
  const createGroupCall = async () => {
    if (!user || !newCallTitle.trim()) return;

    setCreatingCall(true);
    try {
      const { data: call, error } = await supabase
        .from('community_group_calls')
        .insert([{
          community_id: communityId,
          creator_id: user.id,
          title: newCallTitle.trim(),
          max_participants: newCallMaxParticipants,
          status: 'active'
        }])
        .select('id')
        .single();

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Video call created successfully"
      });

      setCreateCallDialogOpen(false);
      setNewCallTitle('');
      setNewCallMaxParticipants(10);
      
      // Navigate to the group call
      navigate(`/communities/${communityId}/group-call/${call.id}`);
    } catch (error: any) {
      console.error('Error creating group call:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create video call",
        variant: "destructive"
      });
    } finally {
      setCreatingCall(false);
    }
  };

  // Join an existing call
  const joinCall = (callId: string) => {
    navigate(`/communities/${communityId}/group-call/${callId}`);
  };

  // Start a random video chat
  const startRandomVideoChat = () => {
    navigate('/chat');
  };

  useEffect(() => {
    fetchOngoingCalls();

    // Poll for ongoing calls every 10 seconds
    const interval = setInterval(fetchOngoingCalls, 10000);
    return () => clearInterval(interval);
  }, [communityId, isMember]);

  if (!isMember) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Zap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Join to access quick features</h3>
          <p className="text-muted-foreground">
            Become a member to access community video chat and other quick features.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Quick Access
          </CardTitle>
          <CardDescription>
            Instant access to community features and video chat
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Video Chat Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Community Video Chat
          </CardTitle>
          <CardDescription>
            Connect with community members through video calls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Create Group Call */}
            <Dialog open={createCallDialogOpen} onOpenChange={setCreateCallDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="h-16 flex-col gap-2">
                  <Users className="w-6 h-6" />
                  <span>Start Group Call</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Group Video Call</DialogTitle>
                  <DialogDescription>
                    Start a video call for community members to join
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Call Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Study Session, Community Hangout"
                      value={newCallTitle}
                      onChange={(e) => setNewCallTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Participants</label>
                    <select
                      value={newCallMaxParticipants}
                      onChange={(e) => setNewCallMaxParticipants(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value={5}>5 participants</option>
                      <option value={10}>10 participants</option>
                      <option value={15}>15 participants</option>
                      <option value={20}>20 participants</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={createGroupCall}
                    disabled={!newCallTitle.trim() || creatingCall}
                    className="flex-1"
                  >
                    {creatingCall ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        Create Call
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={() => setCreateCallDialogOpen(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Random Video Chat */}
            <Button 
              size="lg" 
              variant="outline" 
              className="h-16 flex-col gap-2"
              onClick={startRandomVideoChat}
            >
              <Phone className="w-6 h-6" />
              <span>Random Video Chat</span>
            </Button>
          </div>

          {/* Ongoing Calls */}
          {ongoingCalls.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Active Calls ({ongoingCalls.length})
              </h4>
              <div className="space-y-3">
                {ongoingCalls.map((call) => (
                  <Card key={call.id} className="border-green-200 bg-green-50/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage 
                                src={validateAvatarUrl(call.creator_profile?.avatar_url)} 
                                alt={call.creator_profile?.display_name || 'Host'}
                              />
                              <AvatarFallback>
                                {(call.creator_profile?.display_name || 'H').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                          </div>
                          <div>
                            <h5 className="font-semibold">{call.title}</h5>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {call.current_participants}/{call.max_participants}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(call.started_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <Activity className="w-3 h-3 mr-1" />
                            Live
                          </Badge>
                          <Button 
                            size="sm"
                            onClick={() => joinCall(call.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Join
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Quick Discussion */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/communities/${communityId}`)}>
          <CardContent className="p-6 text-center">
            <MessageCircle className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <h4 className="font-semibold mb-2">Quick Discussion</h4>
            <p className="text-sm text-muted-foreground">Jump to community discussions</p>
          </CardContent>
        </Card>

        {/* Quick Events */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/communities/${communityId}/calendar`)}>
          <CardContent className="p-6 text-center">
            <Calendar className="w-12 h-12 text-purple-500 mx-auto mb-3" />
            <h4 className="font-semibold mb-2">Quick Events</h4>
            <p className="text-sm text-muted-foreground">View upcoming events</p>
          </CardContent>
        </Card>

        {/* Community Stats */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Star className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <h4 className="font-semibold mb-2">Community Stats</h4>
            <p className="text-sm text-muted-foreground">View activity metrics</p>
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-muted-foreground mt-1" />
            <div>
              <h4 className="font-semibold mb-2">Quick Access Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Start group video calls with community members</li>
                <li>• Join random video chats with other users</li>
                <li>• Quick navigation to discussions and events</li>
                <li>• Real-time activity updates</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};