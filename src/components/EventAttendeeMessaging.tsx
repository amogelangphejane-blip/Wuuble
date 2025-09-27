import { useState, useEffect } from 'react';
import { 
  Send, 
  Users, 
  MessageSquare, 
  Filter, 
  Search,
  Clock,
  CheckCircle,
  Mail,
  Bell,
  Smartphone,
  Eye,
  UserCheck,
  MessageCircle,
  Paperclip,
  Image,
  MoreVertical,
  Trash,
  Edit,
  Copy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { CommunityEvent, EventRSVP } from '@/types/events';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface EventMessage {
  id: string;
  event_id: string;
  sender_id: string;
  subject: string;
  content: string;
  message_type: 'announcement' | 'reminder' | 'update' | 'cancellation';
  recipients: {
    user_id: string;
    sent_at: string;
    delivered_at?: string;
    opened_at?: string;
    clicked_at?: string;
    status: 'pending' | 'sent' | 'delivered' | 'opened' | 'failed';
  }[];
  attachments: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  scheduled_for?: string;
  created_at: string;
  sender_profile: {
    display_name: string;
    avatar_url?: string;
  };
}

interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: EventMessage['message_type'];
  is_default: boolean;
}

interface EventAttendeeMessagingProps {
  event: CommunityEvent;
  attendees: (EventRSVP & { user_profile: { display_name: string; avatar_url?: string; email?: string } })[];
  messages: EventMessage[];
  templates: MessageTemplate[];
  onSendMessage: (message: {
    subject: string;
    content: string;
    type: EventMessage['message_type'];
    recipientIds: string[];
    scheduledFor?: Date;
  }) => Promise<boolean>;
  onSaveTemplate: (template: Omit<MessageTemplate, 'id'>) => Promise<boolean>;
  userCanSendMessages: boolean;
  className?: string;
}

