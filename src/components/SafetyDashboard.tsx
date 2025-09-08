import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { safetyService } from '@/services/safetyService';
import { rateLimitService } from '@/services/rateLimitService';
import { randomChatService } from '@/services/randomChatService';
import { 
  Shield, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  MessageCircle,
  Users,
  Flag,
  Eye,
  Activity,
  CheckCircle,
  XCircle,
  Info,
  Settings,
  BarChart3
} from 'lucide-react';

interface SafetyDashboardProps {
  onClose?: () => void;
}

export const SafetyDashboard: React.FC<SafetyDashboardProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<any>(null);
  const [riskAssessment, setRiskAssessment] = useState<any>(null);
  const [rateLimits, setRateLimits] = useState<any>({});
  const [safetyTips, setSafetyTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSafetyData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        
        // Load user statistics
        const userStats = await randomChatService.getUserStats(user.id);
        setStats(userStats);
        
        // Get risk assessment
        const risk = safetyService.getUserRiskAssessment(user.id);
        setRiskAssessment(risk);
        
        // Get rate limit status
        const limits = rateLimitService.getUserStatus(user.id);
        setRateLimits(limits);
        
        // Load safety tips
        const tips = safetyService.getSafetyTips();
        setSafetyTips(tips);
        
      } catch (error) {
        console.error('Failed to load safety data:', error);
        toast({
          title: "Failed to load safety data",
          description: "Some safety information may not be available.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSafetyData();
  }, [user?.id, toast]);

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Safety Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Activity className="h-8 w-8 animate-pulse text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Loading safety information...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
          <p className="text-muted-foreground">Please sign in to view your safety dashboard.</p>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return 'bg-red-500';
    if (value >= 60) return 'bg-orange-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Safety Dashboard
            </CardTitle>
            {onClose && (
              <Button variant="ghost" onClick={onClose}>
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Safety Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5" />
              Safety Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {riskAssessment ? Math.max(0, 100 - riskAssessment.riskScore) : 100}/100
                </span>
                <Badge className={getRiskColor(riskAssessment?.riskLevel || 'low')}>
                  {riskAssessment?.riskLevel || 'low'} risk
                </Badge>
              </div>
              
              <Progress 
                value={riskAssessment ? Math.max(0, 100 - riskAssessment.riskScore) : 100} 
                className="h-2"
              />
              
              <p className="text-sm text-muted-foreground">
                Your safety score is based on your chat behavior and community feedback.
              </p>
              
              {riskAssessment?.flags && riskAssessment.flags.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2 text-orange-600">Areas for improvement:</p>
                  <div className="space-y-1">
                    {riskAssessment.flags.map((flag: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {flag.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5" />
              Chat Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Total Sessions</span>
                </div>
                <span className="font-semibold">{stats?.total_sessions || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Total Time</span>
                </div>
                <span className="font-semibold">{stats?.total_minutes || 0} min</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Avg Session</span>
                </div>
                <span className="font-semibold">
                  {stats?.average_session_minutes?.toFixed(1) || 0} min
                </span>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Times Reported</span>
                </div>
                <span className={`font-semibold ${
                  stats?.times_reported > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {stats?.times_reported || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rate Limits Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5" />
              Rate Limits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.keys(rateLimits).length > 0 ? (
                Object.entries(rateLimits).map(([action, data]: [string, any]) => (
                  <div key={action} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm capitalize">
                        {action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {data.count}/{data.limit}
                      </span>
                    </div>
                    <Progress 
                      value={(data.count / data.limit) * 100} 
                      className="h-1"
                    />
                    {data.blocked && (
                      <p className="text-xs text-red-600">
                        Blocked until {new Date(data.blockUntil).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">All limits are within normal range</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Safety Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Safety Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            <div className="space-y-3">
              {safetyTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{tip}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {riskAssessment?.recommendations && riskAssessment.recommendations.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {riskAssessment.recommendations.map((rec: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <Eye className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-orange-700">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};