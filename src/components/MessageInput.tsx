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
    <div className="border-t border-white/10 bg-black/10 backdrop-blur-md">
      {/* File attachments preview */}
      {selectedFiles.length > 0 && (
        <div className="px-6 py-3 border-b border-white/10">
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-2xl px-4 py-2 text-sm border border-white/20 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  {file.type.startsWith('image/') ? (
                    <Image className="h-4 w-4 text-indigo-400" />
                  ) : (
                    <Paperclip className="h-4 w-4 text-white/70" />
                  )}
                  <div>
                    <p className="font-medium truncate max-w-32 text-white">{file.name}</p>
                    <p className="text-xs text-white/60">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-400 text-white/60"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end gap-4 p-6">
        {/* Attachment menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 shrink-0 text-white/70 hover:bg-white/10 rounded-full backdrop-blur-sm border border-white/20 shadow-lg transition-all duration-200 hover:scale-105"
              disabled={disabled}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" className="mb-2 bg-black/80 backdrop-blur-md border-white/20">
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="h-4 w-4 mr-2" />
              <span className="text-white">Attach File</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <Image className="h-4 w-4 mr-2" />
              <span className="text-white">Send Photo</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Message input area */}
        <div className="flex-1 relative">
          <div className="flex items-end bg-white/20 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "min-h-[48px] max-h-[120px] resize-none border-0 rounded-3xl pl-6 pr-14 py-4",
                "focus:ring-0 focus:outline-none",
                "placeholder:text-white/50 dark:placeholder:text-white/40",
                "bg-transparent text-white font-medium"
              )}
              rows={1}
            />
            
            {/* Emoji picker */}
            <div className="absolute right-4 bottom-4">
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-white/60 hover:bg-white/10 rounded-full transition-all duration-200"
                    disabled={disabled}
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 bg-black/90 backdrop-blur-md border-white/20" align="end">
                  <div className="p-4">
                    <h4 className="font-semibold mb-3 text-white">Emojis</h4>
                    <div className="space-y-4 max-h-64 overflow-y-auto">
                      {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                        <div key={category}>
                          <h5 className="text-sm font-medium mb-2 capitalize text-white/80">{category}</h5>
                          <div className="grid grid-cols-8 gap-1">
                            {emojis.map((emoji) => (
                              <Button
                                key={emoji}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-lg hover:bg-white/10 rounded-lg"
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
              "h-14 w-14 shrink-0 rounded-full transition-all duration-300",
              "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white",
              "shadow-xl hover:shadow-2xl hover:scale-110",
              "disabled:opacity-50 disabled:hover:scale-100"
            )}
          >
            <Send className="h-6 w-6" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-14 w-14 shrink-0 rounded-full transition-all duration-300",
              "text-white/70 hover:bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg",
              "hover:scale-105",
              isRecording && "bg-red-500/80 text-white hover:bg-red-600/80 animate-pulse"
            )}
            disabled={disabled}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
          >
            <Mic className={cn("h-6 w-6", isRecording && "animate-pulse")} />
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