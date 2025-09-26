import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Video, Users, Mic, MicOff, VideoOff, Phone, Settings } from 'lucide-react';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import { ModernHeader } from '@/components/ModernHeader';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface VideoRoom {
  id: string;
  name: string;
  participants: number;
  maxParticipants: number;
  isActive: boolean;
  host?: string;
}

const CommunityVideoChat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [videoRooms, setVideoRooms] = useState<VideoRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [inCall, setInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVideoRooms();
    }
  }, [id]);

  const fetchVideoRooms = async () => {
    try {
      setLoading(true);
      // Mock data for video rooms
      const mockRooms: VideoRoom[] = [
        {
          id: '1',
          name: 'General Discussion',
          participants: 5,
          maxParticipants: 10,
          isActive: true,
          host: 'John Doe'
        },
        {
          id: '2',
          name: 'Study Group',
          participants: 3,
          maxParticipants: 6,
          isActive: true,
          host: 'Jane Smith'
        },
        {
          id: '3',
          name: 'Q&A Session',
          participants: 0,
          maxParticipants: 20,
          isActive: false
        }
      ];
      setVideoRooms(mockRooms);
    } catch (err) {
      console.error('Error fetching video rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = (roomId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setInCall(true);
    toast({
      title: 'Joining video room',
      description: 'Connecting to video chat...'
    });
  };

  const handleLeaveCall = () => {
    setInCall(false);
    toast({
      title: 'Left video room',
      description: 'You have left the video chat'
    });
  };

  const handleCreateRoom = () => {
    toast({
      title: 'Creating room',
      description: 'New video room is being created...'
    });
    
    // Add new room to the list
    const newRoom: VideoRoom = {
      id: Date.now().toString(),
      name: `${user?.email?.split('@')[0] || 'User'}'s Room`,
      participants: 1,
      maxParticipants: 10,
      isActive: true,
      host: user?.email?.split('@')[0] || 'User'
    };
    
    setVideoRooms([newRoom, ...videoRooms]);
    handleJoinRoom(newRoom.id);
  };

  if (!id) {
    return (
      <ResponsiveLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p>Invalid community ID</p>
        </div>
      </ResponsiveLayout>
    );
  }

  if (inCall) {
    return (
      <ResponsiveLayout>
        <ModernHeader />
        <div className="min-h-screen bg-gray-900 flex flex-col">
          {/* Video Call Interface */}
          <div className="flex-1 relative">
            {/* Main Video Area */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <Video className="w-24 h-24 mx-auto mb-4 text-gray-500" />
                <p className="text-white text-lg">Video Call Active</p>
                <p className="text-gray-400">Connected to room</p>
              </div>
            </div>

            {/* Participant Thumbnails */}
            <div className="absolute top-4 right-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-32 h-24 bg-gray-800 rounded-lg flex items-center justify-center">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback>U{i}</AvatarFallback>
                  </Avatar>
                </div>
              ))}
            </div>

            {/* Call Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur">
              <div className="flex items-center justify-center gap-4 py-6">
                <Button
                  variant={isMuted ? "destructive" : "secondary"}
                  size="icon"
                  className="w-12 h-12 rounded-full"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>
                
                <Button
                  variant={isVideoOff ? "destructive" : "secondary"}
                  size="icon"
                  className="w-12 h-12 rounded-full"
                  onClick={() => setIsVideoOff(!isVideoOff)}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </Button>
                
                <Button
                  variant="destructive"
                  size="icon"
                  className="w-12 h-12 rounded-full"
                  onClick={handleLeaveCall}
                >
                  <Phone className="w-5 h-5 rotate-[135deg]" />
                </Button>
                
                <Button
                  variant="secondary"
                  size="icon"
                  className="w-12 h-12 rounded-full"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <ModernHeader />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Button
            variant="ghost"
            onClick={() => navigate(`/community/${id}`)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Community
          </Button>

          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Video Chat Rooms</h1>
              <p className="text-gray-600">Join or create video chat rooms for real-time discussions</p>
            </div>
            <Button onClick={handleCreateRoom}>
              <Video className="w-4 h-4 mr-2" />
              Create Room
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : videoRooms.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Video className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">No active video rooms</p>
                <Button onClick={handleCreateRoom}>Create First Room</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {videoRooms.map((room) => (
                <Card key={room.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">{room.name}</span>
                      {room.isActive && (
                        <Badge variant="default" className="bg-green-500">
                          Active
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {room.host && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>Host: {room.host}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">
                            {room.participants}/{room.maxParticipants} participants
                          </span>
                        </div>
                      </div>

                      <div className="flex -space-x-2">
                        {Array.from({ length: Math.min(room.participants, 5) }).map((_, i) => (
                          <Avatar key={i} className="w-8 h-8 border-2 border-white">
                            <AvatarFallback className="text-xs">U{i + 1}</AvatarFallback>
                          </Avatar>
                        ))}
                        {room.participants > 5 && (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                            +{room.participants - 5}
                          </div>
                        )}
                      </div>

                      <Button 
                        className="w-full"
                        onClick={() => handleJoinRoom(room.id)}
                        disabled={room.participants >= room.maxParticipants}
                      >
                        {room.participants >= room.maxParticipants ? 'Room Full' : 'Join Room'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default CommunityVideoChat;