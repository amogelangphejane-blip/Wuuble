import { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  Mail, 
  Bell, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  UserPlus,
  UserMinus,
  Send,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { CommunityEvent, EventRSVP } from '@/types/events';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface WaitlistEntry extends EventRSVP {
  position: number;
  waitingSince: string;
  priority: 'high' | 'normal' | 'low';
  notificationsSent: number;
  lastNotificationSent?: string;
  user_profile: {
    display_name: string;
    avatar_url?: string;
    email?: string;
    member_since?: string;
    past_events_attended?: number;
  };
}

interface AutoPromotionRule {
  id: string;
  name: string;
  condition: 'spots_available' | 'time_based' | 'priority_based';
  value: number;
  enabled: boolean;
  notifyUsers: boolean;
}

interface EventWaitlistManagerProps {
  event: CommunityEvent;
  waitlistEntries: WaitlistEntry[];
  onPromoteFromWaitlist: (userId: string) => Promise<boolean>;
  onRemoveFromWaitlist: (userId: string) => Promise<boolean>;
  onSendNotification: (userIds: string[], message: string) => Promise<boolean>;
  onUpdatePriority: (userId: string, priority: WaitlistEntry['priority']) => Promise<boolean>;
  userCanManageEvent: boolean;
  className?: string;
}

export const EventWaitlistManager = ({
  event,
  waitlistEntries,
  onPromoteFromWaitlist,
  onRemoveFromWaitlist,
  onSendNotification,
  onUpdatePriority,
  userCanManageEvent,
  className
}: EventWaitlistManagerProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'position' | 'waiting_time' | 'priority'>('position');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'normal' | 'low'>('all');
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [autoRules, setAutoRules] = useState<AutoPromotionRule[]>([
    {
      id: '1',
      name: 'Auto-promote when spots available',
      condition: 'spots_available',
      value: 1,
      enabled: true,
      notifyUsers: true
    },
    {
      id: '2', 
      name: 'Promote high priority after 24 hours',
      condition: 'time_based',
      value: 24,
      enabled: false,
      notifyUsers: true
    }
  ]);

  const filteredEntries = waitlistEntries
    .filter(entry => {
      const matchesSearch = entry.user_profile.display_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = filterPriority === 'all' || entry.priority === filterPriority;
      return matchesSearch && matchesPriority;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'position':
          return a.position - b.position;
        case 'waiting_time':
          return new Date(a.waitingSince).getTime() - new Date(b.waitingSince).getTime();
        case 'priority':
          const priorityOrder = { high: 3, normal: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default:
          return 0;
      }
    });

  const availableSpots = event.max_attendees ? event.max_attendees - (event.rsvp_count || 0) : 0;
  const canPromote = availableSpots > 0;

  const handlePromote = async (userId: string) => {
    const success = await onPromoteFromWaitlist(userId);
    if (success) {
      toast({
        title: "Success",
        description: "User promoted from waitlist",
      });
    }
  };

  const handleBulkAction = async (action: 'promote' | 'remove' | 'message') => {
    if (selectedEntries.length === 0) return;

    switch (action) {
      case 'promote':
        const promotableCount = Math.min(selectedEntries.length, availableSpots);
        for (let i = 0; i < promotableCount; i++) {
          await handlePromote(selectedEntries[i]);
        }
        setSelectedEntries([]);
        break;
      
      case 'remove':
        for (const userId of selectedEntries) {
          await onRemoveFromWaitlist(userId);
        }
        setSelectedEntries([]);
        toast({
          title: "Success",
          description: `Removed ${selectedEntries.length} users from waitlist`,
        });
        break;
      
      case 'message':
        setShowMessageDialog(true);
        break;
    }
  };

  const handleSendMessage = async () => {
    if (!customMessage.trim()) return;
    
    const success = await onSendNotification(selectedEntries, customMessage);
    if (success) {
      setShowMessageDialog(false);
      setCustomMessage('');
      setSelectedEntries([]);
      toast({
        title: "Success",
        description: "Notifications sent successfully",
      });
    }
  };

  const getPriorityColor = (priority: WaitlistEntry['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'normal': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getEstimatedPromotionTime = (position: number) => {
    // Mock calculation - in reality this would be based on historical data
    const avgPromotionRate = 2; // users per day
    const daysToPromotion = position / avgPromotionRate;
    if (daysToPromotion < 1) return 'Within 24 hours';
    if (daysToPromotion < 7) return `${Math.ceil(daysToPromotion)} days`;
    return `${Math.ceil(daysToPromotion / 7)} weeks`;
  };

  if (!userCanManageEvent) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Access Restricted</h3>
            <p className="text-gray-600">You need event management permissions to view the waitlist.</p>
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
            <h2 className="text-2xl font-bold text-gray-900">Waitlist Management</h2>
            <p className="text-gray-600">
              {waitlistEntries.length} users waiting • {availableSpots} spots available
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              disabled={selectedEntries.length === 0 || !canPromote}
              onClick={() => handleBulkAction('promote')}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Promote ({Math.min(selectedEntries.length, availableSpots)})
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem 
                  onClick={() => handleBulkAction('message')}
                  disabled={selectedEntries.length === 0}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Message Selected
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleBulkAction('remove')}
                  disabled={selectedEntries.length === 0}
                  className="text-red-600"
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Remove Selected
                </DropdownMenuItem>
                <Separator />
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export Waitlist
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
                  <p className="text-2xl font-bold text-gray-900">{waitlistEntries.length}</p>
                  <p className="text-sm text-gray-600">Total Waiting</p>
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
                  <p className="text-2xl font-bold text-gray-900">{availableSpots}</p>
                  <p className="text-sm text-gray-600">Available Spots</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {waitlistEntries.filter(e => e.priority === 'high').length}
                  </p>
                  <p className="text-sm text-gray-600">High Priority</p>
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
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(waitlistEntries.reduce((acc, e) => 
                      acc + (Date.now() - new Date(e.waitingSince).getTime()), 0
                    ) / waitlistEntries.length / (1000 * 60 * 60 * 24)) || 0}
                  </p>
                  <p className="text-sm text-gray-600">Avg Wait (days)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="waitlist" className="w-full">
          <TabsList>
            <TabsTrigger value="waitlist">Waitlist ({waitlistEntries.length})</TabsTrigger>
            <TabsTrigger value="automation">Auto Rules</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="waitlist" className="space-y-4">
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="position">Position</SelectItem>
                  <SelectItem value="waiting_time">Waiting Time</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={(value) => setFilterPriority(value as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Waitlist Entries */}
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <Card key={entry.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={selectedEntries.includes(entry.user_id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedEntries([...selectedEntries, entry.user_id]);
                            } else {
                              setSelectedEntries(selectedEntries.filter(id => id !== entry.user_id));
                            }
                          }}
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-2xl font-bold text-gray-400">#{entry.position}</span>
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={entry.user_profile.avatar_url || ''} />
                          <AvatarFallback>
                            {entry.user_profile.display_name?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{entry.user_profile.display_name}</span>
                            <Badge className={cn('text-xs', getPriorityColor(entry.priority))}>
                              {entry.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Waiting {formatDistanceToNow(new Date(entry.waitingSince))}
                            </span>
                            <span className="flex items-center gap-1">
                              <Bell className="h-3 w-3" />
                              {entry.notificationsSent} notifications
                            </span>
                            {entry.user_profile.past_events_attended && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {entry.user_profile.past_events_attended} past events
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-right text-sm text-gray-600 mr-4">
                          <p>Est. promotion:</p>
                          <p className="font-medium">{getEstimatedPromotionTime(entry.position)}</p>
                        </div>
                        
                        <Select 
                          value={entry.priority} 
                          onValueChange={(value) => onUpdatePriority(entry.user_id, value as any)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          size="sm"
                          disabled={!canPromote}
                          onClick={() => handlePromote(entry.user_id)}
                          className="flex items-center gap-1"
                        >
                          <UserPlus className="h-4 w-4" />
                          Promote
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem 
                              onClick={() => onSendNotification([entry.user_id], 'You\'re still on the waitlist. We\'ll notify you when a spot opens!')}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Send Update
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onRemoveFromWaitlist(entry.user_id)}
                              className="text-red-600"
                            >
                              <UserMinus className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {entry.response_note && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                        <strong>Note:</strong> {entry.response_note}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {filteredEntries.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Waitlist Entries</h3>
                    <p className="text-gray-600 text-center">
                      {searchQuery || filterPriority !== 'all' ? 
                        'No entries match your current filters.' : 
                        'The waitlist is empty.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="automation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Automatic Promotion Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {autoRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={rule.enabled}
                        onCheckedChange={(checked) => {
                          setAutoRules(rules => 
                            rules.map(r => r.id === rule.id ? { ...r, enabled: !!checked } : r)
                          );
                        }}
                      />
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-sm text-gray-600">
                          {rule.condition === 'spots_available' && `When ${rule.value} or more spots become available`}
                          {rule.condition === 'time_based' && `After ${rule.value} hours on waitlist`}
                          {rule.condition === 'priority_based' && `High priority users first`}
                        </p>
                      </div>
                    </div>
                    <Badge variant={rule.enabled ? "default" : "outline"}>
                      {rule.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add New Rule
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Waitlist Conversion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Promoted from Waitlist</span>
                      <span>65%</span>
                    </div>
                    <Progress value={65} className="h-2" />
                    
                    <div className="flex justify-between text-sm">
                      <span>Average Wait Time</span>
                      <span>3.2 days</span>
                    </div>
                    <Progress value={45} className="h-2" />
                    
                    <div className="flex justify-between text-sm">
                      <span>Abandonment Rate</span>
                      <span>12%</span>
                    </div>
                    <Progress value={12} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Priority Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        High Priority
                      </span>
                      <span>{waitlistEntries.filter(e => e.priority === 'high').length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        Normal Priority
                      </span>
                      <span>{waitlistEntries.filter(e => e.priority === 'normal').length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                        Low Priority
                      </span>
                      <span>{waitlistEntries.filter(e => e.priority === 'low').length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Message Dialog */}
        <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Message Waitlisted Users</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Sending to {selectedEntries.length} selected users
                </p>
                <Textarea
                  placeholder="Enter your message here..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendMessage} disabled={!customMessage.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};