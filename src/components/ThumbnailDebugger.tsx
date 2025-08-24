import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { thumbnailService } from '@/services/thumbnailService';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Database,
  Image,
  Upload,
  Eye,
  RefreshCw,
  Bug,
  Info
} from 'lucide-react';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'loading';
  message: string;
  details?: string;
}

export const ThumbnailDebugger: React.FC = () => {
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [buckets, setBuckets] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [testFile, setTestFile] = useState<File | null>(null);
  const [testStreamId, setTestStreamId] = useState<string>('');

  const updateDiagnostic = (name: string, status: DiagnosticResult['status'], message: string, details?: string) => {
    setDiagnostics(prev => {
      const existing = prev.find(d => d.name === name);
      const newDiagnostic = { name, status, message, details };
      
      if (existing) {
        return prev.map(d => d.name === name ? newDiagnostic : d);
      } else {
        return [...prev, newDiagnostic];
      }
    });
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDiagnostics([]);

    // Test 1: Database Connection
    updateDiagnostic('database', 'loading', 'Testing database connection...');
    try {
      const { data, error } = await supabase.from('live_streams').select('count').limit(1);
      if (error) throw error;
      updateDiagnostic('database', 'success', 'Database connection successful');
    } catch (error: any) {
      updateDiagnostic('database', 'error', 'Database connection failed', error.message);
    }

    // Test 2: Authentication
    updateDiagnostic('auth', 'loading', 'Checking authentication...');
    if (user) {
      updateDiagnostic('auth', 'success', `Authenticated as ${user.email}`);
    } else {
      updateDiagnostic('auth', 'warning', 'Not authenticated - some tests will be limited');
    }

    // Test 3: Storage Buckets
    updateDiagnostic('buckets', 'loading', 'Checking storage buckets...');
    try {
      const { data: bucketData, error } = await supabase.storage.listBuckets();
      if (error) throw error;
      
      setBuckets(bucketData);
      const expectedBuckets = ['stream-thumbnails', 'stream-images'];
      const existingBuckets = bucketData.map(b => b.name);
      const missingBuckets = expectedBuckets.filter(b => !existingBuckets.includes(b));
      
      if (missingBuckets.length === 0) {
        updateDiagnostic('buckets', 'success', `All required buckets exist (${expectedBuckets.join(', ')})`);
      } else {
        updateDiagnostic('buckets', 'error', `Missing buckets: ${missingBuckets.join(', ')}`, 
          `Found: ${existingBuckets.join(', ')}`);
      }
    } catch (error: any) {
      updateDiagnostic('buckets', 'error', 'Failed to check buckets', error.message);
    }

    // Test 4: Live Streams
    updateDiagnostic('streams', 'loading', 'Loading live streams...');
    try {
      const { data: streamData, error } = await supabase
        .from('live_streams')
        .select('id, title, thumbnail_url, display_image_url, creator_id')
        .limit(10);
      
      if (error) throw error;
      
      setStreams(streamData || []);
      const streamsWithThumbnails = streamData?.filter(s => s.thumbnail_url || s.display_image_url) || [];
      
      updateDiagnostic('streams', 'success', 
        `Found ${streamData?.length || 0} streams, ${streamsWithThumbnails.length} with thumbnails`);
    } catch (error: any) {
      updateDiagnostic('streams', 'error', 'Failed to load streams', error.message);
    }

    // Test 5: Storage Policies
    updateDiagnostic('policies', 'loading', 'Testing storage policies...');
    if (user) {
      try {
        // Try to list objects in the stream-thumbnails bucket
        const { data, error } = await supabase.storage
          .from('stream-thumbnails')
          .list('', { limit: 1 });
        
        if (error) {
          updateDiagnostic('policies', 'error', 'Storage policy test failed', error.message);
        } else {
          updateDiagnostic('policies', 'success', 'Storage policies working correctly');
        }
      } catch (error: any) {
        updateDiagnostic('policies', 'error', 'Storage policy test failed', error.message);
      }
    } else {
      updateDiagnostic('policies', 'warning', 'Cannot test policies without authentication');
    }

    // Test 6: Browser APIs
    updateDiagnostic('browser', 'loading', 'Checking browser APIs...');
    const browserSupport = {
      canvas: !!document.createElement('canvas').getContext,
      fileApi: !!(window.File && window.FileReader && window.FileList && window.Blob),
      objectUrl: !!window.URL?.createObjectURL
    };

    const unsupported = Object.entries(browserSupport).filter(([, supported]) => !supported).map(([api]) => api);
    
    if (unsupported.length === 0) {
      updateDiagnostic('browser', 'success', 'All required browser APIs supported');
    } else {
      updateDiagnostic('browser', 'error', `Unsupported APIs: ${unsupported.join(', ')}`);
    }

    setIsRunning(false);
  };

  const testThumbnailUpload = async () => {
    if (!testFile || !testStreamId || !user) {
      alert('Please select a file, enter a stream ID, and ensure you are logged in');
      return;
    }

    updateDiagnostic('upload', 'loading', 'Testing thumbnail upload...');
    
    try {
      const thumbnailUrl = await thumbnailService.uploadThumbnail(testStreamId, testFile);
      updateDiagnostic('upload', 'success', 'Thumbnail upload successful!', thumbnailUrl);
    } catch (error: any) {
      updateDiagnostic('upload', 'error', 'Thumbnail upload failed', error.message);
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'loading':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bug className="w-5 h-5" />
            <span>Thumbnail System Debugger</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <Button onClick={runDiagnostics} disabled={isRunning}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
              Run Diagnostics
            </Button>
            
            {user ? (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Authenticated
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                <AlertCircle className="w-3 h-3 mr-1" />
                Not Authenticated
              </Badge>
            )}
          </div>

          <Tabs defaultValue="diagnostics" className="space-y-4">
            <TabsList>
              <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
              <TabsTrigger value="buckets">Storage Buckets</TabsTrigger>
              <TabsTrigger value="streams">Streams</TabsTrigger>
              <TabsTrigger value="test">Upload Test</TabsTrigger>
            </TabsList>

            <TabsContent value="diagnostics" className="space-y-4">
              {diagnostics.map((diagnostic) => (
                <Alert key={diagnostic.name} className={
                  diagnostic.status === 'error' ? 'border-red-200 bg-red-50' :
                  diagnostic.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                  diagnostic.status === 'success' ? 'border-green-200 bg-green-50' :
                  'border-blue-200 bg-blue-50'
                }>
                  <div className="flex items-start space-x-2">
                    {getStatusIcon(diagnostic.status)}
                    <div className="flex-1">
                      <AlertDescription>
                        <div className="font-medium">{diagnostic.name.toUpperCase()}</div>
                        <div>{diagnostic.message}</div>
                        {diagnostic.details && (
                          <div className="text-xs mt-1 opacity-75">{diagnostic.details}</div>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </TabsContent>

            <TabsContent value="buckets" className="space-y-4">
              <div className="grid gap-4">
                {buckets.map((bucket) => (
                  <Card key={bucket.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{bucket.name}</h3>
                          <p className="text-sm text-gray-500">
                            Public: {bucket.public ? 'Yes' : 'No'} | 
                            Size Limit: {bucket.file_size_limit ? `${Math.round(bucket.file_size_limit / 1024 / 1024)}MB` : 'None'}
                          </p>
                        </div>
                        <Badge variant={bucket.name.includes('thumbnail') ? 'default' : 'secondary'}>
                          {bucket.name.includes('thumbnail') ? 'Thumbnail' : 'Other'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="streams" className="space-y-4">
              <div className="grid gap-4">
                {streams.map((stream) => (
                  <Card key={stream.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{stream.title}</h3>
                          <p className="text-sm text-gray-500 mb-2">ID: {stream.id}</p>
                          
                          <div className="space-y-1 text-xs">
                            {stream.thumbnail_url && (
                              <div className="flex items-center space-x-1">
                                <Image className="w-3 h-3" />
                                <span>Thumbnail: {stream.thumbnail_url.substring(0, 50)}...</span>
                              </div>
                            )}
                            {stream.display_image_url && (
                              <div className="flex items-center space-x-1">
                                <Eye className="w-3 h-3" />
                                <span>Display: {stream.display_image_url.substring(0, 50)}...</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-1">
                          {stream.thumbnail_url && (
                            <Badge variant="outline" className="text-xs">Has Thumbnail</Badge>
                          )}
                          {stream.display_image_url && (
                            <Badge variant="outline" className="text-xs">Has Display</Badge>
                          )}
                          {user?.id === stream.creator_id && (
                            <Badge className="text-xs">Your Stream</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="test" className="space-y-4">
              {user ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Test Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setTestFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Stream ID</label>
                    <select
                      value={testStreamId}
                      onChange={(e) => setTestStreamId(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a stream...</option>
                      {streams.filter(s => s.creator_id === user.id).map((stream) => (
                        <option key={stream.id} value={stream.id}>
                          {stream.title} ({stream.id})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <Button 
                    onClick={testThumbnailUpload}
                    disabled={!testFile || !testStreamId}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Test Upload
                  </Button>
                </div>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Please log in to test thumbnail uploads
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};