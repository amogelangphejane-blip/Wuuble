import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface VideoDebugInfoProps {
  localStream: MediaStream | null;
  participants: any[];
  participantStreams: Map<string, MediaStream>;
  isConnected: boolean;
  callStatus: string;
}

export const VideoDebugInfo: React.FC<VideoDebugInfoProps> = ({
  localStream,
  participants,
  participantStreams,
  isConnected,
  callStatus
}) => {
  return (
    <Card className="fixed bottom-4 right-4 w-80 max-h-96 overflow-y-auto bg-black/80 text-white border-white/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Video Chat Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span>Status:</span>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {callStatus}
          </Badge>
        </div>
        
        <div>
          <span className="font-semibold">Local Stream:</span>
          {localStream ? (
            <div className="ml-2">
              <div>ID: {localStream.id}</div>
              <div>Tracks: {localStream.getTracks().length}</div>
              {localStream.getTracks().map(track => (
                <div key={track.id} className="ml-2">
                  {track.kind}: {track.enabled ? '✅' : '❌'} ({track.readyState})
                </div>
              ))}
            </div>
          ) : (
            <span className="text-red-400"> None</span>
          )}
        </div>

        <div>
          <span className="font-semibold">Participants:</span>
          <div className="ml-2">
            <div>Count: {participants.length}</div>
            {participants.map(participant => (
              <div key={participant.id} className="ml-2">
                <div>{participant.displayName}</div>
                <div className="text-xs text-gray-400">
                  Video: {participant.isVideoEnabled ? '✅' : '❌'} | 
                  Audio: {participant.isAudioEnabled ? '✅' : '❌'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <span className="font-semibold">Remote Streams:</span>
          <div className="ml-2">
            <div>Count: {participantStreams.size}</div>
            {Array.from(participantStreams.entries()).map(([participantId, stream]) => (
              <div key={participantId} className="ml-2">
                <div>ID: {participantId.slice(0, 8)}...</div>
                <div>Stream: {stream.id}</div>
                <div>Tracks: {stream.getTracks().length}</div>
                {stream.getTracks().map(track => (
                  <div key={track.id} className="ml-2 text-xs">
                    {track.kind}: {track.enabled ? '✅' : '❌'}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};