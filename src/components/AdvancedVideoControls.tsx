import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Settings, 
  Monitor,
  MonitorOff,
  Wifi,
  WifiOff,
  Signal,
  Volume2,
  VolumeX,
  Gauge,
  Zap,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  RotateCcw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface QualityMetrics {
  bandwidth: number;
  packetLoss: number;
  rtt: number;
  jitter: number;
  qualityScore: number;
  videoWidth?: number;
  videoHeight?: number;
}

interface AdvancedVideoControlsProps {
  // Media state
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  
  // Quality state
  currentVideoQuality: 'ultra' | 'high' | 'medium' | 'low';
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  qualityMetrics: Map<string, QualityMetrics>;
  
  // Actions
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onStartScreenShare: () => Promise<void>;
  onStopScreenShare: () => void;
  onSetVideoQuality: (quality: 'ultra' | 'high' | 'medium' | 'low') => Promise<void>;
  onEndCall: () => void;
  
  // Optional props
  className?: string;
  showAdvancedControls?: boolean;
  participantCount?: number;
}

const QualityIndicator: React.FC<{ 
  quality: 'excellent' | 'good' | 'poor' | 'disconnected';
  score?: number;
  showDetails?: boolean;
}> = ({ quality, score, showDetails = false }) => {
  const getQualityColor = () => {
    switch (quality) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-yellow-500';
      case 'poor': return 'bg-orange-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getQualityIcon = () => {
    switch (quality) {
      case 'excellent': return <Signal className="w-4 h-4" />;
      case 'good': return <Wifi className="w-4 h-4" />;
      case 'poor': return <WifiOff className="w-4 h-4" />;
      case 'disconnected': return <WifiOff className="w-4 h-4" />;
      default: return <Signal className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${getQualityColor()}`} />
      {getQualityIcon()}
      <span className="text-sm font-medium capitalize">{quality}</span>
      {showDetails && score !== undefined && (
        <Badge variant="outline" className="text-xs">
          {Math.round(score)}%
        </Badge>
      )}
    </div>
  );
};

const VideoQualitySelector: React.FC<{
  currentQuality: 'ultra' | 'high' | 'medium' | 'low';
  onQualityChange: (quality: 'ultra' | 'high' | 'medium' | 'low') => Promise<void>;
  disabled?: boolean;
}> = ({ currentQuality, onQualityChange, disabled = false }) => {
  const [isChanging, setIsChanging] = useState(false);

  const handleQualityChange = async (quality: 'ultra' | 'high' | 'medium' | 'low') => {
    setIsChanging(true);
    try {
      await onQualityChange(quality);
    } finally {
      setIsChanging(false);
    }
  };

  const qualityOptions = [
    { value: 'ultra', label: 'Ultra (1080p60)', icon: '🔥' },
    { value: 'high', label: 'High (720p30)', icon: '⭐' },
    { value: 'medium', label: 'Medium (540p24)', icon: '👍' },
    { value: 'low', label: 'Low (360p15)', icon: '💾' }
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={disabled || isChanging}
          className="min-w-[120px] justify-start"
        >
          <Eye className="w-4 h-4 mr-2" />
          {qualityOptions.find(q => q.value === currentQuality)?.label || 'Unknown'}
          {isChanging && <div className="ml-2 w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Video Quality</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {qualityOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleQualityChange(option.value)}
            className={currentQuality === option.value ? 'bg-accent' : ''}
          >
            <span className="mr-2">{option.icon}</span>
            {option.label}
            {currentQuality === option.value && (
              <Badge variant="secondary" className="ml-auto">Current</Badge>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const MetricsDisplay: React.FC<{
  metrics: Map<string, QualityMetrics>;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
}> = ({ metrics, connectionQuality }) => {
  const [selectedParticipant, setSelectedParticipant] = useState<string>('');

  useEffect(() => {
    // Auto-select first participant if none selected
    if (!selectedParticipant && metrics.size > 0) {
      setSelectedParticipant(Array.from(metrics.keys())[0]);
    }
  }, [metrics, selectedParticipant]);

  const selectedMetrics = selectedParticipant ? metrics.get(selectedParticipant) : null;

  const formatBandwidth = (bytes: number) => {
    const mbps = bytes / 1000000;
    return mbps >= 1 ? `${mbps.toFixed(1)} Mbps` : `${(bytes / 1000).toFixed(0)} Kbps`;
  };

  const formatLatency = (rtt: number) => {
    return `${Math.round(rtt * 1000)} ms`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Connection Metrics</h4>
        <QualityIndicator 
          quality={connectionQuality} 
          score={selectedMetrics?.qualityScore}
          showDetails
        />
      </div>

      {metrics.size > 1 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Participant:</label>
          <select 
            value={selectedParticipant}
            onChange={(e) => setSelectedParticipant(e.target.value)}
            className="w-full p-2 border rounded-md bg-background"
          >
            {Array.from(metrics.keys()).map((participantId) => (
              <option key={participantId} value={participantId}>
                {participantId.slice(0, 8)}...
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedMetrics && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Bandwidth:</span>
              <span className="font-mono">{formatBandwidth(selectedMetrics.bandwidth)}</span>
            </div>
            <Progress value={(selectedMetrics.bandwidth / 2000000) * 100} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Latency:</span>
              <span className="font-mono">{formatLatency(selectedMetrics.rtt)}</span>
            </div>
            <Progress value={Math.max(0, 100 - selectedMetrics.rtt * 200)} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Packet Loss:</span>
              <span className="font-mono">{selectedMetrics.packetLoss.toFixed(1)}%</span>
            </div>
            <Progress value={Math.max(0, 100 - selectedMetrics.packetLoss * 10)} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Quality Score:</span>
              <span className="font-mono">{Math.round(selectedMetrics.qualityScore)}/100</span>
            </div>
            <Progress value={selectedMetrics.qualityScore} className="h-2" />
          </div>

          {selectedMetrics.videoWidth && selectedMetrics.videoHeight && (
            <div className="col-span-2">
              <div className="flex justify-between text-sm">
                <span>Resolution:</span>
                <span className="font-mono">
                  {selectedMetrics.videoWidth}×{selectedMetrics.videoHeight}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {metrics.size === 0 && (
        <div className="text-center text-muted-foreground py-4">
          <Gauge className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No quality metrics available</p>
          <p className="text-xs">Metrics will appear once connected</p>
        </div>
      )}
    </div>
  );
};

export const AdvancedVideoControls: React.FC<AdvancedVideoControlsProps> = ({
  isVideoEnabled,
  isAudioEnabled,
  isScreenSharing,
  currentVideoQuality,
  connectionQuality,
  qualityMetrics,
  onToggleVideo,
  onToggleAudio,
  onStartScreenShare,
  onStopScreenShare,
  onSetVideoQuality,
  onEndCall,
  className = '',
  showAdvancedControls = true,
  participantCount = 0
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [volume, setVolume] = useState([80]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleScreenShare = async () => {
    if (isScreenSharing) {
      onStopScreenShare();
    } else {
      await onStartScreenShare();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className={`bg-gradient-to-t from-black/90 to-transparent pt-12 pb-6 ${className}`}>
      {/* Main Controls */}
      <div className="flex items-center justify-center gap-4 px-6 mb-4">
        {/* Audio Toggle */}
        <Button
          variant="ghost"
          size="lg"
          className={`w-12 h-12 rounded-full ${
            isAudioEnabled 
              ? 'bg-white/20 hover:bg-white/30 text-white' 
              : 'bg-red-500/80 hover:bg-red-500 text-white'
          }`}
          onClick={onToggleAudio}
        >
          {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </Button>

        {/* Video Toggle */}
        <Button
          variant="ghost"
          size="lg"
          className={`w-12 h-12 rounded-full ${
            isVideoEnabled 
              ? 'bg-white/20 hover:bg-white/30 text-white' 
              : 'bg-red-500/80 hover:bg-red-500 text-white'
          }`}
          onClick={onToggleVideo}
        >
          {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </Button>

        {/* Screen Share Toggle */}
        <Button
          variant="ghost"
          size="lg"
          className={`w-12 h-12 rounded-full ${
            isScreenSharing 
              ? 'bg-blue-500/80 hover:bg-blue-500 text-white' 
              : 'bg-white/20 hover:bg-white/30 text-white'
          }`}
          onClick={handleScreenShare}
        >
          {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
        </Button>

        {/* End Call */}
        <Button
          variant="ghost"
          size="lg"
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white"
          onClick={onEndCall}
        >
          <VideoOff className="w-7 h-7" />
        </Button>

        {/* Fullscreen Toggle */}
        <Button
          variant="ghost"
          size="lg"
          className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
        </Button>

        {/* Settings */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="lg"
              className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white"
            >
              <Settings className="w-6 h-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Advanced Video Settings
              </DialogTitle>
              <DialogDescription>
                Adjust video quality, monitor connection metrics, and configure advanced options
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="quality" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="quality">Quality</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="audio">Audio</TabsTrigger>
              </TabsList>

              <TabsContent value="quality" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Video Quality Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Current Quality:</label>
                        <p className="text-xs text-muted-foreground">
                          Higher quality uses more bandwidth
                        </p>
                      </div>
                      <VideoQualitySelector
                        currentQuality={currentVideoQuality}
                        onQualityChange={onSetVideoQuality}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Connection Quality:</label>
                        <p className="text-xs text-muted-foreground">
                          Real-time connection status
                        </p>
                      </div>
                      <QualityIndicator quality={connectionQuality} showDetails />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Participants:</label>
                        <p className="text-xs text-muted-foreground">
                          Total people in call
                        </p>
                      </div>
                      <Badge variant="outline" className="text-sm">
                        {participantCount} connected
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="metrics" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Gauge className="w-5 h-5" />
                      Connection Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MetricsDisplay 
                      metrics={qualityMetrics} 
                      connectionQuality={connectionQuality}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="audio" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Volume2 className="w-5 h-5" />
                      Audio Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Output Volume:</label>
                        <span className="text-sm text-muted-foreground">{volume[0]}%</span>
                      </div>
                      <Slider
                        value={volume}
                        onValueChange={setVolume}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Noise Suppression:</label>
                        <p className="text-xs text-muted-foreground">
                          Reduce background noise
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Echo Cancellation:</label>
                        <p className="text-xs text-muted-foreground">
                          Prevent audio feedback
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Auto Gain Control:</label>
                        <p className="text-xs text-muted-foreground">
                          Automatically adjust microphone levels
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quality Status Bar */}
      {showAdvancedControls && (
        <div className="flex items-center justify-center gap-4 px-6">
          <Card className="bg-black/60 backdrop-blur-md border-white/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-4 text-white text-sm">
                <QualityIndicator quality={connectionQuality} />
                <div className="w-px h-4 bg-white/20" />
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span className="capitalize">{currentVideoQuality}</span>
                </div>
                <div className="w-px h-4 bg-white/20" />
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  <span>Adaptive</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};