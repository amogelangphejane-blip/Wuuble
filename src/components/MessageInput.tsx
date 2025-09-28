import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Image, 
  Mic, 
  X,
  Plus,
  Camera,
  Video,
  MapPin,
  FileText,
  Music,
  Calendar,
  Clock,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useMessageInput } from '@/hooks/useMessages';
import { MediaPreviewDialog } from './MediaPreviewDialog';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  replyingTo?: {
    id: string;
    content: string;
    sender: string;
  } | null;
  onCancelReply?: () => void;
}

const EMOJI_CATEGORIES = {
  recent: ['😊', '😂', '❤️', '👍', '😢', '😮', '😡', '🙄'],
  smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪'],
  gestures: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
};

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled = false,
  placeholder = "Type a message...",
  replyingTo = null,
  onCancelReply,
}) => {
  const {
    content,
    handleSend,
    handleKeyPress,
    handleContentChange,
    canSend,
  } = useMessageInput(onSend);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [content]);

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      handleContentChange(newContent);
      
      // Restore cursor position after emoji insertion
      setTimeout(() => {
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
        textarea.focus();
      }, 0);
    }
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      setShowMediaPreview(true);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendWithAttachments = () => {
    if (selectedFiles.length > 0) {
      // TODO: Handle file uploads
      console.log('Files to upload:', selectedFiles);
    }
    handleSend();
    setSelectedFiles([]);
  };

  const handleMediaSend = (files: File[], caption?: string) => {
    // TODO: Handle media upload with caption
    console.log('Sending media:', files, 'with caption:', caption);
    if (caption) {
      onSend(caption);
    }
    setSelectedFiles([]);
    setShowMediaPreview(false);
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    // TODO: Implement voice recording
    console.log('Start recording');
  };

  const stopRecording = () => {
    setIsRecording(false);
    setRecordingTime(0);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    // TODO: Stop recording and send voice message
    console.log('Stop recording');
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleImageSelect = () => {
    imageInputRef.current?.click();
    setShowAttachmentMenu(false);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
    setShowAttachmentMenu(false);
  };

  const handleLocationShare = () => {
    // TODO: Implement location sharing
    console.log('Share location');
    setShowAttachmentMenu(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-[#f0f2f5] dark:bg-[#202c33]">
      {/* Reply preview */}
      {replyingTo && (
        <div className="px-4 py-3 border-b bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1 h-12 bg-blue-500 rounded"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Replying to {replyingTo.sender}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                  {replyingTo.content}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelReply}
              className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* File attachments preview */}
      {selectedFiles.length > 0 && (
        <div className="px-4 py-2 border-b bg-muted/20">
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 text-sm border shadow-sm"
              >
                <div className="flex items-center gap-2">
                  {file.type.startsWith('image/') ? (
                    <Image className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Paperclip className="h-4 w-4 text-gray-500" />
                  )}
                  <div>
                    <p className="font-medium truncate max-w-32">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end gap-3 p-4">
        {/* Enhanced attachment menu */}
        <DropdownMenu open={showAttachmentMenu} onOpenChange={setShowAttachmentMenu}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              disabled={disabled}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={handleImageSelect}>
              <Image className="h-4 w-4 mr-2 text-blue-500" />
              Photo or Video
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleFileUpload}>
              <FileText className="h-4 w-4 mr-2 text-green-500" />
              Document
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLocationShare}>
              <MapPin className="h-4 w-4 mr-2 text-red-500" />
              Location
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Camera className="h-4 w-4 mr-2 text-purple-500" />
              Camera
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Music className="h-4 w-4 mr-2 text-orange-500" />
              Audio
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              // TODO: Implement schedule message
              console.log('Schedule message');
              setShowAttachmentMenu(false);
            }}>
              <Calendar className="h-4 w-4 mr-2 text-indigo-500" />
              Schedule
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Message input area */}
        <div className="flex-1 relative">
          <div className="flex items-end bg-white dark:bg-[#2a3942] rounded-3xl border border-gray-300 dark:border-gray-600 shadow-sm">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "min-h-[44px] max-h-[120px] resize-none border-0 rounded-3xl pl-4 pr-12 py-3",
                "focus:ring-0 focus:outline-none",
                "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                "bg-transparent text-gray-900 dark:text-gray-100"
              )}
              rows={1}
            />
            
            {/* Emoji picker */}
            <div className="absolute right-3 bottom-3">
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full"
                    disabled={disabled}
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-4">
                    <h4 className="font-semibold mb-3">Emojis</h4>
                    <div className="space-y-4 max-h-64 overflow-y-auto">
                      {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                        <div key={category}>
                          <h5 className="text-sm font-medium mb-2 capitalize">{category}</h5>
                          <div className="grid grid-cols-8 gap-1">
                            {emojis.map((emoji) => (
                              <Button
                                key={emoji}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={() => insertEmoji(emoji)}
                              >
                                {emoji}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Voice recording or send button */}
        {isRecording ? (
          <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-full border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-600 dark:text-red-400 text-sm font-medium">
                {formatRecordingTime(recordingTime)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:bg-red-100 dark:hover:bg-red-800 rounded-full"
              onClick={stopRecording}
            >
              <Square className="h-4 w-4 fill-current" />
            </Button>
          </div>
        ) : content.trim() || selectedFiles.length > 0 ? (
          <Button
            onClick={handleSendWithAttachments}
            disabled={disabled || (!canSend && selectedFiles.length === 0)}
            size="icon"
            className={cn(
              "h-12 w-12 shrink-0 rounded-full transition-all duration-200",
              "bg-[#25d366] hover:bg-[#20c55e] text-white",
              "shadow-lg hover:shadow-xl transform hover:scale-105",
              "disabled:opacity-50"
            )}
          >
            <Send className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-12 w-12 shrink-0 rounded-full transition-all duration-200",
              "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[#25d366]",
              "transform hover:scale-110"
            )}
            disabled={disabled}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <input
          ref={imageInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Media Preview Dialog */}
        <MediaPreviewDialog
          isOpen={showMediaPreview}
          onClose={() => setShowMediaPreview(false)}
          files={selectedFiles}
          onSend={handleMediaSend}
          onRemoveFile={(index) => {
            removeFile(index);
            if (selectedFiles.length <= 1) {
              setShowMediaPreview(false);
            }
          }}
        />
      </div>
    </div>
  );
};