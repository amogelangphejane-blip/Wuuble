import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Flag,
  Eye,
  Check,
  X,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  MessageSquare,
  Shield,
  Trash2,
  FileText,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { validateAvatarUrl } from '@/lib/utils';

interface ResourceReport {
  id: string;
  reason: 'spam' | 'inappropriate' | 'outdated' | 'broken_link' | 'copyright' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at?: string;
  moderator_notes?: string;
  reporter: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  resource: {
    id: string;
    title: string;
    description: string;
    content_url?: string;
    resource_type: string;
    user_id: string;
    profiles: {
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  };
}

interface ResourceModerationPanelProps {
  communityId: string;
  isOpen: boolean;
  onClose: () => void;
}

const reasonLabels = {
  spam: 'Spam',
  inappropriate: 'Inappropriate content',
  outdated: 'Outdated information',
  broken_link: 'Broken link',
  copyright: 'Copyright violation',
  other: 'Other'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-800'
};

export const ResourceModerationPanel = ({ 
  communityId, 
  isOpen, 
  onClose 
}: ResourceModerationPanelProps) => {
  const [reports, setReports] = useState<ResourceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ResourceReport | null>(null);
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && communityId) {
      fetchReports();
    }
  }, [isOpen, communityId]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      const { data: reportsData, error } = await supabase
        .from('resource_reports')
        .select(`
          *,
          reporter:reporter_id(display_name, avatar_url),
          resource:community_resources(
            id,
            title,
            description,
            content_url,
            resource_type,
            user_id,
            profiles:user_id(display_name, avatar_url)
          )
        `)
        .eq('resource.community_id', communityId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReports(reportsData || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (
    reportId: string, 
    action: 'resolve' | 'dismiss',
    deleteResource = false
  ) => {
    if (!user) return;

    setProcessing(true);
    try {
      // Update report status
      const { error: reportError } = await supabase
        .from('resource_reports')
        .update({
          status: action === 'resolve' ? 'resolved' : 'dismissed',
          moderator_id: user.id,
          moderator_notes: moderatorNotes.trim() || null,
          resolved_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (reportError) throw reportError;

      // If resolving and deleting the resource
      if (action === 'resolve' && deleteResource && selectedReport) {
        const { error: deleteError } = await supabase
          .from('community_resources')
          .delete()
          .eq('id', selectedReport.resource.id);

        if (deleteError) throw deleteError;
      }

      // If resolving and flagging the resource (but not deleting)
      if (action === 'resolve' && !deleteResource && selectedReport) {
        const { error: flagError } = await supabase
          .from('community_resources')
          .update({
            is_flagged: true,
            flag_reason: selectedReport.reason
          })
          .eq('id', selectedReport.resource.id);

        if (flagError) throw flagError;
      }

      toast({
        title: "Success!",
        description: `Report ${action}d successfully${deleteResource ? ' and resource removed' : ''}`
      });

      setSelectedReport(null);
      setModeratorNotes('');
      fetchReports();

    } catch (error: any) {
      console.error('Error processing report:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process report",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'reviewed': return <Eye className="w-4 h-4" />;
      case 'resolved': return <Check className="w-4 h-4" />;
      case 'dismissed': return <X className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const pendingReports = reports.filter(r => r.status === 'pending');
  const processedReports = reports.filter(r => r.status !== 'pending');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Resource Moderation
          </DialogTitle>
          <DialogDescription>
            Review and manage reported resources in your community
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending Reports */}
            {pendingReports.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Pending Reports</h3>
                  <Badge variant="destructive">{pendingReports.length}</Badge>
                </div>
                
                <div className="grid gap-4">
                  {pendingReports.map((report) => (
                    <Card key={report.id} className="border-yellow-200 bg-yellow-50">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                              <Flag className="w-4 h-4 text-yellow-600" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-base line-clamp-1">
                                {report.resource.title}
                              </CardTitle>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {reasonLabels[report.reason]}
                                </Badge>
                                <span>•</span>
                                <span>{formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedReport(report)}
                          >
                            Review
                          </Button>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              Reported by {report.reporter?.display_name || 'Anonymous'}
                            </span>
                          </div>
                          
                          {report.description && (
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                              <p className="text-sm text-muted-foreground">
                                {report.description}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              Resource by {report.resource.profiles?.display_name || 'Anonymous'}
                            </span>
                            {report.resource.content_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(report.resource.content_url, '_blank')}
                                className="h-6 px-2"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Processed Reports */}
            {processedReports.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                
                <div className="grid gap-4">
                  {processedReports.slice(0, 5).map((report) => (
                    <Card key={report.id} className="opacity-75">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center gap-1">
                              {getStatusIcon(report.status)}
                              <Badge 
                                variant="outline" 
                                className={statusColors[report.status]}
                              >
                                {report.status}
                              </Badge>
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-base line-clamp-1">
                                {report.resource.title}
                              </CardTitle>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <span>{reasonLabels[report.reason]}</span>
                                <span>•</span>
                                <span>
                                  {report.resolved_at 
                                    ? formatDistanceToNow(new Date(report.resolved_at), { addSuffix: true })
                                    : formatDistanceToNow(new Date(report.created_at), { addSuffix: true })
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {reports.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No reports to review</h3>
                  <p className="text-muted-foreground">
                    Your community resources are looking good! Reports will appear here when users flag content.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Report Detail Modal */}
        {selectedReport && (
          <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Review Report</DialogTitle>
                <DialogDescription>
                  Take action on this reported resource
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Resource Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{selectedReport.resource.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {selectedReport.resource.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage 
                            src={validateAvatarUrl(selectedReport.resource.profiles?.avatar_url)} 
                          />
                          <AvatarFallback className="text-xs">
                            {(selectedReport.resource.profiles?.display_name || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {selectedReport.resource.profiles?.display_name || 'Anonymous'}
                        </span>
                      </div>
                      {selectedReport.resource.content_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(selectedReport.resource.content_url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Resource
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Report Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Report Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{reasonLabels[selectedReport.reason]}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(selectedReport.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage 
                          src={validateAvatarUrl(selectedReport.reporter?.avatar_url)} 
                        />
                        <AvatarFallback className="text-xs">
                          {(selectedReport.reporter?.display_name || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        Reported by {selectedReport.reporter?.display_name || 'Anonymous'}
                      </span>
                    </div>

                    {selectedReport.description && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">{selectedReport.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Moderator Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Moderator Notes (Optional)</label>
                  <textarea
                    value={moderatorNotes}
                    onChange={(e) => setModeratorNotes(e.target.value)}
                    placeholder="Add any notes about your decision..."
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px] resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {moderatorNotes.length}/500
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleReportAction(selectedReport.id, 'resolve', true)}
                    disabled={processing}
                    variant="destructive"
                    className="flex-1"
                  >
                    {processing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Remove Resource
                  </Button>
                  
                  <Button
                    onClick={() => handleReportAction(selectedReport.id, 'resolve', false)}
                    disabled={processing}
                    variant="outline"
                    className="flex-1"
                  >
                    {processing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    ) : (
                      <Flag className="w-4 h-4 mr-2" />
                    )}
                    Flag Only
                  </Button>
                  
                  <Button
                    onClick={() => handleReportAction(selectedReport.id, 'dismiss')}
                    disabled={processing}
                    variant="secondary"
                    className="flex-1"
                  >
                    {processing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    ) : (
                      <X className="w-4 h-4 mr-2" />
                    )}
                    Dismiss
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};