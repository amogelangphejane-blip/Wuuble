import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StreamImageUpload } from './StreamImageUpload';
import { thumbnailService } from '@/services/thumbnailService';
import { LiveStream } from '@/services/livestreamService';
import { supabase } from '@/integrations/supabase/client';
import {
  Settings,
  Image as ImageIcon,
  Save,
  AlertCircle,
  Eye,
  Users,
  MessageCircle,
  Heart,
  Edit,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StreamManagementProps {
  stream: LiveStream;
  onStreamUpdated?: (stream: LiveStream) => void;
  className?: string;
}

export const StreamManagement: React.FC<StreamManagementProps> = ({
  stream,
  onStreamUpdated,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentThumbnail, setCurrentThumbnail] = useState<string | null>(stream.thumbnail_url || null);
  const [formData, setFormData] = useState({
    title: stream.title,
    description: stream.description || '',
  });

  // Update current thumbnail when stream prop changes
  useEffect(() => {
    setCurrentThumbnail(stream.thumbnail_url || null);
  }, [stream.thumbnail_url]);

  const handleImageUploaded = async (thumbnailUrl: string) => {
    setCurrentThumbnail(thumbnailUrl);
    
    setSuccess('Thumbnail updated successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleImageRemoved = async () => {
    try {
      await thumbnailService.deleteThumbnail(stream.id);
      setCurrentThumbnail(null);
      
      setSuccess('Thumbnail removed successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to remove thumbnail');
    }
  };

  const updateStreamInfo = async (updates: Partial<LiveStream>) => {
    setIsUpdating(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('live_streams')
        .update(updates)
        .eq('id', stream.id)
        .select()
        .single();

      if (error) throw error;

      if (data && onStreamUpdated) {
        onStreamUpdated(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update stream');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveBasicInfo = async () => {
    if (!formData.title.trim()) {
      setError('Stream title is required');
      return;
    }

    await updateStreamInfo({
      title: formData.title,
      description: formData.description
    });

    if (!error) {
      setSuccess('Stream information updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    }
  };



  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Settings className="w-4 h-4 mr-2" />
          Manage Stream
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Stream Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stream Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Stream Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stream.viewer_count}</div>
                  <div className="text-sm text-gray-500">Current Viewers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stream.peak_viewers}</div>
                  <div className="text-sm text-gray-500">Peak Viewers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stream.total_messages}</div>
                  <div className="text-sm text-gray-500">Messages</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600">{stream.total_reactions}</div>
                  <div className="text-sm text-gray-500">Reactions</div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Status:</span>
                  <Badge 
                    className={
                      stream.status === 'live' ? 'bg-red-500' :
                      stream.status === 'scheduled' ? 'bg-blue-500' :
                      'bg-gray-500'
                    }
                  >
                    {stream.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="font-medium">Created:</span>
                  <span>{formatDistanceToNow(new Date(stream.created_at), { addSuffix: true })}</span>
                </div>
                {stream.actual_start_time && (
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="font-medium">Started:</span>
                    <span>{formatDistanceToNow(new Date(stream.actual_start_time), { addSuffix: true })}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Edit className="w-5 h-5 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Stream Title</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter stream title"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your stream..."
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleSaveBasicInfo}
                disabled={isUpdating || !formData.title.trim()}
                className="w-full"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Thumbnail Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                Stream Thumbnail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                This thumbnail will be shown to viewers on the discover page and stream previews.
              </p>
              
              <StreamImageUpload
                streamId={stream.id}
                currentImage={currentThumbnail}
                onImageUploaded={handleImageUploaded}
                onImageRemoved={handleImageRemoved}
                showPreview={true}
                maxSizeMB={2}
              />
            </CardContent>
          </Card>

          {/* Status Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};