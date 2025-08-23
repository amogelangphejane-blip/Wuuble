import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { thumbnailService } from '@/services/thumbnailService';
import {
  Upload,
  Image as ImageIcon,
  X,
  Loader2,
  AlertCircle,
  Check,
  Trash2
} from 'lucide-react';

interface StreamImageUploadProps {
  streamId?: string;
  currentImage?: string;
  onImageUploaded?: (imageUrl: string) => void;
  onImageRemoved?: () => void;
  disabled?: boolean;
  className?: string;
  showPreview?: boolean;
  maxSizeMB?: number;
}

export const StreamImageUpload: React.FC<StreamImageUploadProps> = ({
  streamId,
  currentImage,
  onImageUploaded,
  onImageRemoved,
  disabled = false,
  className = '',
  showPreview = true,
  maxSizeMB = 5
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    // Show preview
    if (showPreview) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    // Upload file if streamId is provided
    if (streamId) {
      uploadImage(file);
    } else {
      // Just show preview for now
      setError(null);
    }
  };

  const uploadImage = async (file: File) => {
    if (!streamId) {
      setError('Stream ID is required for upload');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const thumbnailUrl = await thumbnailService.uploadThumbnail(streamId, file, {
        maxSizeBytes: maxSizeMB * 1024 * 1024
      });

      onImageUploaded?.(thumbnailUrl);
      setPreviewUrl(null);
    } catch (err: any) {
      setError(err.message || 'Failed to upload thumbnail');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const openFileDialog = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const removeCurrentImage = () => {
    if (disabled) return;
    
    setPreviewUrl(null);
    setError(null);
    onImageRemoved?.();
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasImage = currentImage || previewUrl;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card className="relative">
        <CardContent className="p-6">
          {hasImage ? (
            // Image Preview
            <div className="relative">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={previewUrl || currentImage}
                  alt="Stream thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Image Actions */}
              <div className="absolute top-2 right-2 flex space-x-2">
                {!disabled && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={openFileDialog}
                      className="bg-white/90 hover:bg-white"
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Change
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={removeCurrentImage}
                      className="bg-red-500/90 hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>

              {/* Upload Status */}
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                  <div className="bg-white rounded-lg p-4 flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">Uploading...</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Upload Drop Zone
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${dragActive 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-300 hover:border-gray-400'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={openFileDialog}
            >
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Add Stream Thumbnail
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Upload a custom thumbnail that viewers will see on the discover page
                  </p>
                  
                  <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
                    <Badge variant="secondary">JPG, PNG, WEBP</Badge>
                    <Badge variant="secondary">Max {maxSizeMB}MB</Badge>
                    <Badge variant="secondary">Recommended: 16:9 ratio</Badge>
                  </div>
                </div>

                {!isUploading && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      openFileDialog();
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tips */}
      {!hasImage && (
        <div className="text-sm text-gray-500 space-y-1">
          <p>💡 <strong>Tips for great thumbnails:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Use high-quality images with good lighting</li>
            <li>Keep important content in the center (safe area)</li>
            <li>Avoid text that might be hard to read when scaled</li>
            <li>Consider how it looks as a thumbnail</li>
          </ul>
        </div>
      )}
    </div>
  );
};