import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  X, 
  File, 
  Image, 
  Video, 
  FileText, 
  Music, 
  Archive,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadItem {
  id: string;
  file: File;
  preview?: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  url?: string;
  error?: string;
}

interface EnhancedFileUploadProps {
  onFilesUploaded: (urls: string[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedFileTypes?: string[];
  disabled?: boolean;
  allowMultiple?: boolean;
  showPreview?: boolean;
}

const FILE_TYPE_ICONS: Record<string, React.ReactNode> = {
  'image': <Image className="h-4 w-4" />,
  'video': <Video className="h-4 w-4" />,
  'audio': <Music className="h-4 w-4" />,
  'text': <FileText className="h-4 w-4" />,
  'application': <Archive className="h-4 w-4" />,
  'default': <File className="h-4 w-4" />
};

export const EnhancedFileUpload: React.FC<EnhancedFileUploadProps> = ({
  onFilesUploaded,
  maxFiles = 5,
  maxFileSize = 10, // 10MB
  acceptedFileTypes = ['image/*', 'video/*', 'audio/*', 'text/*', 'application/pdf'],
  disabled = false,
  allowMultiple = true,
  showPreview = true
}) => {
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const getFileType = (mimeType: string) => {
    return mimeType.split('/')[0] || 'default';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const generatePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }

    // Check file type
    const isAccepted = acceptedFileTypes.some(type => {
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });

    if (!isAccepted) {
      return 'File type not supported';
    }

    return null;
  };

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles: FileUploadItem[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i] instanceof File ? fileList[i] : (fileList as FileList)[i];
      
      // Check if we've reached max files
      if (files.length + newFiles.length >= maxFiles) {
        toast({
          title: "File limit reached",
          description: `Maximum ${maxFiles} files allowed`,
          variant: "destructive"
        });
        break;
      }

      const error = validateFile(file);
      const preview = await generatePreview(file);
      
      newFiles.push({
        id: `${Date.now()}-${i}`,
        file,
        preview,
        status: error ? 'error' : 'pending',
        progress: 0,
        error
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length, maxFiles, maxFileSize, acceptedFileTypes, toast]);

  const uploadFile = async (fileItem: FileUploadItem): Promise<string | null> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { file } = fileItem;
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const fileName = `${user.id}/${timestamp}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Update status to uploading
    setFiles(prev => prev.map(f => 
      f.id === fileItem.id 
        ? { ...f, status: 'uploading' as const } 
        : f
    ));

    const { data, error } = await supabase.storage
      .from('community-post-images') // We'll use the same bucket for now
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('community-post-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const handleUploadAll = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    const uploadPromises = pendingFiles.map(async (fileItem) => {
      try {
        const url = await uploadFile(fileItem);
        
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'completed', progress: 100, url } 
            : f
        ));
        
        return url;
      } catch (error) {
        console.error('Upload error:', error);
        
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { 
                ...f, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Upload failed' 
              } 
            : f
        ));
        
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUrls = results.filter((url): url is string => url !== null);
    
    if (successfulUrls.length > 0) {
      onFilesUploaded(successfulUrls);
      toast({
        title: "Upload successful",
        description: `${successfulUrls.length} file(s) uploaded successfully`
      });
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const clearAll = () => {
    setFiles([]);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getUploadStatus = () => {
    const pending = files.filter(f => f.status === 'pending').length;
    const uploading = files.filter(f => f.status === 'uploading').length;
    const completed = files.filter(f => f.status === 'completed').length;
    const errors = files.filter(f => f.status === 'error').length;
    
    return { pending, uploading, completed, errors, total: files.length };
  };

  const status = getUploadStatus();

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={allowMultiple}
        accept={acceptedFileTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Drop zone */}
      <Card 
        className={`border-2 border-dashed transition-all duration-300 cursor-pointer ${
          isDragOver 
            ? 'border-primary bg-primary/5 scale-[1.02]' 
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={!disabled ? openFileDialog : undefined}
      >
        <CardContent className="p-8 text-center">
          <motion.div
            animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className={`p-4 rounded-full ${isDragOver ? 'bg-primary/10' : 'bg-muted/50'}`}>
              <Upload className={`h-8 w-8 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">
                {isDragOver ? 'Drop files here' : 'Upload Files'}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Drag and drop files here, or click to browse
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary">Max {maxFiles} files</Badge>
                <Badge variant="secondary">Up to {maxFileSize}MB each</Badge>
                <Badge variant="secondary">
                  {acceptedFileTypes.includes('image/*') && 'Images'}
                  {acceptedFileTypes.includes('video/*') && ' Videos'}
                  {acceptedFileTypes.includes('audio/*') && ' Audio'}
                </Badge>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      {/* File list */}
      <AnimatePresence mode="popLayout">
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Files ({files.length})</h4>
              <div className="flex gap-2">
                {status.pending > 0 && (
                  <Button
                    onClick={handleUploadAll}
                    disabled={disabled}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload All ({status.pending})
                  </Button>
                )}
                <Button
                  onClick={clearAll}
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="grid gap-3">
              {files.map((fileItem) => (
                <motion.div
                  key={fileItem.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      {/* File preview or icon */}
                      <div className="flex-shrink-0">
                        {showPreview && fileItem.preview ? (
                          <img
                            src={fileItem.preview}
                            alt={fileItem.file.name}
                            className="w-12 h-12 object-cover rounded-lg border"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            {FILE_TYPE_ICONS[getFileType(fileItem.file.type)] || FILE_TYPE_ICONS.default}
                          </div>
                        )}
                      </div>

                      {/* File info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{fileItem.file.name}</p>
                          <Badge 
                            variant={
                              fileItem.status === 'completed' ? 'default' :
                              fileItem.status === 'error' ? 'destructive' :
                              fileItem.status === 'uploading' ? 'secondary' : 'outline'
                            }
                            className="text-xs"
                          >
                            {fileItem.status === 'uploading' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                            {fileItem.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {fileItem.status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {fileItem.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(fileItem.file.size)}
                        </p>
                        
                        {fileItem.status === 'uploading' && (
                          <div className="mt-2 w-full bg-muted rounded-full h-1">
                            <div 
                              className="bg-primary h-1 rounded-full transition-all duration-300" 
                              style={{ width: `${fileItem.progress}%` }}
                            />
                          </div>
                        )}
                        
                        {fileItem.error && (
                          <p className="text-sm text-destructive mt-1">{fileItem.error}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(fileItem.id)}
                        disabled={disabled}
                        className="text-muted-foreground hover:text-destructive p-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Upload summary */}
            {status.total > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-4">
                  {status.completed > 0 && (
                    <span className="text-green-600">✅ {status.completed} completed</span>
                  )}
                  {status.errors > 0 && (
                    <span className="text-red-600">❌ {status.errors} failed</span>
                  )}
                  {status.pending > 0 && (
                    <span>⏳ {status.pending} pending</span>
                  )}
                  {status.uploading > 0 && (
                    <span>📤 {status.uploading} uploading</span>
                  )}
                </div>
                <span>{status.total} total files</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};