export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  is_online?: boolean;
  last_seen?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  is_group: boolean;
  name?: string | null;
  description?: string | null;
  avatar_url?: string | null;
  created_by: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  is_admin: boolean;
  is_muted: boolean;
  last_read_at: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'voice' | 'video' | 'system';
  reply_to?: string | null;
  reactions?: MessageReaction[];
  attachments?: MessageAttachment[];
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  thumbnail_url?: string | null;
  created_at: string;
}

export interface TypingIndicator {
  user_id: string;
  conversation_id: string;
  is_typing: boolean;
  timestamp: string;
}

// Enhanced types with populated data
export interface MessageWithSender extends Message {
  sender: User;
  reply_to_message?: MessageWithSender | null;
}

export interface ConversationWithDetails extends Conversation {
  participants: (ConversationParticipant & { user: User })[];
  last_message?: MessageWithSender | null;
  unread_count: number;
  other_participant?: User; // For 1-on-1 conversations
}

// API Response types
export interface ConversationsResponse {
  conversations: ConversationWithDetails[];
  total: number;
  has_more: boolean;
}

export interface MessagesResponse {
  messages: MessageWithSender[];
  total: number;
  has_more: boolean;
}

export interface UserSearchResponse {
  users: User[];
  total: number;
  has_more: boolean;
}

// Real-time event types
export interface MessageEvent {
  type: 'message_created' | 'message_updated' | 'message_deleted';
  payload: MessageWithSender;
  conversation_id: string;
}

export interface TypingEvent {
  type: 'typing_start' | 'typing_stop';
  payload: TypingIndicator;
  conversation_id: string;
}

export interface ConversationEvent {
  type: 'conversation_created' | 'conversation_updated' | 'participant_added' | 'participant_removed';
  payload: ConversationWithDetails | ConversationParticipant;
  conversation_id: string;
}

// Hook return types
export interface UseMessagesReturn {
  messages: MessageWithSender[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  sendMessage: (content: string, type?: Message['message_type'], replyTo?: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
}

export interface UseConversationsReturn {
  conversations: ConversationWithDetails[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  createConversation: (userIds: string[], isGroup?: boolean, name?: string) => Promise<ConversationWithDetails>;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  searchConversations: (query: string) => Promise<ConversationWithDetails[]>;
}

export interface UseTypingReturn {
  typingUsers: User[];
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
}

// UI State types
export interface MessagingUIState {
  selectedConversationId: string | null;
  isMobileView: boolean;
  showConversationList: boolean;
  showUserSearch: boolean;
  searchQuery: string;
  replyingTo: MessageWithSender | null;
  editingMessage: MessageWithSender | null;
}

// Configuration types
export interface MessagingConfig {
  maxMessageLength: number;
  maxFileSize: number;
  supportedFileTypes: string[];
  enableReactions: boolean;
  enableTypingIndicators: boolean;
  enableMessageEditing: boolean;
  enableMessageDeletion: boolean;
  enableFileSharing: boolean;
  enableVoiceMessages: boolean;
  autoMarkAsRead: boolean;
  typingIndicatorTimeout: number;
}

// Error types
export interface MessagingError extends Error {
  code: string;
  details?: any;
  retryable: boolean;
}

// Filter and sort types
export type ConversationFilter = 'all' | 'unread' | 'archived' | 'muted';
export type ConversationSort = 'recent' | 'alphabetical' | 'unread_first';
export type MessageSort = 'chronological' | 'reverse_chronological';

// Pagination types
export interface PaginationParams {
  limit?: number;
  offset?: number;
  cursor?: string;
}

// Search types
export interface SearchFilters {
  messageType?: Message['message_type'];
  dateFrom?: string;
  dateTo?: string;
  senderId?: string;
  hasAttachments?: boolean;
}

export interface MessageSearchParams extends PaginationParams {
  query: string;
  conversationId?: string;
  filters?: SearchFilters;
}

// Theme and customization
export interface MessagingTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  bubbleColors: {
    own: string;
    others: string;
  };
  borderRadius: number;
  fontSize: {
    small: string;
    medium: string;
    large: string;
  };
}

// Permissions
export interface MessagingPermissions {
  canCreateConversations: boolean;
  canDeleteOwnMessages: boolean;
  canEditOwnMessages: boolean;
  canDeleteConversations: boolean;
  canAddParticipants: boolean;
  canRemoveParticipants: boolean;
  canShareFiles: boolean;
  canSendVoiceMessages: boolean;
  canReactToMessages: boolean;
}

// Analytics types
export interface MessageAnalytics {
  totalMessages: number;
  totalConversations: number;
  avgResponseTime: number;
  mostActiveHours: number[];
  messagesByType: Record<Message['message_type'], number>;
}