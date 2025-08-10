// Enhanced Event Types for the Events Feature
export interface EventCategory {
  id: string;
  name: string;
  color: string; // Hex color code
  icon?: string; // Lucide icon name
  community_id?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunityEvent {
  id: string;
  community_id: string;
  user_id: string;
  title: string;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  is_virtual: boolean;
  max_attendees?: number;
  category_id?: string;
  recurring_type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurring_end_date?: string;
  tags?: string[];
  visibility: 'public' | 'members_only' | 'private';
  requires_approval: boolean;
  external_url?: string;
  cover_image_url?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
  // Joined data
  category?: EventCategory;
  rsvp_count?: number;
  user_rsvp?: EventRSVP;
  creator_profile?: {
    display_name: string;
    avatar_url?: string;
  };
}

export interface EventRSVP {
  id: string;
  event_id: string;
  user_id: string;
  status: 'going' | 'maybe' | 'not_going' | 'waitlist';
  response_note?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  user_profile?: {
    display_name: string;
    avatar_url?: string;
  };
}

export interface EventNotification {
  id: string;
  event_id: string;
  user_id: string;
  notification_type: 'reminder' | 'update' | 'cancellation' | 'rsvp_change';
  scheduled_for: string;
  sent_at?: string;
  message?: string;
  is_active: boolean;
  created_at: string;
}

export interface UserEventPreferences {
  id: string;
  user_id: string;
  default_reminder_time: number; // Minutes before event
  email_notifications: boolean;
  push_notifications: boolean;
  preferred_categories?: string[]; // Array of category IDs
  auto_rsvp_own_events: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface EventShare {
  id: string;
  event_id: string;
  user_id: string;
  platform: 'facebook' | 'twitter' | 'linkedin' | 'email' | 'copy_link';
  shared_at: string;
}

// Form data types
export interface EventFormData {
  title: string;
  description?: string;
  eventDate: Date;
  startTime?: string;
  endTime?: string;
  location?: string;
  isVirtual: boolean;
  maxAttendees?: number;
  categoryId?: string;
  recurringType: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurringEndDate?: Date;
  tags?: string[];
  visibility: 'public' | 'members_only' | 'private';
  requiresApproval: boolean;
  externalUrl?: string;
  coverImageUrl?: string;
  timezone: string;
}

export interface CategoryFormData {
  name: string;
  color: string;
  icon?: string;
}

// Filter and view types
export interface EventFilters {
  categories?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  rsvpStatus?: 'going' | 'maybe' | 'not_going';
  visibility?: 'public' | 'members_only' | 'private';
  location?: string;
}

export interface EventViewMode {
  type: 'calendar' | 'list' | 'grid';
  groupBy?: 'date' | 'category' | 'location';
}

// Calendar integration types
export interface CalendarExportData {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  url?: string;
}

// Location suggestion types
export interface LocationSuggestion {
  id: string;
  name: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  type: 'venue' | 'landmark' | 'business';
  rating?: number;
  distance?: number; // in meters
}

// Notification types
export interface NotificationSettings {
  eventReminders: boolean;
  eventUpdates: boolean;
  newEventsInCategories: boolean;
  rsvpUpdates: boolean;
  reminderTimes: number[]; // Array of minutes before event
}