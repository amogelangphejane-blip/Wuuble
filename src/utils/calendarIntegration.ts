import { CommunityEvent, CalendarExportData } from '@/types/events';
import { format, parseISO } from 'date-fns';

export class CalendarIntegration {
  // Generate ICS file content for calendar apps
  static generateICS(event: CommunityEvent): string {
    const startDate = new Date(`${event.event_date}T${event.start_time || '00:00'}:00`);
    const endDate = new Date(`${event.event_date}T${event.end_time || '23:59'}:00`);
    
    // Format dates for ICS (YYYYMMDDTHHMMSSZ)
    const formatICSDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Community App//Event Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${event.id}@communityapp.com
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:${event.title}
DESCRIPTION:${this.escapeICSText(event.description || '')}
LOCATION:${this.escapeICSText(event.is_virtual ? (event.external_url || 'Virtual Event') : (event.location || ''))}
${event.external_url ? `URL:${event.external_url}` : ''}
CATEGORIES:${event.category?.name || 'General'}
STATUS:CONFIRMED
TRANSP:OPAQUE
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Event reminder
TRIGGER:-PT15M
END:VALARM
END:VEVENT
END:VCALENDAR`;

    return icsContent;
  }

  // Escape special characters for ICS format
  private static escapeICSText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }

  // Download ICS file
  static downloadICS(event: CommunityEvent): void {
    const icsContent = this.generateICS(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Generate Google Calendar URL
  static generateGoogleCalendarUrl(event: CommunityEvent): string {
    const startDate = new Date(`${event.event_date}T${event.start_time || '00:00'}:00`);
    const endDate = new Date(`${event.event_date}T${event.end_time || '23:59'}:00`);
    
    const formatGoogleDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
      details: event.description || '',
      location: event.is_virtual ? (event.external_url || 'Virtual Event') : (event.location || ''),
      trp: 'false', // Show busy time
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  // Generate Outlook Calendar URL
  static generateOutlookUrl(event: CommunityEvent): string {
    const startDate = new Date(`${event.event_date}T${event.start_time || '00:00'}:00`);
    const endDate = new Date(`${event.event_date}T${event.end_time || '23:59'}:00`);

    const params = new URLSearchParams({
      subject: event.title,
      startdt: startDate.toISOString(),
      enddt: endDate.toISOString(),
      body: event.description || '',
      location: event.is_virtual ? (event.external_url || 'Virtual Event') : (event.location || ''),
      allday: 'false',
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  }

  // Generate Yahoo Calendar URL
  static generateYahooCalendarUrl(event: CommunityEvent): string {
    const startDate = new Date(`${event.event_date}T${event.start_time || '00:00'}:00`);
    const endDate = new Date(`${event.event_date}T${event.end_time || '23:59'}:00`);

    const formatYahooDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const params = new URLSearchParams({
      v: '60',
      title: event.title,
      st: formatYahooDate(startDate),
      et: formatYahooDate(endDate),
      desc: event.description || '',
      in_loc: event.is_virtual ? (event.external_url || 'Virtual Event') : (event.location || ''),
    });

    return `https://calendar.yahoo.com/?${params.toString()}`;
  }

  // Generate Apple Calendar URL (webcal protocol)
  static generateAppleCalendarUrl(event: CommunityEvent): string {
    // For Apple Calendar, we create a data URL with ICS content
    const icsContent = this.generateICS(event);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    return URL.createObjectURL(blob);
  }

  // Generate calendar export data for API integrations
  static generateCalendarExportData(event: CommunityEvent): CalendarExportData {
    const startDate = new Date(`${event.event_date}T${event.start_time || '00:00'}:00`);
    const endDate = new Date(`${event.event_date}T${event.end_time || '23:59'}:00`);
    
    return {
      title: event.title,
      description: event.description,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      location: event.is_virtual ? (event.external_url || 'Virtual Event') : event.location,
      url: event.external_url,
    };
  }

  // Create recurring events ICS
  static generateRecurringICS(event: CommunityEvent): string {
    if (event.recurring_type === 'none') {
      return this.generateICS(event);
    }

    const startDate = new Date(`${event.event_date}T${event.start_time || '00:00'}:00`);
    const endDate = new Date(`${event.event_date}T${event.end_time || '23:59'}:00`);
    const recurringEndDate = event.recurring_end_date ? new Date(event.recurring_end_date) : null;
    
    const formatICSDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const getRRule = (): string => {
      const freq = event.recurring_type.toUpperCase();
      const until = recurringEndDate ? `;UNTIL=${formatICSDate(recurringEndDate)}` : '';
      return `RRULE:FREQ=${freq}${until}`;
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Community App//Event Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${event.id}@communityapp.com
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
${getRRule()}
SUMMARY:${event.title}
DESCRIPTION:${this.escapeICSText(event.description || '')}
LOCATION:${this.escapeICSText(event.is_virtual ? (event.external_url || 'Virtual Event') : (event.location || ''))}
${event.external_url ? `URL:${event.external_url}` : ''}
CATEGORIES:${event.category?.name || 'General'}
STATUS:CONFIRMED
TRANSP:OPAQUE
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Event reminder
TRIGGER:-PT15M
END:VALARM
END:VEVENT
END:VCALENDAR`;

    return icsContent;
  }

  // Bulk export multiple events
  static generateBulkICS(events: CommunityEvent[]): string {
    const formatICSDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Community App//Event Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH`;

    events.forEach(event => {
      const startDate = new Date(`${event.event_date}T${event.start_time || '00:00'}:00`);
      const endDate = new Date(`${event.event_date}T${event.end_time || '23:59'}:00`);
      
      icsContent += `
BEGIN:VEVENT
UID:${event.id}@communityapp.com
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:${event.title}
DESCRIPTION:${this.escapeICSText(event.description || '')}
LOCATION:${this.escapeICSText(event.is_virtual ? (event.external_url || 'Virtual Event') : (event.location || ''))}
${event.external_url ? `URL:${event.external_url}` : ''}
CATEGORIES:${event.category?.name || 'General'}
STATUS:CONFIRMED
TRANSP:OPAQUE
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Event reminder
TRIGGER:-PT15M
END:VALARM
END:VEVENT`;
    });

    icsContent += `
END:VCALENDAR`;

    return icsContent;
  }

  // Download bulk ICS file
  static downloadBulkICS(events: CommunityEvent[], filename: string = 'community_events'): void {
    const icsContent = this.generateBulkICS(events);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Hook for calendar integration
export const useCalendarIntegration = () => {
  const downloadICS = (event: CommunityEvent) => {
    CalendarIntegration.downloadICS(event);
  };

  const downloadBulkICS = (events: CommunityEvent[], filename?: string) => {
    CalendarIntegration.downloadBulkICS(events, filename);
  };

  const openInGoogleCalendar = (event: CommunityEvent) => {
    const url = CalendarIntegration.generateGoogleCalendarUrl(event);
    window.open(url, '_blank');
  };

  const openInOutlook = (event: CommunityEvent) => {
    const url = CalendarIntegration.generateOutlookUrl(event);
    window.open(url, '_blank');
  };

  const openInYahooCalendar = (event: CommunityEvent) => {
    const url = CalendarIntegration.generateYahooCalendarUrl(event);
    window.open(url, '_blank');
  };

  const getCalendarExportData = (event: CommunityEvent): CalendarExportData => {
    return CalendarIntegration.generateCalendarExportData(event);
  };

  return {
    downloadICS,
    downloadBulkICS,
    openInGoogleCalendar,
    openInOutlook,
    openInYahooCalendar,
    getCalendarExportData,
  };
};