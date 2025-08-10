import { useState } from 'react';
import { 
  Clock, 
  MapPin, 
  Users, 
  Calendar,
  ExternalLink,
  Share2,
  Download,
  MoreVertical,
  Edit,
  Trash,
  UserCheck,
  Tag,
  Globe,
  Lock,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CommunityEvent, EventRSVP } from '@/types/events';
import { EventRSVPManager } from './EventRSVPManager';
import { EventSocialShare } from './EventSocialShare';
import { CalendarExportMenu } from './CalendarExportMenu';
import { format, parseISO, isAfter, isBefore, addHours } from 'date-fns';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: CommunityEvent;
  onRSVP: (eventId: string, status: EventRSVP['status'], note?: string) => Promise<boolean>;
  onShare: (eventId: string, platform: any) => Promise<string | null>;
  onDownloadCalendar: (event: CommunityEvent) => void;
  onEdit?: (event: CommunityEvent) => void;
  onDelete?: (eventId: string) => void;
  userCanManageEvent?: boolean;
  viewMode?: 'card' | 'list' | 'compact';
  className?: string;
}

export const EventCard = ({
  event,
  onRSVP,
  onShare,
  onDownloadCalendar,
  onEdit,
  onDelete,
  userCanManageEvent = false,
  viewMode = 'card',
  className
}: EventCardProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const eventDate = parseISO(event.event_date);
  const now = new Date();
  const isUpcoming = isAfter(eventDate, now);
  const isToday = format(eventDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
  const isPast = isBefore(eventDate, now) && !isToday;
  
  // Check if event is happening soon (within 2 hours)
  const isHappeningSoon = event.start_time && 
    isToday && 
    isBefore(now, addHours(new Date(`${event.event_date}T${event.start_time}`), 2));

  const getVisibilityIcon = () => {
    switch (event.visibility) {
      case 'public':
        return <Globe className="h-4 w-4 text-green-600" />;
      case 'private':
        return <Lock className="h-4 w-4 text-red-600" />;
      default:
        return <Users className="h-4 w-4 text-blue-600" />;
    }
  };

  const getRSVPStatusColor = () => {
    if (!event.user_rsvp) return '';
    switch (event.user_rsvp.status) {
      case 'going':
        return 'border-l-green-500';
      case 'maybe':
        return 'border-l-yellow-500';
      case 'not_going':
        return 'border-l-red-500';
      case 'waitlist':
        return 'border-l-blue-500';
      default:
        return '';
    }
  };

  if (viewMode === 'compact') {
    return (
      <div className={cn(
        "flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow",
        getRSVPStatusColor(),
        isPast && "opacity-75",
        className
      )}>
        {/* Category Color Indicator */}
        {event.category && (
          <div 
            className="w-1 h-12 rounded-full"
            style={{ backgroundColor: event.category.color }}
          />
        )}
        
        {/* Event Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(eventDate, 'MMM d')}
                    {event.start_time && `, ${event.start_time}`}
                  </span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{event.is_virtual ? 'Virtual' : event.location}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {event.user_rsvp && (
                <Badge variant="outline" className="text-xs">
                  <UserCheck className="h-3 w-3 mr-1" />
                  {event.user_rsvp.status.replace('_', ' ')}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(true)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <Card className={cn(
        "hover:shadow-lg transition-all duration-200",
        getRSVPStatusColor(),
        "border-l-4",
        isPast && "opacity-75",
        isHappeningSoon && "ring-2 ring-orange-200 bg-orange-50",
        className
      )}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                  {event.category && (
                    <Badge 
                      variant="secondary" 
                      className="mt-1"
                      style={{ backgroundColor: `${event.category.color}20`, color: event.category.color }}
                    >
                      {event.category.name}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getVisibilityIcon()}
                  {userCanManageEvent && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(event)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Event
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem 
                            onClick={() => onDelete(event.id)}
                            className="text-red-600"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete Event
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              {/* Event Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(eventDate, 'EEEE, MMMM d, yyyy')}
                    {event.start_time && ` at ${event.start_time}`}
                    {event.end_time && ` - ${event.end_time}`}
                  </span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{event.is_virtual ? 'Virtual Event' : event.location}</span>
                    {event.is_virtual && event.external_url && (
                      <a 
                        href={event.external_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}
                {event.max_attendees && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{event.rsvp_count || 0} / {event.max_attendees} attendees</span>
                  </div>
                )}
                {event.creator_profile && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={event.creator_profile.avatar_url || ''} />
                      <AvatarFallback className="text-xs">
                        {event.creator_profile.display_name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>by {event.creator_profile.display_name}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {event.description && (
                <p className="text-gray-700 text-sm line-clamp-2">{event.description}</p>
              )}

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {event.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                  {event.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{event.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              {/* Status Indicators */}
              <div className="flex items-center gap-2">
                {isHappeningSoon && (
                  <Badge variant="destructive" className="animate-pulse">
                    Starting Soon!
                  </Badge>
                )}
                {isPast && (
                  <Badge variant="secondary">
                    Past Event
                  </Badge>
                )}
                {event.requires_approval && (
                  <Badge variant="outline">
                    Approval Required
                  </Badge>
                )}
                {event.user_rsvp && (
                  <Badge 
                    variant="outline"
                    className={
                      event.user_rsvp.status === 'going' ? 'border-green-500 text-green-700' :
                      event.user_rsvp.status === 'maybe' ? 'border-yellow-500 text-yellow-700' :
                      event.user_rsvp.status === 'waitlist' ? 'border-blue-500 text-blue-700' :
                      'border-red-500 text-red-700'
                    }
                  >
                    <UserCheck className="h-3 w-3 mr-1" />
                    {event.user_rsvp.status.replace('_', ' ')}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{event.title}</DialogTitle>
                </DialogHeader>
                <EventRSVPManager
                  event={event}
                  onRSVP={onRSVP}
                  onDownloadCalendar={onDownloadCalendar}
                  userCanManageEvent={userCanManageEvent}
                />
              </DialogContent>
            </Dialog>

            <EventSocialShare
              event={event}
              onShare={onShare}
            />

            <CalendarExportMenu event={event} />

            {/* Quick RSVP Buttons */}
            {!isPast && (
              <div className="ml-auto flex gap-1">
                <Button
                  variant={event.user_rsvp?.status === 'going' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onRSVP(event.id, 'going')}
                  className="flex items-center gap-1"
                >
                  <UserCheck className="h-4 w-4" />
                  Going
                </Button>
                <Button
                  variant={event.user_rsvp?.status === 'maybe' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onRSVP(event.id, 'maybe')}
                  className="flex items-center gap-1"
                >
                  <Clock className="h-4 w-4" />
                  Maybe
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default card view
  return (
    <Card className={cn(
      "hover:shadow-lg transition-all duration-200 group",
      getRSVPStatusColor(),
      "border-l-4",
      isPast && "opacity-75",
      isHappeningSoon && "ring-2 ring-orange-200 bg-orange-50",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {event.title}
              </h3>
              {getVisibilityIcon()}
            </div>
            {event.category && (
              <Badge 
                variant="secondary"
                style={{ backgroundColor: `${event.category.color}20`, color: event.category.color }}
              >
                {event.category.name}
              </Badge>
            )}
          </div>
          {userCanManageEvent && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(event)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Event
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(event.id)}
                    className="text-red-600"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete Event
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Event Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>
              {format(eventDate, 'EEEE, MMMM d, yyyy')}
              {event.start_time && ` at ${event.start_time}`}
              {event.end_time && ` - ${event.end_time}`}
            </span>
          </div>
          
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{event.is_virtual ? 'Virtual Event' : event.location}</span>
              {event.is_virtual && event.external_url && (
                <a 
                  href={event.external_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          )}

          {(event.max_attendees || event.rsvp_count) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>
                {event.rsvp_count || 0}
                {event.max_attendees && ` / ${event.max_attendees}`} attendees
              </span>
            </div>
          )}

          {event.creator_profile && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Avatar className="h-5 w-5">
                <AvatarImage src={event.creator_profile.avatar_url || ''} />
                <AvatarFallback className="text-xs">
                  {event.creator_profile.display_name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>Created by {event.creator_profile.display_name}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-gray-700 text-sm line-clamp-3">{event.description}</p>
        )}

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {event.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
            {event.tags.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{event.tags.length - 4} more
              </Badge>
            )}
          </div>
        )}

        {/* Status Indicators */}
        <div className="flex items-center gap-2">
          {isHappeningSoon && (
            <Badge variant="destructive" className="animate-pulse">
              Starting Soon!
            </Badge>
          )}
          {isPast && (
            <Badge variant="secondary">
              Past Event
            </Badge>
          )}
          {event.requires_approval && (
            <Badge variant="outline">
              Approval Required
            </Badge>
          )}
          {event.user_rsvp && (
            <Badge 
              variant="outline"
              className={
                event.user_rsvp.status === 'going' ? 'border-green-500 text-green-700 bg-green-50' :
                event.user_rsvp.status === 'maybe' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
                event.user_rsvp.status === 'waitlist' ? 'border-blue-500 text-blue-700 bg-blue-50' :
                'border-red-500 text-red-700 bg-red-50'
              }
            >
              <UserCheck className="h-3 w-3 mr-1" />
              {event.user_rsvp.status.replace('_', ' ')}
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{event.title}</DialogTitle>
              </DialogHeader>
              <EventRSVPManager
                event={event}
                onRSVP={onRSVP}
                onDownloadCalendar={onDownloadCalendar}
                userCanManageEvent={userCanManageEvent}
              />
            </DialogContent>
          </Dialog>

                     <EventSocialShare
             event={event}
             onShare={onShare}
           />

           <CalendarExportMenu event={event} />

           {/* Quick RSVP Buttons */}
          {!isPast && (
            <div className="ml-auto flex gap-1">
              <Button
                variant={event.user_rsvp?.status === 'going' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onRSVP(event.id, 'going')}
                className="flex items-center gap-1"
              >
                <UserCheck className="h-4 w-4" />
                Going
              </Button>
              <Button
                variant={event.user_rsvp?.status === 'maybe' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onRSVP(event.id, 'maybe')}
                className="flex items-center gap-1"
              >
                <Clock className="h-4 w-4" />
                Maybe
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};