import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Mic, MicOff, VideoOff, Settings, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface CameraTestModalProps {
  trigger?: React.ReactNode;
}

export const CameraTestModal = ({ trigger }: CameraTestModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<{
    videoDevices: MediaDeviceInfo[];
    audioDevices: MediaDeviceInfo[];
  }>({ videoDevices: [], audioDevices: [] });
  const [permissions, setPermissions] = useState<{
    camera: PermissionState | 'unknown';
    microphone: PermissionState | 'unknown';
  }>({ camera: 'unknown', microphone: 'unknown' });
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check device permissions
  const checkPermissions = async () => {
    try {
      if (navigator.permissions) {
        const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        const microphonePermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        
        setPermissions({
          camera: cameraPermission.state,
          microphone: microphonePermission.state
        });
      }
    } catch (error) {
      console.log('Permission API not supported');
    }
  };

  // Enumerate devices
  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setDeviceInfo({
        videoDevices: devices.filter(device => device.kind === 'videoinput'),
        audioDevices: devices.filter(device => device.kind === 'audioinput')
      });
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
    }
  };

  // Start camera test
  const startCameraTest = async () => {
    try {
      setError(null);
      console.log('🎥 Starting camera test...');

      const testStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setStream(testStream);
      setIsStreaming(true);

      if (videoRef.current) {
        videoRef.current.srcObject = testStream;
        videoRef.current.play().catch(console.error);
      }

      console.log('✅ Camera test successful');
    } catch (error: any) {
      console.error('❌ Camera test failed:', error);
      setError(error.message || 'Failed to access camera');
    }
  };

  // Stop camera test
  const stopCameraTest = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsStreaming(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  // Initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      checkPermissions();
      enumerateDevices();
    } else {
      stopCameraTest();
    }
  }, [isOpen]);

  const getPermissionIcon = (state: PermissionState | 'unknown') => {
    switch (state) {
      case 'granted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'denied':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'prompt':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Camera className="w-4 h-4 mr-2" />
            Test Camera
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Camera & Microphone Test
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Video Preview */}
          <Card>
            <CardContent className="p-4">
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />
                {!isStreaming && (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm opacity-75">Click "Start Test" to preview your camera</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-4">
                {!isStreaming ? (
                  <Button onClick={startCameraTest} className="flex-1">
                    <Camera className="w-4 h-4 mr-2" />
                    Start Test
                  </Button>
                ) : (
                  <Button onClick={stopCameraTest} variant="destructive" className="flex-1">
                    <VideoOff className="w-4 h-4 mr-2" />
                    Stop Test
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-800">Camera Test Failed</h4>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Permissions Status */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3">Permissions Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    <span className="text-sm">Camera</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPermissionIcon(permissions.camera)}
                    <Badge variant={permissions.camera === 'granted' ? 'default' : 'secondary'}>
                      {permissions.camera}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    <span className="text-sm">Microphone</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPermissionIcon(permissions.microphone)}
                    <Badge variant={permissions.microphone === 'granted' ? 'default' : 'secondary'}>
                      {permissions.microphone}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device Information */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3">Available Devices</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Camera className="w-4 h-4" />
                    <span className="text-sm font-medium">Cameras ({deviceInfo.videoDevices.length})</span>
                  </div>
                  {deviceInfo.videoDevices.length === 0 ? (
                    <p className="text-sm text-gray-500 ml-6">No cameras detected</p>
                  ) : (
                    <div className="space-y-1 ml-6">
                      {deviceInfo.videoDevices.map((device, index) => (
                        <p key={device.deviceId} className="text-sm text-gray-700">
                          {device.label || `Camera ${index + 1}`}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Mic className="w-4 h-4" />
                    <span className="text-sm font-medium">Microphones ({deviceInfo.audioDevices.length})</span>
                  </div>
                  {deviceInfo.audioDevices.length === 0 ? (
                    <p className="text-sm text-gray-500 ml-6">No microphones detected</p>
                  ) : (
                    <div className="space-y-1 ml-6">
                      {deviceInfo.audioDevices.map((device, index) => (
                        <p key={device.deviceId} className="text-sm text-gray-700">
                          {device.label || `Microphone ${index + 1}`}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Browser Information */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3">Browser Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Secure Context (HTTPS):</span>
                  <Badge variant={window.isSecureContext ? 'default' : 'destructive'}>
                    {window.isSecureContext ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Media Devices API:</span>
                  <Badge variant={navigator.mediaDevices ? 'default' : 'destructive'}>
                    {navigator.mediaDevices ? 'Supported' : 'Not Supported'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>getUserMedia:</span>
                  <Badge variant={navigator.mediaDevices?.getUserMedia ? 'default' : 'destructive'}>
                    {navigator.mediaDevices?.getUserMedia ? 'Supported' : 'Not Supported'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};