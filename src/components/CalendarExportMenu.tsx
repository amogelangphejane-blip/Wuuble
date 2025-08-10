import { useState } from 'react';
import { 
  Download, 
  Calendar,
  ExternalLink,
  Smartphone,
  Monitor,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useCalendarIntegration } from '@/utils/calendarIntegration';
import { CommunityEvent } from '@/types/events';
import { useToast } from '@/hooks/use-toast';

interface CalendarExportMenuProps {
  event: CommunityEvent;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export const CalendarExportMenu = ({ 
  event, 
  variant = 'outline', 
  size = 'sm',
  className 
}: CalendarExportMenuProps) => {
  const { toast } = useToast();
  const {
    downloadICS,
    openInGoogleCalendar,
    openInOutlook,
    openInYahooCalendar,
  } = useCalendarIntegration();

  const handleDownloadICS = () => {
    downloadICS(event);
    toast({
      title: "Calendar File Downloaded",
      description: "The event has been saved as an ICS file",
    });
  };

  const handleGoogleCalendar = () => {
    openInGoogleCalendar(event);
    toast({
      title: "Opening Google Calendar",
      description: "Event details will be pre-filled",
    });
  };

  const handleOutlook = () => {
    openInOutlook(event);
    toast({
      title: "Opening Outlook",
      description: "Event details will be pre-filled",
    });
  };

  const handleYahooCalendar = () => {
    openInYahooCalendar(event);
    toast({
      title: "Opening Yahoo Calendar",
      description: "Event details will be pre-filled",
    });
  };

  const calendarOptions = [
    {
      name: 'Google Calendar',
      icon: Calendar,
      action: handleGoogleCalendar,
      description: 'Add to Google Calendar',
      color: 'text-blue-600',
    },
    {
      name: 'Outlook',
      icon: Mail,
      action: handleOutlook,
      description: 'Add to Outlook Calendar',
      color: 'text-blue-700',
    },
    {
      name: 'Yahoo Calendar',
      icon: Calendar,
      action: handleYahooCalendar,
      description: 'Add to Yahoo Calendar',
      color: 'text-purple-600',
    },
    {
      name: 'Apple Calendar',
      icon: Smartphone,
      action: handleDownloadICS,
      description: 'Download ICS file for Apple Calendar',
      color: 'text-gray-600',
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Download className="h-4 w-4 mr-2" />
          Add to Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">Add to Calendar</p>
          <p className="text-xs text-gray-500">Choose your preferred calendar app</p>
        </div>
        <DropdownMenuSeparator />
        
        {calendarOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <DropdownMenuItem
              key={option.name}
              onClick={option.action}
              className="flex items-center gap-3 cursor-pointer"
            >
              <IconComponent className={`h-4 w-4 ${option.color}`} />
              <div className="flex-1">
                <div className="font-medium text-sm">{option.name}</div>
                <div className="text-xs text-gray-500">{option.description}</div>
              </div>
              <ExternalLink className="h-3 w-3 text-gray-400" />
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleDownloadICS} className="flex items-center gap-3">
          <Download className="h-4 w-4 text-gray-600" />
          <div className="flex-1">
            <div className="font-medium text-sm">Download ICS File</div>
            <div className="text-xs text-gray-500">Universal calendar format</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};