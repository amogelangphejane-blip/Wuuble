import { useState } from 'react';
import { 
  Share2, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Mail, 
  Link, 
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CommunityEvent, EventShare } from '@/types/events';
import { format } from 'date-fns';

interface EventSocialShareProps {
  event: CommunityEvent;
  onShare: (eventId: string, platform: EventShare['platform']) => Promise<string | null>;
  className?: string;
}

export const EventSocialShare = ({ event, onShare, className }: EventSocialShareProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const shareButtons = [
    {
      platform: 'facebook' as const,
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-white',
    },
    {
      platform: 'twitter' as const,
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-black hover:bg-gray-800',
      textColor: 'text-white',
    },
    {
      platform: 'linkedin' as const,
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700 hover:bg-blue-800',
      textColor: 'text-white',
    },
    {
      platform: 'email' as const,
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600 hover:bg-gray-700',
      textColor: 'text-white',
    },
  ];

  const handleShare = async (platform: EventShare['platform']) => {
    try {
      const shareUrl = await onShare(event.id, platform);
      
      if (shareUrl && platform !== 'copy_link') {
        window.open(shareUrl, '_blank', 'width=600,height=400');
      }
      
      if (platform !== 'copy_link') {
        toast({
          title: "Shared!",
          description: `Event shared on ${platform}`,
        });
      }
    } catch (error) {
      console.error('Error sharing event:', error);
      toast({
        title: "Error",
        description: "Failed to share event",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      const link = await onShare(event.id, 'copy_link');
      if (link) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  const generateShareText = () => {
    const eventDate = format(new Date(event.event_date), 'MMM d, yyyy');
    const timeInfo = event.start_time ? ` at ${event.start_time}` : '';
    const locationInfo = event.is_virtual ? ' (Virtual Event)' : event.location ? ` at ${event.location}` : '';
    
    return `Join me for "${event.title}" on ${eventDate}${timeInfo}${locationInfo}!`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Event
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Event Preview */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="font-semibold">{event.title}</h3>
                <div className="text-sm text-gray-600">
                  {format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}
                  {event.start_time && ` at ${event.start_time}`}
                </div>
                {event.location && (
                  <div className="text-sm text-gray-600">
                    {event.is_virtual ? '🌐 Virtual Event' : `📍 ${event.location}`}
                  </div>
                )}
                {event.category && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                    style={{ backgroundColor: `${event.category.color}20`, color: event.category.color }}
                  >
                    {event.category.name}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Share Message Customization */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Customize your message</label>
            <Textarea
              placeholder={generateShareText()}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Quick Copy Link */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Quick share</label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={`${window.location.origin}/communities/${event.community_id}/calendar?event=${event.id}`}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="flex items-center gap-2"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Social Media Buttons */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Share on social media</label>
            <div className="grid grid-cols-2 gap-3">
              {shareButtons.map((button) => {
                const IconComponent = button.icon;
                return (
                  <Button
                    key={button.platform}
                    variant="outline"
                    onClick={() => handleShare(button.platform)}
                    className={`flex items-center gap-2 ${button.color} ${button.textColor} border-0`}
                  >
                    <IconComponent className="h-4 w-4" />
                    {button.name}
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Additional Share Options */}
          <div className="space-y-3">
            <label className="text-sm font-medium">More options</label>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const subject = `Event: ${event.title}`;
                  const body = `${customMessage || generateShareText()}\n\nEvent Details:\n${window.location.origin}/communities/${event.community_id}/calendar?event=${event.id}`;
                  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                }}
                className="flex items-center gap-2 justify-start"
              >
                <Mail className="h-4 w-4" />
                Send via Email
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
            </div>
          </div>

          {/* Share Analytics (for event creators) */}
          {event.user_id === event.creator_profile?.display_name && (
            <div className="space-y-3">
              <Separator />
              <div className="space-y-2">
                <label className="text-sm font-medium">Share Analytics</label>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-gray-50 rounded">
                    <div className="font-semibold">0</div>
                    <div className="text-xs text-gray-600">Total Shares</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <div className="font-semibold">0</div>
                    <div className="text-xs text-gray-600">Link Clicks</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <div className="font-semibold">0</div>
                    <div className="text-xs text-gray-600">New RSVPs</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};