import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVideoChat } from '@/hooks/useVideoChat';
import { Video, VideoOff, Mic, MicOff, PhoneOff } from 'lucide-react';

interface VideoCallTestProps {
  communityId: string;
}

export const VideoCallTest: React.FC<VideoCallTestProps> = ({ communityId }) => {
  const {
    connectionStatus,
    isSearching,
    partnerConnected,
    cameraPermission,
    isVideoEnabled,
    isAudioEnabled,
    localVideoRef,
    remoteVideoRef,
    startChat,
    endChat,
    nextPartner,
    toggleVideo,
    toggleAudio,
    messages
  } = useVideoChat({
    useMockSignaling: false, // Use real Socket.IO
    autoConnect: false,
    serverUrl: 'https://wuuble.onrender.com'
  });

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'reconnecting': return 'text-orange-600';
      default: return 'text-red-600';
    }
  };

  const getStatusText = () => {
    if (isSearching) return 'Searching for partner...';
    if (partnerConnected) return 'Connected to partner';
    switch (connectionStatus) {
      case 'connected': return 'Connected to server';
      case 'connecting': return 'Connecting to server...';
      case 'reconnecting': return 'Reconnecting...';
      default: return 'Disconnected';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📹 Random Video Chat Test
            <span className={`text-sm font-normal ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">Connection</div>
              <div className={getStatusColor()}>{connectionStatus}</div>
            </div>
            <div>
              <div className="font-medium">Camera</div>
              <div className={cameraPermission === 'granted' ? 'text-green-600' : 'text-red-600'}>
                {cameraPermission}
              </div>
            </div>
            <div>
              <div className="font-medium">Searching</div>
              <div className={isSearching ? 'text-yellow-600' : 'text-gray-600'}>
                {isSearching ? 'Yes' : 'No'}
              </div>
            </div>
            <div>
              <div className="font-medium">Partner</div>
              <div className={partnerConnected ? 'text-green-600' : 'text-gray-600'}>
                {partnerConnected ? 'Connected' : 'None'}
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap gap-2">
            {!isSearching && !partnerConnected && (
              <Button 
                onClick={startChat} 
                disabled={connectionStatus === 'connecting'}
                className="bg-green-600 hover:bg-green-700"
              >
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Start Video Chat'}
              </Button>
            )}

            {(isSearching || partnerConnected) && (
              <Button 
                onClick={endChat}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <PhoneOff className="w-4 h-4" />
                End Chat
              </Button>
            )}

            {partnerConnected && (
              <>
                <Button 
                  onClick={nextPartner}
                  variant="outline"
                >
                  Next Partner
                </Button>

                <Button 
                  onClick={toggleVideo}
                  variant={isVideoEnabled ? "default" : "secondary"}
                  className="flex items-center gap-2"
                >
                  {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  {isVideoEnabled ? 'Video On' : 'Video Off'}
                </Button>

                <Button 
                  onClick={toggleAudio}
                  variant={isAudioEnabled ? "default" : "secondary"}
                  className="flex items-center gap-2"
                >
                  {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  {isAudioEnabled ? 'Audio On' : 'Audio Off'}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Video Streams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Local Video */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Video</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
                  <VideoOff className="w-8 h-8" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Remote Video */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Partner Video</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {!partnerConnected && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white text-center p-4">
                  {isSearching ? (
                    <div>
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p>Searching for partner...</p>
                    </div>
                  ) : (
                    <p>Click "Start Video Chat" to find a partner</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Messages */}
      {messages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Chat Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-2 rounded ${
                    message.isOwn 
                      ? 'bg-blue-100 ml-8 text-right' 
                      : 'bg-gray-100 mr-8'
                  }`}
                >
                  <div className="text-sm">{message.text}</div>
                  <div className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm font-mono">
          <div><span className="font-bold">Server URL:</span> https://wuuble.onrender.com</div>
          <div><span className="font-bold">Community ID:</span> {communityId}</div>
          <div><span className="font-bold">Socket.IO Status:</span> {connectionStatus}</div>
          <div><span className="font-bold">WebRTC Status:</span> {partnerConnected ? 'Active' : 'Inactive'}</div>
          <div><span className="font-bold">Media Permissions:</span> {cameraPermission}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoCallTest;
