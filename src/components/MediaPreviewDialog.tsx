import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  Send, 
  Download, 
  Image as ImageIcon, 
  FileText, 
  Film,
  Music,
  Archive,
  File
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  files: File[];
  onSend: (files: File[], caption?: string) => void;
  onRemoveFile: (index: number) => void;
}

export const MediaPreviewDialog: React.FC<MediaPreviewDialogProps> = ({
  isOpen,
  onClose,
  files,
  onSend,
  onRemoveFile,
}) => {
  const [caption, setCaption] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (file.type.startsWith('video/')) return <Film className="h-4 w-4" />;
    if (file.type.startsWith('audio/')) return <Music className="h-4 w-4" />;
    if (file.type.includes('pdf') || file.type.includes('document')) return <FileText className="h-4 w-4" />;
    if (file.type.includes('zip') || file.type.includes('rar')) return <Archive className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getFileColor = (file: File) => {
    if (file.type.startsWith('image/')) return 'text-blue-500';
    if (file.type.startsWith('video/')) return 'text-purple-500';
    if (file.type.startsWith('audio/')) return 'text-orange-500';
    if (file.type.includes('pdf')) return 'text-red-500';
    if (file.type.includes('document')) return 'text-blue-600';
    if (file.type.includes('zip') || file.type.includes('rar')) return 'text-yellow-600';
    return 'text-gray-500';
  };

  const handleSend = () => {
    onSend(files, caption || undefined);
    setCaption('');
    onClose();
  };

  const handleClose = () => {
    setCaption('');
    setSelectedIndex(0);
    onClose();
  };

  if (files.length === 0) return null;

  const selectedFile = files[selectedIndex];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <span>Preview Media ({files.length} file{files.length > 1 ? 's' : ''})</span>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* File list sidebar */}
          {files.length > 1 && (
            <div className="w-64 border-r bg-gray-50 dark:bg-gray-900">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                        "hover:bg-gray-100 dark:hover:bg-gray-800",
                        selectedIndex === index && "bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-800"
                      )}
                      onClick={() => setSelectedIndex(index)}
                    >
                      <div className={cn("flex-shrink-0", getFileColor(file))}>
                        {getFileIcon(file)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveFile(index);
                          if (selectedIndex >= index && selectedIndex > 0) {
                            setSelectedIndex(selectedIndex - 1);
                          }
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Main preview area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex items-center justify-center p-6 bg-gray-100 dark:bg-gray-900">
              {selectedFile.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt={selectedFile.name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              ) : selectedFile.type.startsWith('video/') ? (
                <video
                  controls
                  className="max-w-full max-h-full rounded-lg shadow-lg"
                  preload="metadata"
                >
                  <source src={URL.createObjectURL(selectedFile)} type={selectedFile.type} />
                  Your browser does not support the video tag.
                </video>
              ) : selectedFile.type.startsWith('audio/') ? (
                <div className="flex flex-col items-center gap-4 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                  <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                    <Music className="h-8 w-8 text-orange-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <audio controls className="w-full max-w-md">
                    <source src={URL.createObjectURL(selectedFile)} type={selectedFile.type} />
                    Your browser does not support the audio tag.
                  </audio>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg min-w-[300px]">
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center",
                    selectedFile.type.includes('pdf') ? 'bg-red-100 dark:bg-red-900/20' :
                    selectedFile.type.includes('document') ? 'bg-blue-100 dark:bg-blue-900/20' :
                    'bg-gray-100 dark:bg-gray-700'
                  )}>
                    <div className={getFileColor(selectedFile)}>
                      {getFileIcon(selectedFile)}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-medium break-all">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    <p className="text-xs text-gray-400 mt-1">{selectedFile.type || 'Unknown type'}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => {
                      const url = URL.createObjectURL(selectedFile);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = selectedFile.name;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Preview
                  </Button>
                </div>
              )}
            </div>

            {/* Caption input */}
            <div className="p-4 border-t bg-white dark:bg-gray-800">
              <div className="flex gap-3 items-end">
                <Input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button 
                  onClick={handleSend}
                  className="bg-[#25d366] hover:bg-[#20c55e] text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
              {files.length === 1 && (
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>{selectedFile.name}</span>
                  <span>{formatFileSize(selectedFile.size)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};