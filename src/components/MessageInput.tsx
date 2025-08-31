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
  Plus
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

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setSelectedFiles(prev => [...prev, ...files]);
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

  const startRecording = () => {
    setIsRecording(true);
    // TODO: Implement voice recording
    console.log('Start recording');
  };

  const stopRecording = () => {
    setIsRecording(false);
    // TODO: Stop recording and send voice message
    console.log('Stop recording');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-[#f0f2f5] dark:bg-[#202c33]">
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
        {/* Attachment button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

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
        {content.trim() || selectedFiles.length > 0 ? (
          <Button
            onClick={handleSendWithAttachments}
            disabled={disabled || (!canSend && selectedFiles.length === 0)}
            size="icon"
            className={cn(
              "h-12 w-12 shrink-0 rounded-full transition-all duration-200",
              "bg-[#25d366] hover:bg-[#20c55e] text-white",
              "shadow-lg hover:shadow-xl",
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
              "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700",
              isRecording && "bg-red-500 text-white hover:bg-red-600"
            )}
            disabled={disabled}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
          >
            <Mic className={cn("h-5 w-5", isRecording && "animate-pulse")} />
          </Button>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
};