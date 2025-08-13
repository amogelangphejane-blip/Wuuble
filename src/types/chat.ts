import { Tables } from '@/integrations/supabase/types';

// Base types from database
export type ChatChannel = Tables<'chat_channels'>;
export type ChatChannelMember = Tables<'chat_channel_members'>;
export type ChatMessage = Tables<'chat_messages'>;
export type MessageReaction = Tables<'message_reactions'>;
export type MessageMention = Tables<'message_mentions'>;
export type MessageAttachment = Tables<'message_attachments'>;
export type MessageReadStatus = Tables<'message_read_status'>;
export type TypingIndicator = Tables<'typing_indicators'>;

// Extended types with related data
export interface ChatChannelWithDetails extends ChatChannel {
  members?: ChatChannelMember[];
  unread_count?: number;
  last_message?: ChatMessage;
  community?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface ChatMessageWithDetails extends ChatMessage {
  user?: {
    id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
  reactions?: MessageReactionWithUser[];
  mentions?: MessageMention[];
  attachments?: MessageAttachment[];
  replies?: ChatMessageWithDetails[];
  parent_message?: ChatMessageWithDetails;
  thread_root?: ChatMessageWithDetails;
}

export interface MessageReactionWithUser extends MessageReaction {
  user?: {
    id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface MessageMentionWithUser extends MessageMention {
  user?: {
    id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
  message?: ChatMessage;
}

export interface ChatChannelMemberWithUser extends ChatChannelMember {
  user?: {
    id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
}

// Message types
export type MessageType = 'text' | 'file' | 'image' | 'system' | 'call_start' | 'call_end';

// Channel types
export type ChannelType = 'general' | 'announcement' | 'private' | 'direct';

// Member roles
export type MemberRole = 'owner' | 'moderator' | 'member';

// Mention types
export type MentionType = 'user' | 'channel' | 'everyone';

// Rich text formatting metadata
export interface MessageMetadata {
  formatting?: {
    bold?: Array<{ start: number; end: number }>;
    italic?: Array<{ start: number; end: number }>;
    code?: Array<{ start: number; end: number }>;
    codeBlock?: Array<{ start: number; end: number; language?: string }>;
    links?: Array<{ start: number; end: number; url: string }>;
  };
  mentions?: Array<{
    start: number;
    end: number;
    userId: string;
    username: string;
  }>;
  channelMentions?: Array<{
    start: number;
    end: number;
    channelId: string;
    channelName: string;
  }>;
}

// Notification settings
export interface NotificationSettings {
  mentions: boolean;
  all_messages: boolean;
  reactions: boolean;
}

// Chat events for real-time updates
export interface ChatEvent {
  type: 'message' | 'reaction' | 'typing' | 'member_join' | 'member_leave' | 'channel_update';
  channel_id: string;
  data: any;
  user_id?: string;
  timestamp: string;
}

// Typing status
export interface TypingStatus {
  channel_id: string;
  users: Array<{
    id: string;
    username?: string;
    display_name?: string;
  }>;
}

// Message search filters
export interface MessageSearchFilters {
  query?: string;
  user_id?: string;
  message_type?: MessageType;
  has_attachments?: boolean;
  date_from?: string;
  date_to?: string;
  channel_id?: string;
}

// Message search result
export interface MessageSearchResult {
  messages: ChatMessageWithDetails[];
  total_count: number;
  has_more: boolean;
}

// File upload types
export interface FileUpload {
  file: File;
  preview?: string;
  progress?: number;
  error?: string;
}

// Emoji reaction data
export interface EmojiReaction {
  emoji: string;
  count: number;
  users: Array<{
    id: string;
    username?: string;
    display_name?: string;
  }>;
  user_reacted: boolean;
}

// Thread summary
export interface ThreadSummary {
  message_id: string;
  reply_count: number;
  last_reply_at: string;
  participants: Array<{
    id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  }>;
}

// Chat state management
export interface ChatState {
  channels: ChatChannelWithDetails[];
  activeChannelId?: string;
  messages: Record<string, ChatMessageWithDetails[]>; // channelId -> messages
  typingUsers: Record<string, TypingStatus>; // channelId -> typing status
  unreadCounts: Record<string, number>; // channelId -> unread count
  loading: boolean;
  error?: string;
}

// Message input state
export interface MessageInputState {
  content: string;
  mentions: Array<{ userId: string; username: string; start: number; end: number }>;
  attachments: FileUpload[];
  replyTo?: ChatMessage;
  isEditing?: string; // message ID being edited
}

// Chat API responses
export interface SendMessageResponse {
  message: ChatMessageWithDetails;
  success: boolean;
  error?: string;
}

export interface CreateChannelResponse {
  channel: ChatChannelWithDetails;
  success: boolean;
  error?: string;
}

// Permissions
export interface ChatPermissions {
  canSendMessages: boolean;
  canEditMessages: boolean;
  canDeleteMessages: boolean;
  canManageChannel: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canCreateChannels: boolean;
}

// Real-time subscription types
export interface RealtimeSubscription {
  channel_id: string;
  subscription: any; // Supabase subscription object
  active: boolean;
}