import { useState } from 'react';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Image as ImageIcon,
  Mail,
  Calendar,
  Users,
  BarChart3,
  QrCode,
  Share2,
  Settings,
  Check,
  X,
  Filter,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { CommunityEvent, EventRSVP } from '@/types/events';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CheckInRecord {
  id: string;
  user_id: string;
  checked_in_at: string;
  check_in_method: 'qr_code' | 'manual' | 'self_checkin';
  user_profile: {
    display_name: string;
    email?: string;
    avatar_url?: string;
  };
}

interface ExportTemplate {
  id: string;
  name: string;
  format: ExportFormat;
  fields: ExportField[];
  filters: ExportFilters;
  is_default: boolean;
}

type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json' | 'txt' | 'html';

interface ExportField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'date' | 'boolean' | 'number' | 'url';
  required: boolean;
  enabled: boolean;
}

interface ExportFilters {
  rsvpStatus?: ('going' | 'maybe' | 'not_going' | 'waitlist')[];
  checkedInOnly?: boolean;
  dateRange?: { start: Date; end: Date };
  includeProfile?: boolean;
  includeEventDetails?: boolean;
}

interface EventDataExporterProps {
  event: CommunityEvent;
  attendees: (EventRSVP & { user_profile: { display_name: string; email?: string; avatar_url?: string } })[];
  checkIns: CheckInRecord[];
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat, data: any[], filename: string) => Promise<boolean>;
  className?: string;
}