export const EventAttendeeMessaging = ({
  event,
  attendees,
  messages,
  templates,
  onSendMessage,
  onSaveTemplate,
  userCanSendMessages,
  className
}: EventAttendeeMessagingProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'compose' | 'templates' | 'history' | 'analytics'>('compose');
  const [composeDialog, setComposeDialog] = useState(false);
  
  // Compose form state
  const [messageForm, setMessageForm] = useState({
    subject: '',
    content: '',
    type: 'announcement' as EventMessage['message_type'],
    recipientFilter: 'all' as 'all' | 'going' | 'maybe' | 'custom',
    selectedRecipients: [] as string[],
    useTemplate: '',
    scheduleMessage: false,
    scheduledFor: undefined as Date | undefined,
  });

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | EventMessage['message_type']>('all');
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);

  // Template form
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    content: '',
    type: 'announcement' as EventMessage['message_type'],
    is_default: false,
  });

  const filteredAttendees = attendees.filter(attendee => {
    const matchesSearch = attendee.user_profile.display_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = messageForm.recipientFilter === 'all' || 
                         messageForm.recipientFilter === attendee.status ||
                         (messageForm.recipientFilter === 'custom' && selectedAttendees.includes(attendee.user_id));
    return matchesSearch && matchesFilter;
  });

  const getRecipients = (): string[] => {
    switch (messageForm.recipientFilter) {
      case 'going':
        return attendees.filter(a => a.status === 'going').map(a => a.user_id);
      case 'maybe':
        return attendees.filter(a => a.status === 'maybe').map(a => a.user_id);
      case 'custom':
        return messageForm.selectedRecipients;
      default:
        return attendees.map(a => a.user_id);
    }
  };

  const handleSendMessage = async () => {
    if (!messageForm.subject.trim() || !messageForm.content.trim()) {
      toast({
        title: "Error",
        description: "Subject and content are required",
        variant: "destructive",
      });
      return;
    }

    const recipients = getRecipients();
    if (recipients.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one recipient",
        variant: "destructive",
      });
      return;
    }

    const success = await onSendMessage({
      subject: messageForm.subject,
      content: messageForm.content,
      type: messageForm.type,
      recipientIds: recipients,
      scheduledFor: messageForm.scheduleMessage ? messageForm.scheduledFor : undefined,
    });

    if (success) {
      setComposeDialog(false);
      resetMessageForm();
      toast({
        title: "Success",
        description: messageForm.scheduleMessage ? "Message scheduled successfully" : "Message sent successfully",
      });
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.content.trim()) {
      toast({
        title: "Error",
        description: "Template name and content are required",
        variant: "destructive",
      });
      return;
    }

    const success = await onSaveTemplate(templateForm);
    if (success) {
      resetTemplateForm();
      toast({
        title: "Success",
        description: "Template saved successfully",
      });
    }
  };

  const loadTemplate = (template: MessageTemplate) => {
    setMessageForm(prev => ({
      ...prev,
      subject: template.subject,
      content: template.content,
      type: template.type,
      useTemplate: template.id,
    }));
  };

  const resetMessageForm = () => {
    setMessageForm({
      subject: '',
      content: '',
      type: 'announcement',
      recipientFilter: 'all',
      selectedRecipients: [],
      useTemplate: '',
      scheduleMessage: false,
      scheduledFor: undefined,
    });
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      subject: '',
      content: '',
      type: 'announcement',
      is_default: false,
    });
  };

  const getMessageTypeColor = (type: EventMessage['message_type']) => {
    switch (type) {
      case 'announcement': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reminder': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'update': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancellation': return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getDeliveryStats = (message: EventMessage) => {
    const total = message.recipients.length;
    const sent = message.recipients.filter(r => r.status !== 'pending').length;
    const delivered = message.recipients.filter(r => r.delivered_at).length;
    const opened = message.recipients.filter(r => r.opened_at).length;
    
    return { total, sent, delivered, opened };
  };

  const filteredMessages = messages.filter(message => {
    const matchesType = filterType === 'all' || message.message_type === filterType;
    return matchesType;
  });

  if (!userCanSendMessages) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Access Restricted</h3>
            <p className="text-gray-600">You need event management permissions to send messages.</p>
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
            <h2 className="text-2xl font-bold text-gray-900">Event Messaging</h2>
            <p className="text-gray-600">Communicate with event attendees</p>
          </div>
          <Button onClick={() => setComposeDialog(true)}>
            <Send className="h-4 w-4 mr-2" />
            Compose Message
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{attendees.length}</p>
                  <p className="text-sm text-gray-600">Total Recipients</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
                  <p className="text-sm text-gray-600">Messages Sent</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Eye className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {messages.length > 0 ? Math.round(
                      messages.reduce((acc, msg) => acc + getDeliveryStats(msg).opened, 0) /
                      messages.reduce((acc, msg) => acc + getDeliveryStats(msg).sent, 0) * 100
                    ) || 0 : 0}%
                  </p>
                  <p className="text-sm text-gray-600">Open Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {messages.length > 0 ? Math.round(
                      messages.reduce((acc, msg) => acc + getDeliveryStats(msg).delivered, 0) /
                      messages.reduce((acc, msg) => acc + getDeliveryStats(msg).sent, 0) * 100
                    ) || 0 : 0}%
                  </p>
                  <p className="text-sm text-gray-600">Delivery Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList>
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
            <TabsTrigger value="history">Message History ({messages.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="message-type">Message Type</Label>
                  <Select 
                    value={messageForm.type} 
                    onValueChange={(value) => setMessageForm(prev => ({ ...prev, type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">📢 Announcement</SelectItem>
                      <SelectItem value="reminder">⏰ Reminder</SelectItem>
                      <SelectItem value="update">📝 Update</SelectItem>
                      <SelectItem value="cancellation">❌ Cancellation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-select">Use Template (Optional)</Label>
                  <Select 
                    value={messageForm.useTemplate} 
                    onValueChange={(value) => {
                      if (value) {
                        const template = templates.find(t => t.id === value);
                        if (template) loadTemplate(template);
                      }
                      setMessageForm(prev => ({ ...prev, useTemplate: value }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="Enter message subject"
                    value={messageForm.subject}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Message Content *</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter your message here..."
                    value={messageForm.content}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, content: e.target.value }))}
                    className="min-h-[120px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Recipients</Label>
                  <Select 
                    value={messageForm.recipientFilter} 
                    onValueChange={(value) => setMessageForm(prev => ({ ...prev, recipientFilter: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Attendees ({attendees.length})</SelectItem>
                      <SelectItem value="going">Going ({attendees.filter(a => a.status === 'going').length})</SelectItem>
                      <SelectItem value="maybe">Maybe ({attendees.filter(a => a.status === 'maybe').length})</SelectItem>
                      <SelectItem value="custom">Custom Selection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {messageForm.recipientFilter === 'custom' && (
                  <div className="space-y-2">
                    <Label>Select Recipients</Label>
                    <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                      {attendees.map((attendee) => (
                        <div key={attendee.user_id} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            checked={messageForm.selectedRecipients.includes(attendee.user_id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setMessageForm(prev => ({
                                  ...prev,
                                  selectedRecipients: [...prev.selectedRecipients, attendee.user_id]
                                }));
                              } else {
                                setMessageForm(prev => ({
                                  ...prev,
                                  selectedRecipients: prev.selectedRecipients.filter(id => id !== attendee.user_id)
                                }));
                              }
                            }}
                          />
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={attendee.user_profile.avatar_url || ''} />
                            <AvatarFallback className="text-xs">
                              {attendee.user_profile.display_name?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{attendee.user_profile.display_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {attendee.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={messageForm.scheduleMessage}
                    onCheckedChange={(checked) => setMessageForm(prev => ({ ...prev, scheduleMessage: checked }))}
                  />
                  <Label>Schedule Message</Label>
                </div>

                {messageForm.scheduleMessage && (
                  <div className="space-y-2">
                    <Label htmlFor="schedule-date">Schedule For</Label>
                    <Input
                      id="schedule-date"
                      type="datetime-local"
                      value={messageForm.scheduledFor ? messageForm.scheduledFor.toISOString().slice(0, 16) : ''}
                      onChange={(e) => setMessageForm(prev => ({ 
                        ...prev, 
                        scheduledFor: e.target.value ? new Date(e.target.value) : undefined 
                      }))}
                    />
                  </div>
                )}

                <div className="flex justify-between">
                  <div className="text-sm text-gray-600">
                    Recipients: {getRecipients().length}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={resetMessageForm}>
                      Reset
                    </Button>
                    <Button onClick={handleSendMessage}>
                      <Send className="h-4 w-4 mr-2" />
                      {messageForm.scheduleMessage ? 'Schedule' : 'Send'} Message
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="flex justify-between">
              <h3 className="text-lg font-semibold">Message Templates</h3>
              <Dialog>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create Message Template</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">Template Name *</Label>
                      <Input
                        id="template-name"
                        placeholder="e.g., Event Reminder"
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="template-type">Type</Label>
                      <Select 
                        value={templateForm.type} 
                        onValueChange={(value) => setTemplateForm(prev => ({ ...prev, type: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="announcement">Announcement</SelectItem>
                          <SelectItem value="reminder">Reminder</SelectItem>
                          <SelectItem value="update">Update</SelectItem>
                          <SelectItem value="cancellation">Cancellation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="template-subject">Subject</Label>
                      <Input
                        id="template-subject"
                        placeholder="Template subject"
                        value={templateForm.subject}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="template-content">Content *</Label>
                      <Textarea
                        id="template-content"
                        placeholder="Template content..."
                        value={templateForm.content}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={templateForm.is_default}
                        onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, is_default: checked }))}
                      />
                      <Label>Set as default template</Label>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={resetTemplateForm}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveTemplate}>
                        Save Template
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{template.name}</h4>
                        <Badge className={cn('text-xs', getMessageTypeColor(template.type))}>
                          {template.type}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => loadTemplate(template)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Use Template
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {template.subject && (
                      <p className="text-sm font-medium text-gray-700 mb-1">{template.subject}</p>
                    )}
                    <p className="text-sm text-gray-600 line-clamp-2">{template.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="flex gap-4">
              <Select value={filterType} onValueChange={(value) => setFilterType(value as any)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Messages</SelectItem>
                  <SelectItem value="announcement">Announcements</SelectItem>
                  <SelectItem value="reminder">Reminders</SelectItem>
                  <SelectItem value="update">Updates</SelectItem>
                  <SelectItem value="cancellation">Cancellations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {filteredMessages.map((message) => {
                const stats = getDeliveryStats(message);
                return (
                  <Card key={message.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={message.sender_profile.avatar_url || ''} />
                            <AvatarFallback className="text-xs">
                              {message.sender_profile.display_name?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold">{message.subject}</h4>
                            <p className="text-sm text-gray-600">
                              by {message.sender_profile.display_name} • {format(new Date(message.created_at), 'MMM d, HH:mm')}
                            </p>
                          </div>
                        </div>
                        <Badge className={cn('text-xs', getMessageTypeColor(message.message_type))}>
                          {message.message_type}
                        </Badge>
                      </div>

                      <p className="text-gray-700 text-sm mb-3 line-clamp-2">{message.content}</p>

                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">{stats.sent}</p>
                          <p className="text-xs text-gray-600">Sent</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-green-600">{stats.delivered}</p>
                          <p className="text-xs text-gray-600">Delivered</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-blue-600">{stats.opened}</p>
                          <p className="text-xs text-gray-600">Opened</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-orange-600">
                            {stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0}%
                          </p>
                          <p className="text-xs text-gray-600">Open Rate</p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Delivery Progress</span>
                          <span>{stats.sent} / {stats.total}</span>
                        </div>
                        <Progress value={(stats.sent / stats.total) * 100} className="h-1" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Message Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Average Open Rate</span>
                      <span className="font-semibold">
                        {messages.length > 0 ? Math.round(
                          messages.reduce((acc, msg) => acc + getDeliveryStats(msg).opened, 0) /
                          messages.reduce((acc, msg) => acc + getDeliveryStats(msg).sent, 0) * 100
                        ) || 0 : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average Delivery Rate</span>
                      <span className="font-semibold">
                        {messages.length > 0 ? Math.round(
                          messages.reduce((acc, msg) => acc + getDeliveryStats(msg).delivered, 0) /
                          messages.reduce((acc, msg) => acc + getDeliveryStats(msg).sent, 0) * 100
                        ) || 0 : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Message Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['announcement', 'reminder', 'update', 'cancellation'].map((type) => {
                      const count = messages.filter(m => m.message_type === type).length;
                      return (
                        <div key={type} className="flex justify-between items-center">
                          <span className="capitalize">{type.replace('_', ' ')}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};