export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      creator_wallets: {
        Row: {
          id: string
          creator_id: string
          balance: number
          pending_balance: number
          total_earned: number
          total_withdrawn: number
          currency: string
          stripe_account_id: string | null
          payout_method: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          balance?: number
          pending_balance?: number
          total_earned?: number
          total_withdrawn?: number
          currency?: string
          stripe_account_id?: string | null
          payout_method?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          balance?: number
          pending_balance?: number
          total_earned?: number
          total_withdrawn?: number
          currency?: string
          stripe_account_id?: string | null
          payout_method?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          id: string
          wallet_id: string
          transaction_type: string
          amount: number
          currency: string
          description: string | null
          reference_id: string | null
          reference_type: string | null
          status: string
          metadata: Json
          processed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          transaction_type: string
          amount: number
          currency?: string
          description?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          metadata?: Json
          processed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          transaction_type?: string
          amount?: number
          currency?: string
          description?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          metadata?: Json
          processed_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            referencedRelation: "creator_wallets"
            referencedColumns: ["id"]
          }
        ]
      }
      platform_fee_config: {
        Row: {
          id: string
          fee_percentage: number
          minimum_fee: number
          maximum_fee: number | null
          currency: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          fee_percentage?: number
          minimum_fee?: number
          maximum_fee?: number | null
          currency?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          fee_percentage?: number
          minimum_fee?: number
          maximum_fee?: number | null
          currency?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          id: string
          wallet_id: string
          amount: number
          currency: string
          payout_method: Json
          status: string
          external_payout_id: string | null
          failure_reason: string | null
          requested_at: string
          processed_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          amount: number
          currency?: string
          payout_method: Json
          status?: string
          external_payout_id?: string | null
          failure_reason?: string | null
          requested_at?: string
          processed_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          amount?: number
          currency?: string
          payout_method?: Json
          status?: string
          external_payout_id?: string | null
          failure_reason?: string | null
          requested_at?: string
          processed_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_wallet_id_fkey"
            columns: ["wallet_id"]
            referencedRelation: "creator_wallets"
            referencedColumns: ["id"]
          }
        ]
      }
      communities: {
        Row: {
          avatar_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          id: string
          is_private: boolean
          member_count: number
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          is_private?: boolean
          member_count?: number
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          is_private?: boolean
          member_count?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_events: {
        Row: {
          id: string
          community_id: string
          user_id: string
          title: string
          description: string | null
          event_date: string
          start_time: string | null
          end_time: string | null
          location: string | null
          is_virtual: boolean
          max_attendees: number | null
          cover_image_url: string | null
          category_id: string | null
          recurring_type: string
          recurring_end_date: string | null
          tags: string[] | null
          visibility: string
          requires_approval: boolean
          external_url: string | null
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          community_id: string
          user_id: string
          title: string
          description?: string | null
          event_date: string
          start_time?: string | null
          end_time?: string | null
          location?: string | null
          is_virtual?: boolean
          max_attendees?: number | null
          cover_image_url?: string | null
          category_id?: string | null
          recurring_type?: string
          recurring_end_date?: string | null
          tags?: string[] | null
          visibility?: string
          requires_approval?: boolean
          external_url?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          community_id?: string
          user_id?: string
          title?: string
          description?: string | null
          event_date?: string
          start_time?: string | null
          end_time?: string | null
          location?: string | null
          is_virtual?: boolean
          max_attendees?: number | null
          cover_image_url?: string | null
          category_id?: string | null
          recurring_type?: string
          recurring_end_date?: string | null
          tags?: string[] | null
          visibility?: string
          requires_approval?: boolean
          external_url?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      event_categories: {
        Row: {
          id: string
          name: string
          color: string
          icon: string | null
          community_id: string | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string
          icon?: string | null
          community_id?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          icon?: string | null
          community_id?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_categories_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          }
        ]
      }
      event_rsvps: {
        Row: {
          id: string
          event_id: string
          user_id: string
          status: string
          response_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          status?: string
          response_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          status?: string
          response_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "community_events"
            referencedColumns: ["id"]
          }
        ]
      }
      event_notifications: {
        Row: {
          id: string
          event_id: string
          user_id: string
          notification_type: string
          scheduled_for: string
          sent_at: string | null
          message: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          notification_type: string
          scheduled_for: string
          sent_at?: string | null
          message?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          notification_type?: string
          scheduled_for?: string
          sent_at?: string | null
          message?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "community_events"
            referencedColumns: ["id"]
          }
        ]
      }
      user_event_preferences: {
        Row: {
          id: string
          user_id: string
          default_reminder_time: number
          email_notifications: boolean
          push_notifications: boolean
          preferred_categories: string[] | null
          auto_rsvp_own_events: boolean
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          default_reminder_time?: number
          email_notifications?: boolean
          push_notifications?: boolean
          preferred_categories?: string[] | null
          auto_rsvp_own_events?: boolean
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          default_reminder_time?: number
          email_notifications?: boolean
          push_notifications?: boolean
          preferred_categories?: string[] | null
          auto_rsvp_own_events?: boolean
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_shares: {
        Row: {
          id: string
          event_id: string
          user_id: string
          platform: string
          shared_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          platform: string
          shared_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          platform?: string
          shared_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_shares_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "community_events"
            referencedColumns: ["id"]
          }
        ]
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          community_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          community_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          community_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      community_group_calls: {
        Row: {
          id: string
          community_id: string
          creator_id: string
          title: string
          description: string | null
          status: string
          max_participants: number
          current_participants: number
          is_recording: boolean
          recording_url: string | null
          started_at: string
          ended_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          community_id: string
          creator_id: string
          title?: string
          description?: string | null
          status?: string
          max_participants?: number
          current_participants?: number
          is_recording?: boolean
          recording_url?: string | null
          started_at?: string
          ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          community_id?: string
          creator_id?: string
          title?: string
          description?: string | null
          status?: string
          max_participants?: number
          current_participants?: number
          is_recording?: boolean
          recording_url?: string | null
          started_at?: string
          ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_group_calls_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_group_calls_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      community_group_call_participants: {
        Row: {
          id: string
          call_id: string
          user_id: string
          joined_at: string
          left_at: string | null
          is_muted: boolean
          is_video_enabled: boolean
          is_screen_sharing: boolean
          role: string
          connection_quality: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          call_id: string
          user_id: string
          joined_at?: string
          left_at?: string | null
          is_muted?: boolean
          is_video_enabled?: boolean
          is_screen_sharing?: boolean
          role?: string
          connection_quality?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          call_id?: string
          user_id?: string
          joined_at?: string
          left_at?: string | null
          is_muted?: boolean
          is_video_enabled?: boolean
          is_screen_sharing?: boolean
          role?: string
          connection_quality?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_group_call_participants_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "community_group_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_group_call_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      community_group_call_events: {
        Row: {
          id: string
          call_id: string
          user_id: string | null
          event_type: string
          event_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          call_id: string
          user_id?: string | null
          event_type: string
          event_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          call_id?: string
          user_id?: string | null
          event_type?: string
          event_data?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_group_call_events_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "community_group_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_group_call_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      chat_channels: {
        Row: {
          id: string
          community_id: string
          name: string
          description: string | null
          channel_type: string
          is_private: boolean
          created_by: string | null
          created_at: string
          updated_at: string
          is_archived: boolean
          member_count: number
        }
        Insert: {
          id?: string
          community_id: string
          name: string
          description?: string | null
          channel_type?: string
          is_private?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
          is_archived?: boolean
          member_count?: number
        }
        Update: {
          id?: string
          community_id?: string
          name?: string
          description?: string | null
          channel_type?: string
          is_private?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
          is_archived?: boolean
          member_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "chat_channels_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      chat_channel_members: {
        Row: {
          id: string
          channel_id: string
          user_id: string
          role: string
          joined_at: string
          last_read_at: string
          notification_settings: Json
        }
        Insert: {
          id?: string
          channel_id: string
          user_id: string
          role?: string
          joined_at?: string
          last_read_at?: string
          notification_settings?: Json
        }
        Update: {
          id?: string
          channel_id?: string
          user_id?: string
          role?: string
          joined_at?: string
          last_read_at?: string
          notification_settings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "chat_channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_channel_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      chat_messages: {
        Row: {
          id: string
          channel_id: string
          user_id: string | null
          content: string
          message_type: string
          parent_message_id: string | null
          thread_root_id: string | null
          reply_count: number
          is_edited: boolean
          edited_at: string | null
          is_deleted: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          channel_id: string
          user_id?: string | null
          content: string
          message_type?: string
          parent_message_id?: string | null
          thread_root_id?: string | null
          reply_count?: number
          is_edited?: boolean
          edited_at?: string | null
          is_deleted?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          channel_id?: string
          user_id?: string | null
          content?: string
          message_type?: string
          parent_message_id?: string | null
          thread_root_id?: string | null
          reply_count?: number
          is_edited?: boolean
          edited_at?: string | null
          is_deleted?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_thread_root_id_fkey"
            columns: ["thread_root_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          }
        ]
      }
      message_reactions: {
        Row: {
          id: string
          message_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string
          emoji?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      message_mentions: {
        Row: {
          id: string
          message_id: string
          mentioned_user_id: string
          mention_type: string
          created_at: string
          is_read: boolean
          read_at: string | null
        }
        Insert: {
          id?: string
          message_id: string
          mentioned_user_id: string
          mention_type?: string
          created_at?: string
          is_read?: boolean
          read_at?: string | null
        }
        Update: {
          id?: string
          message_id?: string
          mentioned_user_id?: string
          mention_type?: string
          created_at?: string
          is_read?: boolean
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_mentions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_mentions_mentioned_user_id_fkey"
            columns: ["mentioned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      message_attachments: {
        Row: {
          id: string
          message_id: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          thumbnail_url: string | null
          storage_path: string
          uploaded_by: string | null
          created_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          message_id: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          thumbnail_url?: string | null
          storage_path: string
          uploaded_by?: string | null
          created_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          message_id?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          thumbnail_url?: string | null
          storage_path?: string
          uploaded_by?: string | null
          created_at?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      message_read_status: {
        Row: {
          id: string
          channel_id: string
          user_id: string
          last_read_message_id: string | null
          last_read_at: string
          unread_count: number
          unread_mentions_count: number
        }
        Insert: {
          id?: string
          channel_id: string
          user_id: string
          last_read_message_id?: string | null
          last_read_at?: string
          unread_count?: number
          unread_mentions_count?: number
        }
        Update: {
          id?: string
          channel_id?: string
          user_id?: string
          last_read_message_id?: string | null
          last_read_at?: string
          unread_count?: number
          unread_mentions_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "message_read_status_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_read_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "message_read_status_last_read_message_id_fkey"
            columns: ["last_read_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          }
        ]
      }
      typing_indicators: {
        Row: {
          id: string
          channel_id: string
          user_id: string
          started_typing_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          channel_id: string
          user_id: string
          started_typing_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          channel_id?: string
          user_id?: string
          started_typing_at?: string
          expires_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_indicators_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_indicators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      conversations: {
        Row: {
          id: string
          participant_1_id: string
          participant_2_id: string
          created_at: string
          updated_at: string
          last_message_at: string
        }
        Insert: {
          id?: string
          participant_1_id: string
          participant_2_id: string
          created_at?: string
          updated_at?: string
          last_message_at?: string
        }
        Update: {
          id?: string
          participant_1_id?: string
          participant_2_id?: string
          created_at?: string
          updated_at?: string
          last_message_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          created_at: string
          is_read: boolean
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          created_at?: string
          is_read?: boolean
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          created_at?: string
          is_read?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      community_is_public: {
        Args: { community_id: string }
        Returns: boolean
      }
      user_can_view_community: {
        Args: { community_id: string; user_id: string }
        Returns: boolean
      }
      user_created_community: {
        Args: { community_id: string; user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
