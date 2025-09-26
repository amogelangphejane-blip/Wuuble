import React, { useState, useRef, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Smile,
  AtSign,
  Hash,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minRows?: number;
  maxLength?: number;
  className?: string;
  enableMentions?: boolean;
  enableHashtags?: boolean;
  enableEmojis?: boolean;
}

const EMOJI_SHORTCUTS: Record<string, string> = {
  ':)': '😊',
  ':D': '😃',
  ':(': '😢',
  ':P': '😛',
  ':o': '😮',
  ':|': '😐',
  ':heart:': '❤️',
  ':thumbs_up:': '👍',
  ':thumbs_down:': '👎',
  ':fire:': '🔥',
  ':star:': '⭐',
  ':check:': '✅',
  ':x:': '❌',
  ':warning:': '⚠️',
  ':info:': 'ℹ️'
};

const COMMON_EMOJIS = [
  '😊', '😃', '😂', '🤣', '😊', '😍', '🥰', '😘', 
  '😢', '😭', '😡', '🤬', '😱', '😨', '😰', '😓',
  '👍', '👎', '👏', '🙌', '👋', '✌️', '🤝', '🙏',
  '❤️', '💙', '💚', '💛', '🧡', '💜', '🤍', '🤎',
  '🔥', '⭐', '✨', '💎', '🎉', '🎊', '🚀', '💯'
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "What's on your mind?",
  disabled = false,
  minRows = 4,
  maxLength = 5000,
  className = '',
  enableMentions = true,
  enableHashtags = true,
  enableEmojis = true
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  const insertText = useCallback((textToInsert: string, replace = false) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const textBefore = value.substring(0, replace ? start - 1 : start);
    const textAfter = value.substring(end);
    
    const newValue = textBefore + textToInsert + textAfter;
    onChange(newValue);

    // Set cursor position after insertion
    setTimeout(() => {
      const newCursorPosition = start + textToInsert.length;
      textarea.selectionStart = textarea.selectionEnd = newCursorPosition;
      textarea.focus();
    }, 0);
  }, [value, onChange]);

  const wrapSelection = useCallback((prefix: string, suffix: string = prefix) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    if (selectedText) {
      const wrappedText = prefix + selectedText + suffix;
      insertText(wrappedText);
    } else {
      insertText(prefix + suffix);
    }
  }, [value, insertText]);

  const insertAtStart = useCallback((prefix: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    
    // Find the start of the current line
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const beforeLine = value.substring(0, lineStart);
    const afterLine = value.substring(lineStart);
    
    const newValue = beforeLine + prefix + afterLine;
    onChange(newValue);

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = lineStart + prefix.length + (start - lineStart);
      textarea.focus();
    }, 0);
  }, [value, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          wrapSelection('**');
          break;
        case 'i':
          e.preventDefault();
          wrapSelection('*');
          break;
        case 'u':
          e.preventDefault();
          wrapSelection('__');
          break;
        case 'k':
          e.preventDefault();
          wrapSelection('[', '](url)');
          break;
      }
    }

    // Handle Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      insertText('  ');
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setCursorPosition(e.target.selectionStart);

    // Handle emoji shortcuts
    if (enableEmojis) {
      let processedValue = newValue;
      Object.entries(EMOJI_SHORTCUTS).forEach(([shortcut, emoji]) => {
        processedValue = processedValue.replace(new RegExp(shortcut.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), emoji);
      });
      
      if (processedValue !== newValue) {
        onChange(processedValue);
        return;
      }
    }

    onChange(newValue);
  };

  const insertEmoji = (emoji: string) => {
    insertText(emoji);
    setShowEmojiPicker(false);
  };

  const getWordCount = () => {
    return value.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharacterCount = () => {
    return value.length;
  };

  return (
    <div className={`border border-border rounded-xl bg-muted/30 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-1 flex-wrap">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => wrapSelection('**')}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => wrapSelection('*')}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => wrapSelection('__')}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title="Underline (Ctrl+U)"
          >
            <Underline className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertAtStart('- ')}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertAtStart('1. ')}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertAtStart('> ')}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => wrapSelection('`')}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title="Code"
          >
            <Code className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => wrapSelection('[', '](url)')}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title="Link (Ctrl+K)"
          >
            <Link className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {enableMentions && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertText('@')}
              disabled={disabled}
              className="h-8 w-8 p-0"
              title="Mention User"
            >
              <AtSign className="h-4 w-4" />
            </Button>
          )}

          {enableHashtags && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertText('#')}
              disabled={disabled}
              className="h-8 w-8 p-0"
              title="Add Hashtag"
            >
              <Hash className="h-4 w-4" />
            </Button>
          )}

          {enableEmojis && (
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  className="h-8 w-8 p-0"
                  title="Add Emoji"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="start">
                <div className="grid grid-cols-8 gap-1">
                  {COMMON_EMOJIS.map((emoji, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      onClick={() => insertEmoji(emoji)}
                      className="h-8 w-8 p-0 text-lg hover:bg-muted/50"
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Character count */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{getCharacterCount()}/{maxLength}</span>
          <span>•</span>
          <span>{getWordCount()} words</span>
        </div>
      </div>

      {/* Textarea */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="resize-none border-0 shadow-none focus-visible:ring-0 bg-transparent text-base leading-relaxed min-h-24"
        rows={minRows}
        maxLength={maxLength}
        style={{ 
          minHeight: `${minRows * 1.5 + 1}rem`,
          height: 'auto'
        }}
      />

      {/* Footer with formatting hints */}
      <div className="px-3 py-2 border-t border-border/50 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              **bold**
            </Badge>
            <Badge variant="secondary" className="text-xs">
              *italic*
            </Badge>
            <Badge variant="secondary" className="text-xs">
              `code`
            </Badge>
            <Badge variant="secondary" className="text-xs">
              > quote
            </Badge>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Use markdown formatting • Ctrl+B for bold
          </div>
        </div>
      </div>
    </div>
  );
};