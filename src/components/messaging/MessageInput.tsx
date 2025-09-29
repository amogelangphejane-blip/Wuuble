import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Mic,
  X,
  Image,
  File,
  Loader2
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { MessageWithSender } from '@/types/messaging';

interface MessageInputProps {
  onSendMessage: (content: string, replyTo?: string) => Promise<void>;
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  placeholder?: string;
  disabled?: boolean;
  replyingTo?: MessageWithSender | null;
  onCancelReply?: () => void;
  editingMessage?: MessageWithSender | null;
  onCancelEdit?: () => void;
  maxLength?: number;
  className?: string;
}

const EMOJI_CATEGORIES = {
  recent: ['😊', '😂', '❤️', '👍', '😢', '😮', '😡', '🙄'],
  smileys: [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', 
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚'
  ],
  gestures: [
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', 
    '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌'
  ],
  hearts: [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', 
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'
  ],
};

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onStartTyping,
  onStopTyping,
  placeholder = "Type a message...",
  disabled = false,
  replyingTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  maxLength = 2000,
  className
}) => {
  const [content, setContent] = useState(editingMessage?.content || '');
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [content]);

  // Set content when editing message changes
  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content);
    } else if (!replyingTo) {
      setContent('');
    }
  }, [editingMessage, replyingTo]);

  // Focus textarea when replying or editing
  useEffect(() => {
    if ((replyingTo || editingMessage) && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo, editingMessage]);

  const handleContentChange = useCallback((value: string) => {
    setContent(value);
    
    // Handle typing indicators
    if (onStartTyping && value.trim()) {
      onStartTyping();
      
      // Reset typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        onStopTyping?.();
      }, 2000);
    } else if (onStopTyping && !value.trim()) {
      onStopTyping();
    }
  }, [onStartTyping, onStopTyping]);

  const handleSend = useCallback(async () => {
    const trimmedContent = content.trim();
    
    if (!trimmedContent || isSending) return;
    if (trimmedContent.length > maxLength) return;

    setIsSending(true);
    
    try {
      await onSendMessage(
        trimmedContent, 
        replyingTo?.id
      );
      
      setContent('');
      setSelectedFiles([]);
      onCancelReply?.();
      onCancelEdit?.();
      onStopTyping?.();
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, [content, isSending, maxLength, onSendMessage, replyingTo, onCancelReply, onCancelEdit, onStopTyping]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const insertEmoji = useCallback((emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      
      setContent(newContent);
      
      // Restore cursor position
      setTimeout(() => {
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
        textarea.focus();
      }, 0);
    }
    setShowEmojiPicker(false);
  }, [content]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canSend = content.trim().length > 0 && content.length <= maxLength;

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={cn(
      "border-t bg-white dark:bg-gray-900 transition-all duration-200",
      className
    )}>
      {/* Reply/Edit indicator */}
      {(replyingTo || editingMessage) && (
        <div className="px-3 md:px-4 py-2 border-b bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                {editingMessage ? 'Edit message' : `Replying to ${replyingTo?.sender.display_name}`}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
                {(editingMessage || replyingTo)?.content}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 ml-2 flex-shrink-0"
              onClick={editingMessage ? onCancelEdit : onCancelReply}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* File attachments preview */}
      {selectedFiles.length > 0 && (
        <div className="px-3 md:px-4 py-2 border-b bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm border shadow-sm"
              >
                <div className="flex items-center gap-2">
                  {file.type.startsWith('image/') ? (
                    <Image className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  ) : (
                    <File className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate max-w-32">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 flex-shrink-0"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 md:gap-3 p-3 md:p-4">
        {/* Attachment button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 md:h-11 md:w-11 shrink-0 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* Message input container */}
        <div className="flex-1 relative">
          <div className="relative bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-600 transition-all duration-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 dark:focus-within:ring-blue-800">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled || isSending}
              className={cn(
                "min-h-[44px] md:min-h-[48px] max-h-[120px] resize-none border-0 bg-transparent",
                "pl-4 pr-12 py-3 text-sm md:text-base rounded-2xl",
                "focus:ring-0 focus:outline-none",
                "placeholder:text-gray-500 dark:placeholder:text-gray-400"
              )}
              rows={1}
            />
            
            {/* Character count */}
            {content.length > maxLength * 0.8 && (
              <div className={cn(
                "absolute top-2 right-12 text-xs",
                content.length > maxLength ? "text-red-500" : "text-gray-400"
              )}>
                {content.length}/{maxLength}
              </div>
            )}
            
            {/* Emoji picker */}
            <div className="absolute right-2 bottom-2">
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                    disabled={disabled}
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-4">
                    <h4 className="font-semibold mb-3 text-sm">Emojis</h4>
                    <div className="space-y-4 max-h-64 overflow-y-auto scrollbar-thin">
                      {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                        <div key={category}>
                          <h5 className="text-xs font-medium mb-2 capitalize text-gray-600 dark:text-gray-300">
                            {category}
                          </h5>
                          <div className="grid grid-cols-8 gap-1">
                            {emojis.map((emoji) => (
                              <Button
                                key={emoji}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
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

        {/* Send/Voice button */}
        {canSend ? (
          <Button
            onClick={handleSend}
            disabled={disabled || isSending}
            size="icon"
            className={cn(
              "h-10 w-10 md:h-11 md:w-11 shrink-0 rounded-full transition-all duration-200",
              "bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "touch-manipulation active:scale-95"
            )}
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-10 w-10 md:h-11 md:w-11 shrink-0 rounded-full transition-all duration-200",
              "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700",
              "touch-manipulation active:scale-95",
              isRecording && "bg-red-500 text-white hover:bg-red-600"
            )}
            disabled={disabled}
            onMouseDown={() => setIsRecording(true)}
            onMouseUp={() => setIsRecording(false)}
            onMouseLeave={() => setIsRecording(false)}
            onTouchStart={() => setIsRecording(true)}
            onTouchEnd={() => setIsRecording(false)}
          >
            <Mic className={cn(
              "h-5 w-5 transition-all duration-200",
              isRecording && "animate-pulse"
            )} />
          </Button>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
};

export { MessageInput };