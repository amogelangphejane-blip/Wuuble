import { useState, useRef, useEffect } from 'react';
import { 
  QrCode, 
  Scan, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Download,
  Camera,
  Upload,
  User,
  MapPin,
  Calendar,
  Search,
  Filter,
  MoreVertical,
  UserCheck,
  AlertTriangle,
  Smartphone,
  Monitor
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CommunityEvent, EventRSVP } from '@/types/events';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CheckInRecord {
  id: string;
  event_id: string;
  user_id: string;
  checked_in_at: string;
  check_in_method: 'qr_code' | 'manual' | 'self_checkin';
  checked_in_by?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  device_info?: {
    type: 'mobile' | 'desktop';
    user_agent: string;
  };
  user_profile: {
    display_name: string;
    avatar_url?: string;
    email?: string;
  };
}

interface EventCheckInSystemProps {
  event: CommunityEvent;
  rsvpList: EventRSVP[];
  checkInRecords: CheckInRecord[];
  onCheckIn: (userId: string, method: CheckInRecord['check_in_method']) => Promise<boolean>;
  onBulkCheckIn: (userIds: string[]) => Promise<boolean>;
  onExportCheckIns: () => Promise<void>;
  userCanManageCheckIns: boolean;
  className?: string;
}

export const EventCheckInSystem = ({
  event,
  rsvpList,
  checkInRecords,
  onCheckIn,
  onBulkCheckIn,
  onExportCheckIns,
  userCanManageCheckIns,
  className
}: EventCheckInSystemProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'checkin' | 'scanner' | 'analytics'>('checkin');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'checked_in' | 'not_checked_in'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [manualCheckInDialog, setManualCheckInDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate event QR code data
  const eventQRData = {
    event_id: event.id,
    community_id: event.community_id,
    check_in_url: `${window.location.origin}/events/${event.id}/checkin`,
    timestamp: Date.now()
  };

  // Create attendee list with check-in status
  const attendeeList = rsvpList
    .filter(rsvp => rsvp.status === 'going')
    .map(rsvp => {
      const checkInRecord = checkInRecords.find(record => record.user_id === rsvp.user_id);
      return {
        ...rsvp,
        isCheckedIn: !!checkInRecord,
        checkInRecord
      };
    })
    .filter(attendee => {
      const matchesSearch = attendee.user_profile?.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || 
                           (filterStatus === 'checked_in' && attendee.isCheckedIn) ||
                           (filterStatus === 'not_checked_in' && !attendee.isCheckedIn);
      return matchesSearch && matchesFilter;
    });

  const totalExpected = rsvpList.filter(rsvp => rsvp.status === 'going').length;
  const totalCheckedIn = checkInRecords.length;
  const checkInRate = totalExpected > 0 ? (totalCheckedIn / totalExpected) * 100 : 0;

  // QR Code Scanner functionality
  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScannerActive(true);
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopScanner = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScannerActive(false);
  };

  const handleManualCheckIn = async () => {
    if (!selectedUser) return;
    
    const success = await onCheckIn(selectedUser, 'manual');
    if (success) {
      setManualCheckInDialog(false);
      setSelectedUser('');
      toast({
        title: "Success",
        description: "User checked in successfully",
      });
    }
  };

  const handleBulkCheckIn = async () => {
    if (selectedUsers.length === 0) return;
    
    const success = await onBulkCheckIn(selectedUsers);
    if (success) {
      setSelectedUsers([]);
      toast({
        title: "Success",
        description: `${selectedUsers.length} users checked in successfully`,
      });
    }
  };

  // Generate QR Code URL (in real app, use a QR code library)
  const generateQRCodeURL = (data: any) => {
    const qrData = encodeURIComponent(JSON.stringify(data));
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;
  };

  const getCheckInMethodIcon = (method: CheckInRecord['check_in_method']) => {
    switch (method) {
      case 'qr_code':
        return <QrCode className="h-4 w-4 text-blue-600" />;
      case 'manual':
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'self_checkin':
        return <Smartphone className="h-4 w-4 text-purple-600" />;
    }
  };

  if (!userCanManageCheckIns) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Access Restricted</h3>
            <p className="text-gray-600">You need event management permissions to access check-in system.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Event Check-In</h2>
            <p className="text-gray-600">{event.title}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(event.event_date), 'MMM d, yyyy')}
              </span>
              {event.start_time && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {event.start_time}
                </span>
              )}
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {event.location}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowQRDialog(true)}>
              <QrCode className="h-4 w-4 mr-2" />
              Show QR Code
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={onExportCheckIns}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Check-ins
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalExpected}</p>
                  <p className="text-sm text-gray-600">Expected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalCheckedIn}</p>
                  <p className="text-sm text-gray-600">Checked In</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalExpected - totalCheckedIn}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(checkInRate)}%</p>
                  <p className="text-sm text-gray-600">Check-in Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Event Check-in Progress</span>
                <span>{totalCheckedIn} / {totalExpected}</span>
              </div>
              <Progress value={checkInRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList>
            <TabsTrigger value="checkin">Check-in List</TabsTrigger>
            <TabsTrigger value="scanner">QR Scanner</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="checkin" className="space-y-4">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search attendees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Attendees</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="not_checked_in">Not Checked In</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={() => setManualCheckInDialog(true)}
                variant="outline"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Manual Check-in
              </Button>

              {selectedUsers.length > 0 && (
                <Button onClick={handleBulkCheckIn}>
                  <Users className="h-4 w-4 mr-2" />
                  Check-in Selected ({selectedUsers.length})
                </Button>
              )}
            </div>

            {/* Attendee List */}
            <div className="space-y-2">
              {attendeeList.map((attendee) => (
                <Card key={attendee.id} className={cn(
                  "transition-colors",
                  attendee.isCheckedIn ? "bg-green-50 border-green-200" : "hover:bg-gray-50"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(attendee.user_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, attendee.user_id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== attendee.user_id));
                            }
                          }}
                          className="rounded"
                        />
                        
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={attendee.user_profile?.avatar_url || ''} />
                          <AvatarFallback>
                            {attendee.user_profile?.display_name?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {attendee.user_profile?.display_name || 'Unknown User'}
                            </span>
                            {attendee.isCheckedIn && (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Checked In
                              </Badge>
                            )}
                          </div>
                          {attendee.checkInRecord && (
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                {getCheckInMethodIcon(attendee.checkInRecord.check_in_method)}
                                {attendee.checkInRecord.check_in_method.replace('_', ' ')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(attendee.checkInRecord.checked_in_at), 'HH:mm')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {!attendee.isCheckedIn && (
                        <Button
                          size="sm"
                          onClick={() => onCheckIn(attendee.user_id, 'manual')}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Check In
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {attendeeList.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Attendees Found</h3>
                    <p className="text-gray-600 text-center">
                      {searchQuery ? 'No attendees match your search.' : 'No one has RSVP\'d as going yet.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="scanner" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scan className="h-5 w-5" />
                  QR Code Scanner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!scannerActive ? (
                  <div className="text-center py-8">
                    <Camera className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Start QR Scanner</h3>
                    <p className="text-gray-600 mb-4">
                      Use your camera to scan attendee QR codes for quick check-in
                    </p>
                    <Button onClick={startScanner}>
                      <Camera className="h-4 w-4 mr-2" />
                      Start Camera
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg"></div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button onClick={stopScanner} variant="outline" className="flex-1">
                        Stop Scanner
                      </Button>
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload QR Image
                      </Button>
                    </div>
                    
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Point your camera at the QR code on an attendee's phone or ticket to check them in automatically.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
                
                <canvas ref={canvasRef} className="hidden" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Check-in Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <QrCode className="h-4 w-4 text-blue-600" />
                        QR Code
                      </span>
                      <span>{checkInRecords.filter(r => r.check_in_method === 'qr_code').length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        Manual
                      </span>
                      <span>{checkInRecords.filter(r => r.check_in_method === 'manual').length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-purple-600" />
                        Self Check-in
                      </span>
                      <span>{checkInRecords.filter(r => r.check_in_method === 'self_checkin').length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Device Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-blue-600" />
                        Mobile
                      </span>
                      <span>{checkInRecords.filter(r => r.device_info?.type === 'mobile').length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-gray-600" />
                        Desktop
                      </span>
                      <span>{checkInRecords.filter(r => r.device_info?.type === 'desktop').length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Check-ins</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {checkInRecords
                      .sort((a, b) => new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime())
                      .slice(0, 10)
                      .map((record) => (
                        <div key={record.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={record.user_profile.avatar_url || ''} />
                              <AvatarFallback>
                                {record.user_profile.display_name?.charAt(0)?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{record.user_profile.display_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {getCheckInMethodIcon(record.check_in_method)}
                            <span>{format(new Date(record.checked_in_at), 'HH:mm')}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* QR Code Dialog */}
        <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Event Check-in QR Code</DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-4">
              <img
                src={generateQRCodeURL(eventQRData)}
                alt="Event QR Code"
                className="mx-auto border rounded"
              />
              <p className="text-sm text-gray-600">
                Attendees can scan this QR code to check themselves in to the event
              </p>
              <Button onClick={() => {
                const link = document.createElement('a');
                link.download = `${event.title}-qr-code.png`;
                link.href = generateQRCodeURL(eventQRData);
                link.click();
              }}>
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Manual Check-in Dialog */}
        <Dialog open={manualCheckInDialog} onOpenChange={setManualCheckInDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manual Check-in</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select attendee to check in" />
                </SelectTrigger>
                <SelectContent>
                  {attendeeList
                    .filter(attendee => !attendee.isCheckedIn)
                    .map((attendee) => (
                      <SelectItem key={attendee.user_id} value={attendee.user_id}>
                        {attendee.user_profile?.display_name || 'Unknown User'}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setManualCheckInDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleManualCheckIn} disabled={!selectedUser}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Check In
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};