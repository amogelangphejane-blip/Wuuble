import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle, AlertTriangle, Play, RefreshCw } from 'lucide-react';
import { leaderboardDiagnostic, DiagnosticResult } from '@/utils/leaderboardDiagnostic';
import { useAuth } from '@/hooks/useAuth';

interface LeaderboardDebuggerProps {
  communityId: string;
}

export const LeaderboardDebugger: React.FC<LeaderboardDebuggerProps> = ({ communityId }) => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<{ passed: number; failed: number; warnings: number; total: number } | null>(null);
  const { user } = useAuth();

  const runDiagnostic = async () => {
    if (!user?.id) {
      alert('User must be authenticated to run diagnostic');
      return;
    }

    setIsRunning(true);
    try {
      const diagnosticResults = await leaderboardDiagnostic.runDiagnostic(communityId, user.id);
      setResults(diagnosticResults);
      setSummary(leaderboardDiagnostic.getSummary());
    } catch (error) {
      console.error('Error running diagnostic:', error);
      alert(`Diagnostic failed: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'fail':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800';
      case 'fail':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>AI Leaderboard Diagnostic</span>
        </CardTitle>
        <div className="flex items-center space-x-4">
          <Button onClick={runDiagnostic} disabled={isRunning || !user}>
            {isRunning ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isRunning ? 'Running...' : 'Run Diagnostic'}
          </Button>
          
          {summary && (
            <div className="flex space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                ✓ {summary.passed}
              </Badge>
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                ✗ {summary.failed}
              </Badge>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                ⚠ {summary.warnings}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!user && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
            <p className="text-yellow-800">Please log in to run the diagnostic.</p>
          </div>
        )}

        {results.length > 0 && (
          <>
            <ScrollArea className="h-96 mb-4">
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-sm">{result.check}</h4>
                        <Badge variant="secondary" className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{result.message}</p>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer">Show details</summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {leaderboardDiagnostic.getFailedChecks().length > 0 && (
              <Card className="bg-red-50 border-red-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-red-800 text-lg">Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {leaderboardDiagnostic.getRecommendations().map((recommendation, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-red-700 text-sm">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {results.length === 0 && !isRunning && (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Click "Run Diagnostic" to check the AI leaderboard system status.</p>
            <p className="text-sm mt-2">Community ID: {communityId}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Quick usage instructions as a comment component
export const LeaderboardDebugInstructions: React.FC = () => (
  <Card className="mb-4 border-blue-200 bg-blue-50">
    <CardContent className="p-4">
      <h3 className="font-medium text-blue-900 mb-2">Debug Instructions</h3>
      <div className="text-sm text-blue-800 space-y-2">
        <p>1. Add this component temporarily to your leaderboard page:</p>
        <code className="block bg-blue-100 p-2 rounded text-xs">
          {'<LeaderboardDebugger communityId={communityId} />'}
        </code>
        <p>2. Run the diagnostic to identify issues</p>
        <p>3. Follow the recommendations to fix any problems</p>
        <p>4. Remove this component once issues are resolved</p>
      </div>
    </CardContent>
  </Card>
);