export const EventDataExporter = ({
  event,
  attendees,
  checkIns,
  isOpen,
  onClose,
  onExport,
  className
}: EventDataExporterProps) => {
  const { toast } = useToast();
  const [exportType, setExportType] = useState<'attendees' | 'checkins' | 'analytics' | 'custom'>('attendees');
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Export configuration
  const [exportConfig, setExportConfig] = useState({
    includeHeaders: true,
    includeEventInfo: true,
    rsvpStatusFilter: [] as string[],
    checkedInOnly: false,
    customFields: [] as string[],
    fileName: '',
    emailList: false,
    nameList: false,
    groupByStatus: false,
  });

  // Available export fields
  const availableFields: ExportField[] = [
    { id: 'display_name', label: 'Name', type: 'text', required: true, enabled: true },
    { id: 'email', label: 'Email', type: 'email', required: false, enabled: true },
    { id: 'rsvp_status', label: 'RSVP Status', type: 'text', required: false, enabled: true },
    { id: 'rsvp_date', label: 'RSVP Date', type: 'date', required: false, enabled: true },
    { id: 'response_note', label: 'RSVP Note', type: 'text', required: false, enabled: false },
    { id: 'checked_in', label: 'Checked In', type: 'boolean', required: false, enabled: true },
    { id: 'check_in_time', label: 'Check-in Time', type: 'date', required: false, enabled: false },
    { id: 'check_in_method', label: 'Check-in Method', type: 'text', required: false, enabled: false },
    { id: 'avatar_url', label: 'Profile Picture URL', type: 'url', required: false, enabled: false },
  ];

  const [selectedFields, setSelectedFields] = useState<string[]>(
    availableFields.filter(f => f.enabled).map(f => f.id)
  );

  const getDefaultFileName = (): string => {
    const eventName = event.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const timestamp = format(new Date(), 'yyyy-MM-dd');
    return `${eventName}_${exportType}_${timestamp}`;
  };

  const generateExportData = () => {
    let data: any[] = [];

    switch (exportType) {
      case 'attendees':
        data = attendees
          .filter(attendee => {
            if (exportConfig.rsvpStatusFilter.length > 0 && !exportConfig.rsvpStatusFilter.includes(attendee.status)) {
              return false;
            }
            if (exportConfig.checkedInOnly && !checkIns.some(c => c.user_id === attendee.user_id)) {
              return false;
            }
            return true;
          })
          .map(attendee => {
            const checkIn = checkIns.find(c => c.user_id === attendee.user_id);
            const row: any = {};

            selectedFields.forEach(fieldId => {
              switch (fieldId) {
                case 'display_name':
                  row['Name'] = attendee.user_profile.display_name;
                  break;
                case 'email':
                  row['Email'] = attendee.user_profile.email || '';
                  break;
                case 'rsvp_status':
                  row['RSVP Status'] = attendee.status.replace('_', ' ').toUpperCase();
                  break;
                case 'rsvp_date':
                  row['RSVP Date'] = format(new Date(attendee.created_at), 'yyyy-MM-dd HH:mm');
                  break;
                case 'response_note':
                  row['RSVP Note'] = attendee.response_note || '';
                  break;
                case 'checked_in':
                  row['Checked In'] = checkIn ? 'Yes' : 'No';
                  break;
                case 'check_in_time':
                  row['Check-in Time'] = checkIn ? format(new Date(checkIn.checked_in_at), 'yyyy-MM-dd HH:mm') : '';
                  break;
                case 'check_in_method':
                  row['Check-in Method'] = checkIn ? checkIn.check_in_method.replace('_', ' ') : '';
                  break;
                case 'avatar_url':
                  row['Profile Picture'] = attendee.user_profile.avatar_url || '';
                  break;
              }
            });

            return row;
          });
        break;

      case 'checkins':
        data = checkIns.map(checkIn => ({
          'Name': checkIn.user_profile.display_name,
          'Email': checkIn.user_profile.email || '',
          'Check-in Time': format(new Date(checkIn.checked_in_at), 'yyyy-MM-dd HH:mm'),
          'Check-in Method': checkIn.check_in_method.replace('_', ' '),
        }));
        break;

      case 'analytics':
        const totalRSVPs = attendees.length;
        const goingCount = attendees.filter(a => a.status === 'going').length;
        const maybeCount = attendees.filter(a => a.status === 'maybe').length;
        const notGoingCount = attendees.filter(a => a.status === 'not_going').length;
        const waitlistCount = attendees.filter(a => a.status === 'waitlist').length;
        const checkedInCount = checkIns.length;

        data = [
          { 'Metric': 'Total RSVPs', 'Value': totalRSVPs },
          { 'Metric': 'Going', 'Value': goingCount },
          { 'Metric': 'Maybe', 'Value': maybeCount },
          { 'Metric': 'Not Going', 'Value': notGoingCount },
          { 'Metric': 'Waitlist', 'Value': waitlistCount },
          { 'Metric': 'Checked In', 'Value': checkedInCount },
          { 'Metric': 'Check-in Rate', 'Value': `${goingCount > 0 ? Math.round((checkedInCount / goingCount) * 100) : 0}%` },
        ];
        break;

      case 'custom':
        // Custom export logic would go here
        data = [];
        break;
    }

    // Add event information if requested
    if (exportConfig.includeEventInfo && exportType !== 'analytics') {
      const eventInfo = {
        'Event': event.title,
        'Date': format(new Date(event.event_date), 'yyyy-MM-dd'),
        'Time': event.start_time || 'TBD',
        'Location': event.is_virtual ? 'Virtual' : (event.location || 'TBD'),
        'Max Attendees': event.max_attendees || 'Unlimited',
        'Export Date': format(new Date(), 'yyyy-MM-dd HH:mm'),
        '---': '---', // Separator
      };
      
      data.unshift(eventInfo);
    }

    return data;
  };

  const handleExport = async () => {
    if (!exportConfig.fileName.trim()) {
      setExportConfig(prev => ({ ...prev, fileName: getDefaultFileName() }));
    }

    try {
      setIsExporting(true);
      setExportProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 20, 90));
      }, 200);

      const data = generateExportData();
      const fileName = exportConfig.fileName || getDefaultFileName();

      const success = await onExport(format, data, fileName);
      
      clearInterval(progressInterval);
      setExportProgress(100);

      if (success) {
        setTimeout(() => {
          setIsExporting(false);
          setExportProgress(0);
          onClose();
          toast({
            title: "Export Successful",
            description: `Data exported as ${format.toUpperCase()} file`,
          });
        }, 500);
      } else {
        setIsExporting(false);
        setExportProgress(0);
      }
    } catch (error) {
      setIsExporting(false);
      setExportProgress(0);
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting data",
        variant: "destructive",
      });
    }
  };

  const getExportTypeIcon = (type: string) => {
    switch (type) {
      case 'attendees': return <Users className="h-4 w-4" />;
      case 'checkins': return <QrCode className="h-4 w-4" />;
      case 'analytics': return <BarChart3 className="h-4 w-4" />;
      case 'custom': return <Settings className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getFormatIcon = (fmt: ExportFormat) => {
    switch (fmt) {
      case 'csv':
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'json':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const previewData = generateExportData().slice(0, 5);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Event Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">What would you like to export?</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'attendees', label: 'Attendee List', count: attendees.length },
                { value: 'checkins', label: 'Check-ins', count: checkIns.length },
                { value: 'analytics', label: 'Event Analytics', count: null },
                { value: 'custom', label: 'Custom Export', count: null },
              ].map((type) => (
                <Card
                  key={type.value}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-gray-50",
                    exportType === type.value && "ring-2 ring-blue-500 bg-blue-50"
                  )}
                  onClick={() => setExportType(type.value as any)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      {getExportTypeIcon(type.value)}
                      <span className="text-sm font-medium">{type.label}</span>
                      {type.count !== null && (
                        <Badge variant="outline" className="text-xs">
                          {type.count} items
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Export Format</Label>
            <div className="flex flex-wrap gap-2">
              {(['csv', 'excel', 'pdf', 'json', 'txt'] as ExportFormat[]).map((fmt) => (
                <Button
                  key={fmt}
                  variant={format === fmt ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormat(fmt)}
                  className="flex items-center gap-2"
                >
                  {getFormatIcon(fmt)}
                  {fmt.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Configuration Options */}
          <Tabs defaultValue="fields" className="w-full">
            <TabsList>
              <TabsTrigger value="fields">Fields</TabsTrigger>
              <TabsTrigger value="filters">Filters</TabsTrigger>
              <TabsTrigger value="options">Options</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="fields" className="space-y-4">
              <div className="space-y-3">
                <Label>Select Fields to Export</Label>
                <div className="space-y-2">
                  {availableFields.map((field) => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedFields.includes(field.id)}
                        disabled={field.required}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedFields([...selectedFields, field.id]);
                          } else {
                            setSelectedFields(selectedFields.filter(id => id !== field.id));
                          }
                        }}
                      />
                      <Label className="flex-1">{field.label}</Label>
                      <Badge variant="outline" className="text-xs">
                        {field.type}
                      </Badge>
                      {field.required && (
                        <Badge variant="default" className="text-xs">Required</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="filters" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>RSVP Status Filter</Label>
                  <div className="flex flex-wrap gap-2">
                    {['going', 'maybe', 'not_going', 'waitlist'].map((status) => (
                      <Badge
                        key={status}
                        variant={exportConfig.rsvpStatusFilter.includes(status) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const currentFilters = exportConfig.rsvpStatusFilter;
                          if (currentFilters.includes(status)) {
                            setExportConfig(prev => ({
                              ...prev,
                              rsvpStatusFilter: currentFilters.filter(s => s !== status)
                            }));
                          } else {
                            setExportConfig(prev => ({
                              ...prev,
                              rsvpStatusFilter: [...currentFilters, status]
                            }));
                          }
                        }}
                      >
                        {status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={exportConfig.checkedInOnly}
                    onCheckedChange={(checked) => setExportConfig(prev => ({ ...prev, checkedInOnly: checked }))}
                  />
                  <Label>Only include checked-in attendees</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="options" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="filename">File Name</Label>
                  <Input
                    id="filename"
                    placeholder={getDefaultFileName()}
                    value={exportConfig.fileName}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, fileName: e.target.value }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={exportConfig.includeHeaders}
                    onCheckedChange={(checked) => setExportConfig(prev => ({ ...prev, includeHeaders: checked }))}
                  />
                  <Label>Include column headers</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={exportConfig.includeEventInfo}
                    onCheckedChange={(checked) => setExportConfig(prev => ({ ...prev, includeEventInfo: checked }))}
                  />
                  <Label>Include event information</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={exportConfig.groupByStatus}
                    onCheckedChange={(checked) => setExportConfig(prev => ({ ...prev, groupByStatus: checked }))}
                  />
                  <Label>Group by RSVP status</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold">Data Preview</Label>
                  <Badge variant="outline">
                    {generateExportData().length} total rows
                  </Badge>
                </div>
                
                {previewData.length > 0 ? (
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          {Object.keys(previewData[0]).map((header) => (
                            <th key={header} className="px-3 py-2 text-left font-medium text-gray-700">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, index) => (
                          <tr key={index} className="border-b">
                            {Object.values(row).map((value: any, cellIndex) => (
                              <td key={cellIndex} className="px-3 py-2 text-gray-900">
                                {value?.toString() || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No data available for export with current filters
                  </div>
                )}
                
                {generateExportData().length > 5 && (
                  <p className="text-sm text-gray-600 text-center">
                    Showing first 5 rows of {generateExportData().length} total rows
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Export Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Exporting data...</span>
                <span>{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="h-2" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose} disabled={isExporting}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={isExporting || generateExportData().length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Exporting...' : `Export ${format.toUpperCase()}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};