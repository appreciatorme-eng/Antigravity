export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      add_ons: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          duration: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          organization_id: string
          price: number
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          organization_id: string
          price: number
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          organization_id?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "add_ons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      addon_views: {
        Row: {
          add_on_id: string
          client_id: string
          id: string
          source: string | null
          viewed_at: string | null
        }
        Insert: {
          add_on_id: string
          client_id: string
          id?: string
          source?: string | null
          viewed_at?: string | null
        }
        Update: {
          add_on_id?: string
          client_id?: string
          id?: string
          source?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addon_views_add_on_id_fkey"
            columns: ["add_on_id"]
            isOneToOne: false
            referencedRelation: "add_ons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addon_views_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_audit_log: {
        Row: {
          action_name: string | null
          action_params: Json | null
          action_result: Json | null
          channel: string
          created_at: string
          event_type: string
          id: string
          organization_id: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          action_name?: string | null
          action_params?: Json | null
          action_result?: Json | null
          channel: string
          created_at?: string
          event_type: string
          id?: string
          organization_id: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          action_name?: string | null
          action_params?: Json | null
          action_result?: Json | null
          channel?: string
          created_at?: string
          event_type?: string
          id?: string
          organization_id?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_audit_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "assistant_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_conversations: {
        Row: {
          action_name: string | null
          action_result: Json | null
          created_at: string
          id: string
          message_content: string
          message_role: string
          metadata: Json | null
          organization_id: string
          session_id: string
          title: string | null
          user_id: string
        }
        Insert: {
          action_name?: string | null
          action_result?: Json | null
          created_at?: string
          id?: string
          message_content: string
          message_role: string
          metadata?: Json | null
          organization_id: string
          session_id?: string
          title?: string | null
          user_id: string
        }
        Update: {
          action_name?: string | null
          action_result?: Json | null
          created_at?: string
          id?: string
          message_content?: string
          message_role?: string
          metadata?: Json | null
          organization_id?: string
          session_id?: string
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_preferences: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          preference_key: string
          preference_value: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          preference_key: string
          preference_value: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          preference_key?: string
          preference_value?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_sessions: {
        Row: {
          channel: string
          context_snapshot: Json | null
          conversation_history: Json | null
          created_at: string
          expires_at: string
          id: string
          organization_id: string
          pending_action: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: string
          context_snapshot?: Json | null
          conversation_history?: Json | null
          created_at?: string
          expires_at?: string
          id?: string
          organization_id: string
          pending_action?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          context_snapshot?: Json | null
          conversation_history?: Json | null
          created_at?: string
          expires_at?: string
          id?: string
          organization_id?: string
          pending_action?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_contact_overrides: {
        Row: {
          contact_phone: string
          created_at: string | null
          enabled: boolean
          id: string
          organization_id: string
          rule_type: string
          updated_at: string | null
        }
        Insert: {
          contact_phone: string
          created_at?: string | null
          enabled?: boolean
          id?: string
          organization_id: string
          rule_type: string
          updated_at?: string | null
        }
        Update: {
          contact_phone?: string
          created_at?: string | null
          enabled?: boolean
          id?: string
          organization_id?: string
          rule_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      automation_executions: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          execution_type: string
          id: string
          messages_failed: number
          messages_sent: number
          messages_skipped: number
          metadata: Json
          rules_processed: number
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          execution_type?: string
          id?: string
          messages_failed?: number
          messages_sent?: number
          messages_skipped?: number
          metadata?: Json
          rules_processed?: number
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          execution_type?: string
          id?: string
          messages_failed?: number
          messages_sent?: number
          messages_skipped?: number
          metadata?: Json
          rules_processed?: number
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      automation_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_channel: string
          message_content: string | null
          organization_id: string
          rule_id: string
          rule_type: string
          sent_at: string | null
          status: string
          target_entity_id: string
          target_entity_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_channel: string
          message_content?: string | null
          organization_id: string
          rule_id: string
          rule_type: string
          sent_at?: string | null
          status?: string
          target_entity_id: string
          target_entity_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_channel?: string
          message_content?: string | null
          organization_id?: string
          rule_id?: string
          rule_type?: string
          sent_at?: string | null
          status?: string
          target_entity_id?: string
          target_entity_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_config: Json
          created_at: string
          enabled: boolean
          id: string
          organization_id: string
          rule_type: string
          trigger_config: Json
          updated_at: string
        }
        Insert: {
          action_config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          organization_id: string
          rule_type: string
          trigger_config?: Json
          updated_at?: string
        }
        Update: {
          action_config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          organization_id?: string
          rule_type?: string
          trigger_config?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_sent_messages: {
        Row: {
          contact_phone: string
          created_at: string
          id: string
          message_preview: string | null
          organization_id: string
          rule_type: string
        }
        Insert: {
          contact_phone: string
          created_at?: string
          id?: string
          message_preview?: string | null
          organization_id: string
          rule_type: string
        }
        Update: {
          contact_phone?: string
          created_at?: string
          id?: string
          message_preview?: string | null
          organization_id?: string
          rule_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_sent_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_name: string
          category: string
          content: string
          cover_image: string | null
          created_at: string | null
          excerpt: string
          id: string
          published: boolean | null
          published_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_name?: string
          category?: string
          content: string
          cover_image?: string | null
          created_at?: string | null
          excerpt: string
          id?: string
          published?: boolean | null
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_name?: string
          category?: string
          content?: string
          cover_image?: string | null
          created_at?: string | null
          excerpt?: string
          id?: string
          published?: boolean | null
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          category: string
          created_at: string | null
          created_by: string
          description: string | null
          end_time: string | null
          id: string
          location: string | null
          organization_id: string
          start_time: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          all_day?: boolean | null
          category?: string
          created_at?: string | null
          created_by: string
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          organization_id: string
          start_time: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          all_day?: boolean | null
          category?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          organization_id?: string
          start_time?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_add_ons: {
        Row: {
          add_on_id: string
          amount_paid: number
          client_id: string
          created_at: string | null
          id: string
          purchased_at: string | null
          status: string | null
          trip_id: string | null
        }
        Insert: {
          add_on_id: string
          amount_paid: number
          client_id: string
          created_at?: string | null
          id?: string
          purchased_at?: string | null
          status?: string | null
          trip_id?: string | null
        }
        Update: {
          add_on_id?: string
          amount_paid?: number
          client_id?: string
          created_at?: string | null
          id?: string
          purchased_at?: string | null
          status?: string | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_add_ons_add_on_id_fkey"
            columns: ["add_on_id"]
            isOneToOne: false
            referencedRelation: "add_ons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_add_ons_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_add_ons_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      client_referral_events: {
        Row: {
          converted: boolean
          converted_at: string | null
          created_at: string
          id: string
          incentive_id: string | null
          organization_id: string
          proposal_id: string | null
          referral_code: string
          referred_crm_contact_id: string | null
          referrer_client_id: string
          updated_at: string
        }
        Insert: {
          converted?: boolean
          converted_at?: string | null
          created_at?: string
          id?: string
          incentive_id?: string | null
          organization_id: string
          proposal_id?: string | null
          referral_code: string
          referred_crm_contact_id?: string | null
          referrer_client_id: string
          updated_at?: string
        }
        Update: {
          converted?: boolean
          converted_at?: string | null
          created_at?: string
          id?: string
          incentive_id?: string | null
          organization_id?: string
          proposal_id?: string | null
          referral_code?: string
          referred_crm_contact_id?: string | null
          referrer_client_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_referral_events_incentive_id_fkey"
            columns: ["incentive_id"]
            isOneToOne: false
            referencedRelation: "client_referral_incentives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_referral_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_referral_events_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_referral_events_referred_crm_contact_id_fkey"
            columns: ["referred_crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_referral_events_referrer_client_id_fkey"
            columns: ["referrer_client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_referral_incentives: {
        Row: {
          amount_inr: number
          created_at: string
          id: string
          issued_at: string | null
          notes: string | null
          organization_id: string
          referral_code: string
          referrer_client_id: string
          status: string
          tds_applicable: boolean
          updated_at: string
        }
        Insert: {
          amount_inr?: number
          created_at?: string
          id?: string
          issued_at?: string | null
          notes?: string | null
          organization_id: string
          referral_code: string
          referrer_client_id: string
          status?: string
          tds_applicable?: boolean
          updated_at?: string
        }
        Update: {
          amount_inr?: number
          created_at?: string
          id?: string
          issued_at?: string | null
          notes?: string | null
          organization_id?: string
          referral_code?: string
          referrer_client_id?: string
          status?: string
          tds_applicable?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_referral_incentives_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_referral_incentives_referrer_client_id_fkey"
            columns: ["referrer_client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          organization_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      concierge_requests: {
        Row: {
          assigned_to: string | null
          client_id: string
          created_at: string | null
          id: string
          message: string
          response: string | null
          status: string | null
          trip_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          client_id: string
          created_at?: string | null
          id?: string
          message: string
          response?: string | null
          status?: string | null
          trip_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          client_id?: string
          created_at?: string | null
          id?: string
          message?: string
          response?: string | null
          status?: string | null
          trip_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "concierge_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concierge_requests_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_events: {
        Row: {
          created_at: string
          event_metadata: Json
          event_type: string
          id: string
          lead_id: string | null
          organization_id: string
          profile_id: string | null
          trip_id: string | null
        }
        Insert: {
          created_at?: string
          event_metadata?: Json
          event_type: string
          id?: string
          lead_id?: string | null
          organization_id: string
          profile_id?: string | null
          trip_id?: string | null
        }
        Update: {
          created_at?: string
          event_metadata?: Json
          event_type?: string
          id?: string
          lead_id?: string | null
          organization_id?: string
          profile_id?: string | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversion_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_events_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_alert_ack_events: {
        Row: {
          actor_id: string | null
          actor_role: string
          alert_id: string
          event_at: string
          event_type: string
          id: string
          metadata: Json
          organization_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string
          alert_id: string
          event_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          organization_id: string
        }
        Update: {
          actor_id?: string | null
          actor_role?: string
          alert_id?: string
          event_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_alert_ack_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_alert_ack_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_alert_acknowledgments: {
        Row: {
          acknowledged_at: string
          acknowledged_by: string | null
          alert_id: string
          created_at: string
          id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string
          acknowledged_by?: string | null
          alert_id: string
          created_at?: string
          id?: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string
          acknowledged_by?: string | null
          alert_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_alert_acknowledgments_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_alert_acknowledgments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          assigned_to: string | null
          budget_tier: string | null
          closed_at: string | null
          converted_at: string | null
          converted_profile_id: string | null
          created_at: string | null
          created_by: string | null
          departure_month: string | null
          destination: string | null
          duration_days: number | null
          email: string | null
          expected_value: number | null
          full_name: string
          id: string
          last_activity_at: string | null
          lost_reason: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          phone_normalized: string | null
          source: string | null
          stage: string
          travelers: number | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          budget_tier?: string | null
          closed_at?: string | null
          converted_at?: string | null
          converted_profile_id?: string | null
          created_at?: string | null
          created_by?: string | null
          departure_month?: string | null
          destination?: string | null
          duration_days?: number | null
          email?: string | null
          expected_value?: number | null
          full_name: string
          id?: string
          last_activity_at?: string | null
          lost_reason?: string | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          phone_normalized?: string | null
          source?: string | null
          stage?: string
          travelers?: number | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          budget_tier?: string | null
          closed_at?: string | null
          converted_at?: string | null
          converted_profile_id?: string | null
          created_at?: string | null
          created_by?: string | null
          departure_month?: string | null
          destination?: string | null
          duration_days?: number | null
          email?: string | null
          expected_value?: number | null
          full_name?: string
          id?: string
          last_activity_at?: string | null
          lost_reason?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          phone_normalized?: string | null
          source?: string | null
          stage?: string
          travelers?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_converted_profile_id_fkey"
            columns: ["converted_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_task_dismissals: {
        Row: {
          dismissed_at: string
          entity_id: string | null
          id: string
          organization_id: string
          task_id: string
          task_type: string
          user_id: string
        }
        Insert: {
          dismissed_at?: string
          entity_id?: string | null
          id?: string
          organization_id: string
          task_id: string
          task_type: string
          user_id: string
        }
        Update: {
          dismissed_at?: string
          entity_id?: string | null
          id?: string
          organization_id?: string
          task_id?: string
          task_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_task_dismissals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_accounts: {
        Row: {
          created_at: string | null
          external_driver_id: string
          id: string
          is_active: boolean | null
          profile_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          external_driver_id: string
          id?: string
          is_active?: boolean | null
          profile_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          external_driver_id?: string
          id?: string
          is_active?: boolean | null
          profile_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_accounts_external_driver_id_fkey"
            columns: ["external_driver_id"]
            isOneToOne: true
            referencedRelation: "external_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_locations: {
        Row: {
          accuracy: number | null
          driver_id: string | null
          heading: number | null
          id: string
          latitude: number
          longitude: number
          recorded_at: string | null
          speed: number | null
          trip_id: string | null
        }
        Insert: {
          accuracy?: number | null
          driver_id?: string | null
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          recorded_at?: string | null
          speed?: number | null
          trip_id?: string | null
        }
        Update: {
          accuracy?: number | null
          driver_id?: string | null
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string | null
          speed?: number | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_locations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      e_invoice_settings: {
        Row: {
          auto_generate_enabled: boolean
          created_at: string | null
          gstin: string
          id: string
          irp_api_key_encrypted: string | null
          irp_password_encrypted: string | null
          irp_username: string | null
          organization_id: string
          sandbox_mode: boolean
          threshold_amount: number
          updated_at: string | null
        }
        Insert: {
          auto_generate_enabled?: boolean
          created_at?: string | null
          gstin: string
          id?: string
          irp_api_key_encrypted?: string | null
          irp_password_encrypted?: string | null
          irp_username?: string | null
          organization_id: string
          sandbox_mode?: boolean
          threshold_amount?: number
          updated_at?: string | null
        }
        Update: {
          auto_generate_enabled?: boolean
          created_at?: string | null
          gstin?: string
          id?: string
          irp_api_key_encrypted?: string | null
          irp_password_encrypted?: string | null
          irp_username?: string | null
          organization_id?: string
          sandbox_mode?: boolean
          threshold_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "e_invoice_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_receipts: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          ocr_confidence: number | null
          ocr_extracted_amount: number | null
          ocr_raw_response: Json | null
          organization_id: string
          receipt_url: string
          trip_service_cost_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          ocr_confidence?: number | null
          ocr_extracted_amount?: number | null
          ocr_raw_response?: Json | null
          organization_id: string
          receipt_url: string
          trip_service_cost_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          ocr_confidence?: number | null
          ocr_extracted_amount?: number | null
          ocr_raw_response?: Json | null
          organization_id?: string
          receipt_url?: string
          trip_service_cost_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_receipts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_receipts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_receipts_trip_service_cost_id_fkey"
            columns: ["trip_service_cost_id"]
            isOneToOne: false
            referencedRelation: "trip_service_costs"
            referencedColumns: ["id"]
          },
        ]
      }
      external_drivers: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          is_active: boolean | null
          languages: string[] | null
          notes: string | null
          organization_id: string
          phone: string
          photo_url: string | null
          updated_at: string | null
          vehicle_capacity: number | null
          vehicle_plate: string | null
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          languages?: string[] | null
          notes?: string | null
          organization_id: string
          phone: string
          photo_url?: string | null
          updated_at?: string | null
          vehicle_capacity?: number | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          languages?: string[] | null
          notes?: string | null
          organization_id?: string
          phone?: string
          photo_url?: string | null
          updated_at?: string | null
          vehicle_capacity?: number | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_drivers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      geocoding_cache: {
        Row: {
          access_count: number
          confidence: number | null
          created_at: string
          formatted_address: string
          id: string
          last_accessed_at: string
          latitude: number
          location_query: string
          longitude: number
          provider: string
        }
        Insert: {
          access_count?: number
          confidence?: number | null
          created_at?: string
          formatted_address: string
          id?: string
          last_accessed_at?: string
          latitude: number
          location_query: string
          longitude: number
          provider?: string
        }
        Update: {
          access_count?: number
          confidence?: number | null
          created_at?: string
          formatted_address?: string
          id?: string
          last_accessed_at?: string
          latitude?: number
          location_query?: string
          longitude?: number
          provider?: string
        }
        Relationships: []
      }
      geocoding_usage: {
        Row: {
          api_calls: number
          cache_hits: number
          created_at: string
          id: string
          last_api_call_at: string | null
          limit_reached: boolean
          limit_threshold: number
          month_year: string
          total_requests: number
          updated_at: string
        }
        Insert: {
          api_calls?: number
          cache_hits?: number
          created_at?: string
          id?: string
          last_api_call_at?: string | null
          limit_reached?: boolean
          limit_threshold?: number
          month_year: string
          total_requests?: number
          updated_at?: string
        }
        Update: {
          api_calls?: number
          cache_hits?: number
          created_at?: string
          id?: string
          last_api_call_at?: string | null
          limit_reached?: boolean
          limit_threshold?: number
          month_year?: string
          total_requests?: number
          updated_at?: string
        }
        Relationships: []
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          currency: string
          id: string
          invoice_id: string
          method: string | null
          notes: string | null
          organization_id: string
          payment_date: string
          reference: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          currency?: string
          id?: string
          invoice_id: string
          method?: string | null
          notes?: string | null
          organization_id: string
          payment_date?: string
          reference?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          currency?: string
          id?: string
          invoice_id?: string
          method?: string | null
          notes?: string | null
          organization_id?: string
          payment_date?: string
          reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          balance_amount: number
          cgst: number | null
          client_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string
          due_date: string | null
          e_invoice_acknowledged_at: string | null
          e_invoice_cancelled_at: string | null
          e_invoice_error: string | null
          e_invoice_generated_at: string | null
          e_invoice_json: Json | null
          e_invoice_status: string | null
          gstin: string | null
          id: string
          igst: number | null
          invoice_number: string
          irn: string | null
          issued_at: string | null
          metadata: Json | null
          organization_id: string
          paid_amount: number
          paid_at: string | null
          place_of_supply: string | null
          qr_code_data: string | null
          razorpay_invoice_id: string | null
          razorpay_payment_id: string | null
          sac_code: string | null
          sgst: number | null
          status: string
          subtotal: number | null
          subtotal_amount: number
          tax_amount: number
          tds_amount: number | null
          total_amount: number
          trip_id: string | null
          updated_at: string | null
        }
        Insert: {
          balance_amount?: number
          cgst?: number | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          due_date?: string | null
          e_invoice_acknowledged_at?: string | null
          e_invoice_cancelled_at?: string | null
          e_invoice_error?: string | null
          e_invoice_generated_at?: string | null
          e_invoice_json?: Json | null
          e_invoice_status?: string | null
          gstin?: string | null
          id?: string
          igst?: number | null
          invoice_number: string
          irn?: string | null
          issued_at?: string | null
          metadata?: Json | null
          organization_id: string
          paid_amount?: number
          paid_at?: string | null
          place_of_supply?: string | null
          qr_code_data?: string | null
          razorpay_invoice_id?: string | null
          razorpay_payment_id?: string | null
          sac_code?: string | null
          sgst?: number | null
          status?: string
          subtotal?: number | null
          subtotal_amount?: number
          tax_amount?: number
          tds_amount?: number | null
          total_amount?: number
          trip_id?: string | null
          updated_at?: string | null
        }
        Update: {
          balance_amount?: number
          cgst?: number | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          due_date?: string | null
          e_invoice_acknowledged_at?: string | null
          e_invoice_cancelled_at?: string | null
          e_invoice_error?: string | null
          e_invoice_generated_at?: string | null
          e_invoice_json?: Json | null
          e_invoice_status?: string | null
          gstin?: string | null
          id?: string
          igst?: number | null
          invoice_number?: string
          irn?: string | null
          issued_at?: string | null
          metadata?: Json | null
          organization_id?: string
          paid_amount?: number
          paid_at?: string | null
          place_of_supply?: string | null
          qr_code_data?: string | null
          razorpay_invoice_id?: string | null
          razorpay_payment_id?: string | null
          sac_code?: string | null
          sgst?: number | null
          status?: string
          subtotal?: number | null
          subtotal_amount?: number
          tax_amount?: number
          tds_amount?: number | null
          total_amount?: number
          trip_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      itineraries: {
        Row: {
          budget: string | null
          client_id: string | null
          created_at: string | null
          destination: string
          duration_days: number | null
          id: string
          interests: string[] | null
          organization_id: string | null
          raw_data: Json
          summary: string | null
          template_id: string | null
          trip_title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          budget?: string | null
          client_id?: string | null
          created_at?: string | null
          destination: string
          duration_days?: number | null
          id?: string
          interests?: string[] | null
          organization_id?: string | null
          raw_data: Json
          summary?: string | null
          template_id?: string | null
          trip_title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          budget?: string | null
          client_id?: string | null
          created_at?: string | null
          destination?: string
          duration_days?: number | null
          id?: string
          interests?: string[] | null
          organization_id?: string | null
          raw_data?: Json
          summary?: string | null
          template_id?: string | null
          trip_title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itineraries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itineraries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itineraries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_cache: {
        Row: {
          budget: string | null
          cache_key: string
          created_at: string | null
          created_by: string | null
          destination: string
          duration_days: number
          expires_at: string | null
          generation_source: string | null
          id: string
          interests: string[] | null
          itinerary_data: Json
          last_used_at: string | null
          quality_score: number | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          budget?: string | null
          cache_key: string
          created_at?: string | null
          created_by?: string | null
          destination: string
          duration_days: number
          expires_at?: string | null
          generation_source?: string | null
          id?: string
          interests?: string[] | null
          itinerary_data: Json
          last_used_at?: string | null
          quality_score?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          budget?: string | null
          cache_key?: string
          created_at?: string | null
          created_by?: string | null
          destination?: string
          duration_days?: number
          expires_at?: string | null
          generation_source?: string | null
          id?: string
          interests?: string[] | null
          itinerary_data?: Json
          last_used_at?: string | null
          quality_score?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      itinerary_cache_analytics: {
        Row: {
          api_call_avoided: boolean | null
          cache_id: string | null
          created_at: string | null
          event_type: string
          id: string
          organization_id: string | null
          query_budget: string | null
          query_days: number | null
          query_destination: string | null
          query_interests: string[] | null
          response_time_ms: number | null
          user_id: string | null
        }
        Insert: {
          api_call_avoided?: boolean | null
          cache_id?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          organization_id?: string | null
          query_budget?: string | null
          query_days?: number | null
          query_destination?: string | null
          query_interests?: string[] | null
          response_time_ms?: number | null
          user_id?: string | null
        }
        Update: {
          api_call_avoided?: boolean | null
          cache_id?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          organization_id?: string | null
          query_budget?: string | null
          query_days?: number | null
          query_destination?: string | null
          query_interests?: string[] | null
          response_time_ms?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_cache_analytics_cache_id_fkey"
            columns: ["cache_id"]
            isOneToOne: false
            referencedRelation: "itinerary_cache"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_cache_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_embeddings: {
        Row: {
          created_at: string | null
          destination: string
          duration_days: number
          embedding: string | null
          embedding_model: string | null
          embedding_v2: string | null
          embedding_version: number | null
          id: string
          itinerary_data: Json
          query_text: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          destination: string
          duration_days: number
          embedding?: string | null
          embedding_model?: string | null
          embedding_v2?: string | null
          embedding_version?: number | null
          id?: string
          itinerary_data: Json
          query_text: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          destination?: string
          duration_days?: number
          embedding?: string | null
          embedding_model?: string | null
          embedding_v2?: string | null
          embedding_version?: number | null
          id?: string
          itinerary_data?: Json
          query_text?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      itinerary_templates: {
        Row: {
          budget_range: string
          created_at: string
          description: string | null
          destination: string
          duration_days: number
          id: string
          is_active: boolean
          organization_id: string
          published_by_org_id: string
          rating_avg: number | null
          rating_count: number
          template_data: Json
          theme: string
          title: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          budget_range: string
          created_at?: string
          description?: string | null
          destination: string
          duration_days: number
          id?: string
          is_active?: boolean
          organization_id: string
          published_by_org_id: string
          rating_avg?: number | null
          rating_count?: number
          template_data: Json
          theme: string
          title: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          budget_range?: string
          created_at?: string
          description?: string | null
          destination?: string
          duration_days?: number
          id?: string
          is_active?: boolean
          organization_id?: string
          published_by_org_id?: string
          rating_avg?: number | null
          rating_count?: number
          template_data?: Json
          theme?: string
          title?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_templates_published_by_org_id_fkey"
            columns: ["published_by_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_events: {
        Row: {
          created_at: string
          created_by: string | null
          event_type: string
          from_stage: string | null
          id: string
          lead_id: string
          metadata: Json
          note: string | null
          organization_id: string
          to_stage: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_type: string
          from_stage?: string | null
          id?: string
          lead_id: string
          metadata?: Json
          note?: string | null
          organization_id: string
          to_stage?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_type?: string
          from_stage?: string | null
          id?: string
          lead_id?: string
          metadata?: Json
          note?: string | null
          organization_id?: string
          to_stage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_inquiries: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          read_at: string | null
          receiver_org_id: string
          sender_org_id: string
          status: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          read_at?: string | null
          receiver_org_id: string
          sender_org_id: string
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          read_at?: string | null
          receiver_org_id?: string
          sender_org_id?: string
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_inquiries_receiver_org_id_fkey"
            columns: ["receiver_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_inquiries_sender_org_id_fkey"
            columns: ["sender_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listing_subscriptions: {
        Row: {
          amount_paise: number
          boost_score: number
          cancelled_at: string | null
          created_at: string
          created_by: string | null
          currency: string
          current_period_end: string | null
          id: string
          marketplace_profile_id: string | null
          organization_id: string
          plan_id: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_paise: number
          boost_score?: number
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          current_period_end?: string | null
          id?: string
          marketplace_profile_id?: string | null
          organization_id: string
          plan_id: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_paise?: number
          boost_score?: number
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          current_period_end?: string | null
          id?: string
          marketplace_profile_id?: string | null
          organization_id?: string
          plan_id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listing_subscriptions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listing_subscriptions_marketplace_profile_id_fkey"
            columns: ["marketplace_profile_id"]
            isOneToOne: false
            referencedRelation: "marketplace_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listing_subscriptions_marketplace_profile_id_fkey"
            columns: ["marketplace_profile_id"]
            isOneToOne: false
            referencedRelation: "public_marketplace_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listing_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_profile_views: {
        Row: {
          id: string
          profile_id: string | null
          source: string | null
          viewed_at: string | null
          viewer_org_id: string | null
        }
        Insert: {
          id?: string
          profile_id?: string | null
          source?: string | null
          viewed_at?: string | null
          viewer_org_id?: string | null
        }
        Update: {
          id?: string
          profile_id?: string | null
          source?: string | null
          viewed_at?: string | null
          viewer_org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_profile_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "marketplace_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_profile_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_marketplace_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_profile_views_viewer_org_id_fkey"
            columns: ["viewer_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_profiles: {
        Row: {
          boost_score: number
          compliance_documents: Json | null
          created_at: string | null
          description: string | null
          featured_until: string | null
          gallery_urls: Json | null
          id: string
          is_featured: boolean
          is_verified: boolean | null
          listing_quality_score: number | null
          listing_tier: string
          margin_rate: number | null
          organization_id: string
          rate_card: Json | null
          search_vector: unknown
          service_regions: Json | null
          specialties: Json | null
          updated_at: string | null
          verification_level: string | null
          verification_notes: string | null
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          boost_score?: number
          compliance_documents?: Json | null
          created_at?: string | null
          description?: string | null
          featured_until?: string | null
          gallery_urls?: Json | null
          id?: string
          is_featured?: boolean
          is_verified?: boolean | null
          listing_quality_score?: number | null
          listing_tier?: string
          margin_rate?: number | null
          organization_id: string
          rate_card?: Json | null
          search_vector?: unknown
          service_regions?: Json | null
          specialties?: Json | null
          updated_at?: string | null
          verification_level?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          boost_score?: number
          compliance_documents?: Json | null
          created_at?: string | null
          description?: string | null
          featured_until?: string | null
          gallery_urls?: Json | null
          id?: string
          is_featured?: boolean
          is_verified?: boolean | null
          listing_quality_score?: number | null
          listing_tier?: string
          margin_rate?: number | null
          organization_id?: string
          rate_card?: Json | null
          search_vector?: unknown
          service_regions?: Json | null
          specialties?: Json | null
          updated_at?: string | null
          verification_level?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number | null
          reviewer_org_id: string
          target_org_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          reviewer_org_id: string
          target_org_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          reviewer_org_id?: string
          target_org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_reviews_reviewer_org_id_fkey"
            columns: ["reviewer_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_reviews_target_org_id_fkey"
            columns: ["target_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_overhead_expenses: {
        Row: {
          amount: number | null
          category: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          id: string
          month_start: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          category: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          month_start: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          month_start?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monthly_overhead_expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_overhead_expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_dead_letters: {
        Row: {
          attempts: number
          created_at: string
          error_message: string | null
          failed_channels: string[]
          id: string
          notification_type: string
          organization_id: string | null
          payload: Json
          queue_id: string
          recipient_phone: string | null
          recipient_type: string | null
          trip_id: string | null
          user_id: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          failed_channels?: string[]
          id?: string
          notification_type: string
          organization_id?: string | null
          payload?: Json
          queue_id: string
          recipient_phone?: string | null
          recipient_type?: string | null
          trip_id?: string | null
          user_id?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          failed_channels?: string[]
          id?: string
          notification_type?: string
          organization_id?: string | null
          payload?: Json
          queue_id?: string
          recipient_phone?: string | null
          recipient_type?: string | null
          trip_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_dead_letters_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "notification_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_delivery_status: {
        Row: {
          attempt_number: number
          channel: string
          created_at: string | null
          error_message: string | null
          failed_at: string | null
          id: string
          metadata: Json | null
          notification_type: string | null
          organization_id: string | null
          provider: string | null
          provider_message_id: string | null
          queue_id: string | null
          recipient_phone: string | null
          recipient_type: string | null
          sent_at: string | null
          status: string
          trip_id: string | null
          user_id: string | null
        }
        Insert: {
          attempt_number?: number
          channel: string
          created_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string | null
          organization_id?: string | null
          provider?: string | null
          provider_message_id?: string | null
          queue_id?: string | null
          recipient_phone?: string | null
          recipient_type?: string | null
          sent_at?: string | null
          status: string
          trip_id?: string | null
          user_id?: string | null
        }
        Update: {
          attempt_number?: number
          channel?: string
          created_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string | null
          organization_id?: string | null
          provider?: string | null
          provider_message_id?: string | null
          queue_id?: string | null
          recipient_phone?: string | null
          recipient_type?: string | null
          sent_at?: string | null
          status?: string
          trip_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_delivery_status_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_delivery_status_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "notification_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_delivery_status_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_delivery_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          body: string | null
          created_at: string | null
          error_message: string | null
          external_id: string | null
          id: string
          notification_type: string
          organization_id: string | null
          recipient_id: string | null
          recipient_phone: string | null
          recipient_type: string | null
          sent_at: string | null
          status: string | null
          title: string | null
          trip_id: string | null
          updated_at: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          notification_type: string
          organization_id?: string | null
          recipient_id?: string | null
          recipient_phone?: string | null
          recipient_type?: string | null
          sent_at?: string | null
          status?: string | null
          title?: string | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          notification_type?: string
          organization_id?: string | null
          recipient_id?: string | null
          recipient_phone?: string | null
          recipient_type?: string | null
          sent_at?: string | null
          status?: string | null
          title?: string | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_queue: {
        Row: {
          attempts: number | null
          channel_preference: string | null
          created_at: string | null
          error_message: string | null
          id: string
          idempotency_key: string | null
          last_attempt_at: string | null
          notification_type: string
          payload: Json
          processed_at: string | null
          recipient_email: string | null
          recipient_phone: string | null
          recipient_type: string | null
          scheduled_for: string
          status: string | null
          trip_id: string | null
          user_id: string | null
        }
        Insert: {
          attempts?: number | null
          channel_preference?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          last_attempt_at?: string | null
          notification_type: string
          payload?: Json
          processed_at?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          recipient_type?: string | null
          scheduled_for: string
          status?: string | null
          trip_id?: string | null
          user_id?: string | null
        }
        Update: {
          attempts?: number | null
          channel_preference?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          last_attempt_at?: string | null
          notification_type?: string
          payload?: Json
          processed_at?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          recipient_type?: string | null
          scheduled_for?: string
          status?: string | null
          trip_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_scorecards: {
        Row: {
          created_at: string
          emailed_at: string | null
          id: string
          last_error: string | null
          month_key: string
          organization_id: string
          payload: Json
          pdf_generated_at: string | null
          score: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          emailed_at?: string | null
          id?: string
          last_error?: string | null
          month_key: string
          organization_id: string
          payload?: Json
          pdf_generated_at?: string | null
          score?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          emailed_at?: string | null
          id?: string
          last_error?: string | null
          month_key?: string
          organization_id?: string
          payload?: Json
          pdf_generated_at?: string | null
          score?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operator_scorecards_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_unavailability: {
        Row: {
          created_at: string
          end_date: string
          id: string
          organization_id: string
          reason: string | null
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          organization_id: string
          reason?: string | null
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          organization_id?: string
          reason?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "operator_unavailability_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_ai_usage: {
        Row: {
          ai_requests: number
          cache_hits: number
          created_at: string
          direct_execution_count: number
          estimated_cost_usd: number
          fallback_count: number
          id: string
          month_start: string
          organization_id: string
          rag_hits: number
          token_count_input: number
          token_count_output: number
          updated_at: string
        }
        Insert: {
          ai_requests?: number
          cache_hits?: number
          created_at?: string
          direct_execution_count?: number
          estimated_cost_usd?: number
          fallback_count?: number
          id?: string
          month_start: string
          organization_id: string
          rag_hits?: number
          token_count_input?: number
          token_count_output?: number
          updated_at?: string
        }
        Update: {
          ai_requests?: number
          cache_hits?: number
          created_at?: string
          direct_execution_count?: number
          estimated_cost_usd?: number
          fallback_count?: number
          id?: string
          month_start?: string
          organization_id?: string
          rag_hits?: number
          token_count_input?: number
          token_count_output?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_ai_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          google_places_enabled: boolean | null
          organization_id: string
          tripadvisor_connected_at: string | null
          tripadvisor_location_id: string | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          google_places_enabled?: boolean | null
          organization_id: string
          tripadvisor_connected_at?: string | null
          tripadvisor_location_id?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          google_places_enabled?: boolean | null
          organization_id?: string
          tripadvisor_connected_at?: string | null
          tripadvisor_location_id?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          ai_monthly_request_cap: number | null
          ai_monthly_spend_cap_usd: number | null
          billing_address: Json | null
          billing_address_line1: string | null
          billing_address_line2: string | null
          billing_city: string | null
          billing_pincode: string | null
          billing_state: string | null
          created_at: string | null
          gstin: string | null
          id: string
          legal_name: string | null
          logo_url: string | null
          name: string
          owner_id: string | null
          primary_color: string | null
          razorpay_customer_id: string | null
          slug: string
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          ai_monthly_request_cap?: number | null
          ai_monthly_spend_cap_usd?: number | null
          billing_address?: Json | null
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_pincode?: string | null
          billing_state?: string | null
          created_at?: string | null
          gstin?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name: string
          owner_id?: string | null
          primary_color?: string | null
          razorpay_customer_id?: string | null
          slug: string
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_monthly_request_cap?: number | null
          ai_monthly_spend_cap_usd?: number | null
          billing_address?: Json | null
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_pincode?: string | null
          billing_state?: string | null
          created_at?: string | null
          gstin?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          primary_color?: string | null
          razorpay_customer_id?: string | null
          slug?: string
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          error_code: string | null
          error_description: string | null
          event_type: string
          external_id: string | null
          id: string
          invoice_id: string | null
          metadata: Json | null
          organization_id: string | null
          payment_link_id: string | null
          status: string | null
          subscription_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          error_code?: string | null
          error_description?: string | null
          event_type: string
          external_id?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          organization_id?: string | null
          payment_link_id?: string | null
          status?: string | null
          subscription_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          error_code?: string | null
          error_description?: string | null
          event_type?: string
          external_id?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          organization_id?: string | null
          payment_link_id?: string | null
          status?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_events_payment_link_id_fkey"
            columns: ["payment_link_id"]
            isOneToOne: false
            referencedRelation: "payment_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_links: {
        Row: {
          amount_paise: number
          booking_id: string | null
          client_email: string | null
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          expires_at: string | null
          id: string
          organization_id: string
          paid_at: string | null
          proposal_id: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          reminder_sent_at: string | null
          status: string
          token: string
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          amount_paise: number
          booking_id?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          organization_id: string
          paid_at?: string | null
          proposal_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          reminder_sent_at?: string | null
          status?: string
          token?: string
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          amount_paise?: number
          booking_id?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          organization_id?: string
          paid_at?: string | null
          proposal_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          reminder_sent_at?: string | null
          status?: string
          token?: string
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_links_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_links_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          card_brand: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          last_four: string | null
          metadata: Json | null
          organization_id: string
          provider: string | null
          token: string | null
          type: string
          updated_at: string | null
          upi_id: string | null
        }
        Insert: {
          card_brand?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_four?: string | null
          metadata?: Json | null
          organization_id: string
          provider?: string | null
          token?: string | null
          type: string
          updated_at?: string | null
          upi_id?: string | null
        }
        Update: {
          card_brand?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_four?: string | null
          metadata?: Json | null
          organization_id?: string
          provider?: string | null
          token?: string | null
          type?: string
          updated_at?: string | null
          upi_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_extraction_queue: {
        Row: {
          attempts: number
          created_at: string
          id: string
          last_attempt_at: string | null
          last_error: string | null
          max_attempts: number
          pdf_import_id: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          max_attempts?: number
          pdf_import_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          max_attempts?: number
          pdf_import_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_extraction_queue_pdf_import_id_fkey"
            columns: ["pdf_import_id"]
            isOneToOne: false
            referencedRelation: "pdf_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_imports: {
        Row: {
          created_at: string
          created_by: string | null
          extracted_data: Json | null
          extraction_confidence: number | null
          extraction_error: string | null
          file_hash: string | null
          file_name: string
          file_size_bytes: number | null
          file_url: string
          id: string
          organization_id: string
          published_at: string | null
          published_template_id: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          extracted_data?: Json | null
          extraction_confidence?: number | null
          extraction_error?: string | null
          file_hash?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_url: string
          id?: string
          organization_id: string
          published_at?: string | null
          published_template_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          extracted_data?: Json | null
          extraction_confidence?: number | null
          extraction_error?: string | null
          file_hash?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          organization_id?: string
          published_at?: string | null
          published_template_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_imports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_imports_published_template_id_fkey"
            columns: ["published_template_id"]
            isOneToOne: false
            referencedRelation: "tour_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_announcements: {
        Row: {
          announcement_type: string
          body: string
          created_at: string
          delivery_channels: string[]
          id: string
          recipient_count: number
          scheduled_at: string | null
          sent_at: string | null
          sent_by: string | null
          status: string
          target_org_ids: string[]
          target_segment: string
          title: string
          updated_at: string
        }
        Insert: {
          announcement_type?: string
          body: string
          created_at?: string
          delivery_channels?: string[]
          id?: string
          recipient_count?: number
          scheduled_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          target_org_ids?: string[]
          target_segment?: string
          title: string
          updated_at?: string
        }
        Update: {
          announcement_type?: string
          body?: string
          created_at?: string
          delivery_channels?: string[]
          id?: string
          recipient_count?: number
          scheduled_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          target_org_ids?: string[]
          target_segment?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_announcements_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_audit_log: {
        Row: {
          action: string
          actor_id: string
          category: string
          created_at: string
          details: Json
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id: string
          category: string
          created_at?: string
          details?: Json
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          category?: string
          created_at?: string
          details?: Json
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          created_at: string
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_embeddings: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          embedding_model: string | null
          embedding_v2: string | null
          embedding_version: number | null
          id: string
          metadata: Json | null
          source_file: string | null
          source_type: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          embedding_model?: string | null
          embedding_v2?: string | null
          embedding_version?: number | null
          id?: string
          metadata?: Json | null
          source_file?: string | null
          source_type?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          embedding_model?: string | null
          embedding_v2?: string | null
          embedding_version?: number | null
          id?: string
          metadata?: Json | null
          source_file?: string | null
          source_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pricing_feedback: {
        Row: {
          action: string
          comparable_trips_count: number
          confidence_level: string
          created_at: string
          created_by: string | null
          destination: string
          duration_days: number
          final_price_paise: number | null
          id: string
          organization_id: string
          package_tier: string | null
          pax: number
          proposal_id: string | null
          season_month: number | null
          suggested_price_paise: number
          suggestion_id: string
          updated_at: string
        }
        Insert: {
          action: string
          comparable_trips_count?: number
          confidence_level: string
          created_at?: string
          created_by?: string | null
          destination: string
          duration_days: number
          final_price_paise?: number | null
          id?: string
          organization_id: string
          package_tier?: string | null
          pax: number
          proposal_id?: string | null
          season_month?: number | null
          suggested_price_paise: number
          suggestion_id: string
          updated_at?: string
        }
        Update: {
          action?: string
          comparable_trips_count?: number
          confidence_level?: string
          created_at?: string
          created_by?: string | null
          destination?: string
          duration_days?: number
          final_price_paise?: number | null
          id?: string
          organization_id?: string
          package_tier?: string | null
          pax?: number
          proposal_id?: string | null
          season_month?: number | null
          suggested_price_paise?: number
          suggestion_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_feedback_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_feedback_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_feedback_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          billing_address: string | null
          billing_city: string | null
          billing_pincode: string | null
          billing_state: string | null
          bio: string | null
          budget_max: number | null
          budget_min: number | null
          client_info: Json | null
          client_tag: string | null
          contributor_badge_tier: string | null
          created_at: string | null
          dietary_requirements: string[] | null
          driver_info: Json | null
          email: string | null
          full_name: string | null
          gstin: string | null
          home_airport: string | null
          id: string
          interests: string[] | null
          last_contacted_at: string | null
          lead_status: string | null
          lifecycle_stage: string | null
          marketing_opt_in: boolean | null
          mobility_needs: string | null
          notes: string | null
          onboarding_step: number | null
          organization_id: string | null
          phase_notifications_enabled: boolean
          phone: string | null
          phone_normalized: string | null
          phone_whatsapp: string | null
          preferred_destination: string | null
          referral_code: string | null
          referral_source: string | null
          role: string | null
          source_channel: string | null
          travel_style: string | null
          travelers_count: number | null
          updated_at: string | null
          welcome_email_sent_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          billing_address?: string | null
          billing_city?: string | null
          billing_pincode?: string | null
          billing_state?: string | null
          bio?: string | null
          budget_max?: number | null
          budget_min?: number | null
          client_info?: Json | null
          client_tag?: string | null
          contributor_badge_tier?: string | null
          created_at?: string | null
          dietary_requirements?: string[] | null
          driver_info?: Json | null
          email?: string | null
          full_name?: string | null
          gstin?: string | null
          home_airport?: string | null
          id: string
          interests?: string[] | null
          last_contacted_at?: string | null
          lead_status?: string | null
          lifecycle_stage?: string | null
          marketing_opt_in?: boolean | null
          mobility_needs?: string | null
          notes?: string | null
          onboarding_step?: number | null
          organization_id?: string | null
          phase_notifications_enabled?: boolean
          phone?: string | null
          phone_normalized?: string | null
          phone_whatsapp?: string | null
          preferred_destination?: string | null
          referral_code?: string | null
          referral_source?: string | null
          role?: string | null
          source_channel?: string | null
          travel_style?: string | null
          travelers_count?: number | null
          updated_at?: string | null
          welcome_email_sent_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          billing_address?: string | null
          billing_city?: string | null
          billing_pincode?: string | null
          billing_state?: string | null
          bio?: string | null
          budget_max?: number | null
          budget_min?: number | null
          client_info?: Json | null
          client_tag?: string | null
          contributor_badge_tier?: string | null
          created_at?: string | null
          dietary_requirements?: string[] | null
          driver_info?: Json | null
          email?: string | null
          full_name?: string | null
          gstin?: string | null
          home_airport?: string | null
          id?: string
          interests?: string[] | null
          last_contacted_at?: string | null
          lead_status?: string | null
          lifecycle_stage?: string | null
          marketing_opt_in?: boolean | null
          mobility_needs?: string | null
          notes?: string | null
          onboarding_step?: number | null
          organization_id?: string | null
          phase_notifications_enabled?: boolean
          phone?: string | null
          phone_normalized?: string | null
          phone_whatsapp?: string | null
          preferred_destination?: string | null
          referral_code?: string | null
          referral_source?: string | null
          role?: string | null
          source_channel?: string | null
          travel_style?: string | null
          travelers_count?: number | null
          updated_at?: string | null
          welcome_email_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_accommodations: {
        Row: {
          amenities: string[] | null
          check_in_date: string | null
          check_out_date: string | null
          hotel_name: string
          id: string
          image_url: string | null
          is_selected: boolean | null
          price_per_night: number | null
          proposal_day_id: string
          room_type: string | null
          star_rating: number | null
        }
        Insert: {
          amenities?: string[] | null
          check_in_date?: string | null
          check_out_date?: string | null
          hotel_name: string
          id?: string
          image_url?: string | null
          is_selected?: boolean | null
          price_per_night?: number | null
          proposal_day_id: string
          room_type?: string | null
          star_rating?: number | null
        }
        Update: {
          amenities?: string[] | null
          check_in_date?: string | null
          check_out_date?: string | null
          hotel_name?: string
          id?: string
          image_url?: string | null
          is_selected?: boolean | null
          price_per_night?: number | null
          proposal_day_id?: string
          room_type?: string | null
          star_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_accommodations_proposal_day_id_fkey"
            columns: ["proposal_day_id"]
            isOneToOne: false
            referencedRelation: "proposal_days"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_activities: {
        Row: {
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_optional: boolean | null
          is_premium: boolean | null
          is_selected: boolean | null
          location: string | null
          price: number | null
          proposal_day_id: string
          time: string | null
          title: string
        }
        Insert: {
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_optional?: boolean | null
          is_premium?: boolean | null
          is_selected?: boolean | null
          location?: string | null
          price?: number | null
          proposal_day_id: string
          time?: string | null
          title: string
        }
        Update: {
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_optional?: boolean | null
          is_premium?: boolean | null
          is_selected?: boolean | null
          location?: string | null
          price?: number | null
          proposal_day_id?: string
          time?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_activities_proposal_day_id_fkey"
            columns: ["proposal_day_id"]
            isOneToOne: false
            referencedRelation: "proposal_days"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_add_ons: {
        Row: {
          add_on_id: string | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_selected: boolean
          name: string
          proposal_id: string
          quantity: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          add_on_id?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_selected?: boolean
          name: string
          proposal_id: string
          quantity?: number
          unit_price?: number
          updated_at?: string | null
        }
        Update: {
          add_on_id?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_selected?: boolean
          name?: string
          proposal_id?: string
          quantity?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_add_ons_add_on_id_fkey"
            columns: ["add_on_id"]
            isOneToOne: false
            referencedRelation: "add_ons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_add_ons_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_comments: {
        Row: {
          author_email: string | null
          author_name: string
          comment: string
          created_at: string | null
          id: string
          is_resolved: boolean | null
          proposal_activity_id: string | null
          proposal_day_id: string | null
          proposal_id: string
        }
        Insert: {
          author_email?: string | null
          author_name: string
          comment: string
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          proposal_activity_id?: string | null
          proposal_day_id?: string | null
          proposal_id: string
        }
        Update: {
          author_email?: string | null
          author_name?: string
          comment?: string
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          proposal_activity_id?: string | null
          proposal_day_id?: string | null
          proposal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_comments_proposal_activity_id_fkey"
            columns: ["proposal_activity_id"]
            isOneToOne: false
            referencedRelation: "proposal_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_comments_proposal_day_id_fkey"
            columns: ["proposal_day_id"]
            isOneToOne: false
            referencedRelation: "proposal_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_comments_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_days: {
        Row: {
          day_number: number
          description: string | null
          id: string
          is_approved: boolean | null
          proposal_id: string
          title: string | null
        }
        Insert: {
          day_number: number
          description?: string | null
          id?: string
          is_approved?: boolean | null
          proposal_id: string
          title?: string | null
        }
        Update: {
          day_number?: number
          description?: string | null
          id?: string
          is_approved?: boolean | null
          proposal_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_days_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_payment_milestones: {
        Row: {
          amount_fixed: number | null
          amount_percent: number | null
          created_at: string
          due_date: string
          id: string
          label: string
          organization_id: string
          paid_at: string | null
          plan_id: string
          proposal_id: string
          razorpay_payment_link_id: string | null
          razorpay_payment_link_url: string | null
          sent_at: string | null
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          amount_fixed?: number | null
          amount_percent?: number | null
          created_at?: string
          due_date: string
          id?: string
          label: string
          organization_id: string
          paid_at?: string | null
          plan_id: string
          proposal_id: string
          razorpay_payment_link_id?: string | null
          razorpay_payment_link_url?: string | null
          sent_at?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          amount_fixed?: number | null
          amount_percent?: number | null
          created_at?: string
          due_date?: string
          id?: string
          label?: string
          organization_id?: string
          paid_at?: string | null
          plan_id?: string
          proposal_id?: string
          razorpay_payment_link_id?: string | null
          razorpay_payment_link_url?: string | null
          sent_at?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_payment_milestones_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_payment_milestones_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "proposal_payment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_payment_milestones_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_payment_plans: {
        Row: {
          created_at: string
          deposit_percent: number
          id: string
          notes: string | null
          organization_id: string
          proposal_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deposit_percent?: number
          id?: string
          notes?: string | null
          organization_id: string
          proposal_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deposit_percent?: number
          id?: string
          notes?: string | null
          organization_id?: string
          proposal_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_payment_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_payment_plans_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: true
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_versions: {
        Row: {
          change_summary: string | null
          created_at: string | null
          created_by: string | null
          id: string
          proposal_id: string
          snapshot: Json
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          proposal_id: string
          snapshot: Json
          version_number: number
        }
        Update: {
          change_summary?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          proposal_id?: string
          snapshot?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_versions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          client_id: string
          client_selected_price: number | null
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          organization_id: string
          package_tier: string | null
          share_token: string
          status: string | null
          template_id: string | null
          tier_pricing: Json
          title: string
          total_price: number | null
          trip_id: string | null
          updated_at: string | null
          version: number | null
          viewed_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          client_id: string
          client_selected_price?: number | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          organization_id: string
          package_tier?: string | null
          share_token: string
          status?: string | null
          template_id?: string | null
          tier_pricing?: Json
          title: string
          total_price?: number | null
          trip_id?: string | null
          updated_at?: string | null
          version?: number | null
          viewed_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          client_id?: string
          client_selected_price?: number | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          organization_id?: string
          package_tier?: string | null
          share_token?: string
          status?: string | null
          template_id?: string | null
          tier_pricing?: Json
          title?: string
          total_price?: number | null
          trip_id?: string | null
          updated_at?: string | null
          version?: number | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "tour_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string | null
          fcm_token: string
          id: string
          is_active: boolean | null
          platform: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          fcm_token: string
          id?: string
          is_active?: boolean | null
          platform?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          fcm_token?: string
          id?: string
          is_active?: boolean | null
          platform?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_organization_id: string
          referrer_profile_id: string
          reward_granted: boolean
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_organization_id: string
          referrer_profile_id: string
          reward_granted?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_organization_id?: string
          referrer_profile_id?: string
          reward_granted?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_organization_id_fkey"
            columns: ["referred_organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_profile_id_fkey"
            columns: ["referrer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reputation_brand_voice: {
        Row: {
          auto_respond_min_rating: number | null
          auto_respond_positive: boolean | null
          avoid_phrases: string[] | null
          created_at: string | null
          escalation_threshold: number | null
          id: string
          key_phrases: string[] | null
          language_preference: string | null
          organization_id: string
          owner_name: string | null
          sample_responses: string[] | null
          sign_off: string | null
          tone: string
          updated_at: string | null
        }
        Insert: {
          auto_respond_min_rating?: number | null
          auto_respond_positive?: boolean | null
          avoid_phrases?: string[] | null
          created_at?: string | null
          escalation_threshold?: number | null
          id?: string
          key_phrases?: string[] | null
          language_preference?: string | null
          organization_id: string
          owner_name?: string | null
          sample_responses?: string[] | null
          sign_off?: string | null
          tone?: string
          updated_at?: string | null
        }
        Update: {
          auto_respond_min_rating?: number | null
          auto_respond_positive?: boolean | null
          avoid_phrases?: string[] | null
          created_at?: string | null
          escalation_threshold?: number | null
          id?: string
          key_phrases?: string[] | null
          language_preference?: string | null
          organization_id?: string
          owner_name?: string | null
          sample_responses?: string[] | null
          sign_off?: string | null
          tone?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reputation_brand_voice_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reputation_campaign_sends: {
        Row: {
          campaign_id: string
          client_email: string | null
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          completed_at: string | null
          created_at: string | null
          delivered_at: string | null
          id: string
          notification_queue_id: string | null
          nps_feedback: string | null
          nps_score: number | null
          nps_submitted_at: string | null
          nps_token: string | null
          nps_token_expires_at: string | null
          opened_at: string | null
          organization_id: string
          review_link: string | null
          review_link_clicked: boolean | null
          review_link_clicked_at: string | null
          review_submitted: boolean | null
          review_submitted_at: string | null
          routed_to: string | null
          sent_at: string | null
          status: string
          trip_id: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          completed_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          notification_queue_id?: string | null
          nps_feedback?: string | null
          nps_score?: number | null
          nps_submitted_at?: string | null
          nps_token?: string | null
          nps_token_expires_at?: string | null
          opened_at?: string | null
          organization_id: string
          review_link?: string | null
          review_link_clicked?: boolean | null
          review_link_clicked_at?: string | null
          review_submitted?: boolean | null
          review_submitted_at?: string | null
          routed_to?: string | null
          sent_at?: string | null
          status?: string
          trip_id?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          completed_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          notification_queue_id?: string | null
          nps_feedback?: string | null
          nps_score?: number | null
          nps_submitted_at?: string | null
          nps_token?: string | null
          nps_token_expires_at?: string | null
          opened_at?: string | null
          organization_id?: string
          review_link?: string | null
          review_link_clicked?: boolean | null
          review_link_clicked_at?: string | null
          review_submitted?: boolean | null
          review_submitted_at?: string | null
          routed_to?: string | null
          sent_at?: string | null
          status?: string
          trip_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reputation_campaign_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "reputation_review_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reputation_campaign_sends_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reputation_campaign_sends_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reputation_campaign_sends_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      reputation_competitors: {
        Row: {
          competitor_name: string
          created_at: string | null
          google_place_id: string | null
          id: string
          last_checked_at: string | null
          latest_rating: number | null
          latest_review_count: number | null
          organization_id: string
          tripadvisor_url: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          competitor_name: string
          created_at?: string | null
          google_place_id?: string | null
          id?: string
          last_checked_at?: string | null
          latest_rating?: number | null
          latest_review_count?: number | null
          organization_id: string
          tripadvisor_url?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          competitor_name?: string
          created_at?: string | null
          google_place_id?: string | null
          id?: string
          last_checked_at?: string | null
          latest_rating?: number | null
          latest_review_count?: number | null
          organization_id?: string
          tripadvisor_url?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reputation_competitors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reputation_platform_connections: {
        Row: {
          access_token_encrypted: string | null
          created_at: string | null
          id: string
          last_synced_at: string | null
          organization_id: string
          platform: string
          platform_account_id: string | null
          platform_account_name: string | null
          platform_location_id: string | null
          refresh_token_encrypted: string | null
          sync_cursor: string | null
          sync_enabled: boolean | null
          sync_error: string | null
          token_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_token_encrypted?: string | null
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          organization_id: string
          platform: string
          platform_account_id?: string | null
          platform_account_name?: string | null
          platform_location_id?: string | null
          refresh_token_encrypted?: string | null
          sync_cursor?: string | null
          sync_enabled?: boolean | null
          sync_error?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token_encrypted?: string | null
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          organization_id?: string
          platform?: string
          platform_account_id?: string | null
          platform_account_name?: string | null
          platform_location_id?: string | null
          refresh_token_encrypted?: string | null
          sync_cursor?: string | null
          sync_enabled?: boolean | null
          sync_error?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reputation_platform_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reputation_review_campaigns: {
        Row: {
          campaign_type: string
          channel_sequence: string[] | null
          created_at: string | null
          detractor_action: string | null
          email_template_id: string | null
          id: string
          name: string
          nps_followup_question: string | null
          nps_question: string | null
          organization_id: string
          passive_threshold: number | null
          promoter_action: string | null
          promoter_review_url: string | null
          promoter_threshold: number | null
          stats_completed: number | null
          stats_opened: number | null
          stats_reviews_generated: number | null
          stats_sent: number | null
          status: string
          target_rating_minimum: number | null
          trigger_delay_hours: number | null
          trigger_event: string
          updated_at: string | null
          whatsapp_template_name: string | null
        }
        Insert: {
          campaign_type?: string
          channel_sequence?: string[] | null
          created_at?: string | null
          detractor_action?: string | null
          email_template_id?: string | null
          id?: string
          name: string
          nps_followup_question?: string | null
          nps_question?: string | null
          organization_id: string
          passive_threshold?: number | null
          promoter_action?: string | null
          promoter_review_url?: string | null
          promoter_threshold?: number | null
          stats_completed?: number | null
          stats_opened?: number | null
          stats_reviews_generated?: number | null
          stats_sent?: number | null
          status?: string
          target_rating_minimum?: number | null
          trigger_delay_hours?: number | null
          trigger_event?: string
          updated_at?: string | null
          whatsapp_template_name?: string | null
        }
        Update: {
          campaign_type?: string
          channel_sequence?: string[] | null
          created_at?: string | null
          detractor_action?: string | null
          email_template_id?: string | null
          id?: string
          name?: string
          nps_followup_question?: string | null
          nps_question?: string | null
          organization_id?: string
          passive_threshold?: number | null
          promoter_action?: string | null
          promoter_review_url?: string | null
          promoter_threshold?: number | null
          stats_completed?: number | null
          stats_opened?: number | null
          stats_reviews_generated?: number | null
          stats_sent?: number | null
          status?: string
          target_rating_minimum?: number | null
          trigger_delay_hours?: number | null
          trigger_event?: string
          updated_at?: string | null
          whatsapp_template_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reputation_review_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reputation_reviews: {
        Row: {
          ai_suggested_response: string | null
          ai_summary: string | null
          ai_topics: string[] | null
          attention_reason: string | null
          client_id: string | null
          comment: string | null
          created_at: string | null
          destination: string | null
          id: string
          is_featured: boolean | null
          is_verified_client: boolean | null
          language: string | null
          organization_id: string
          platform: string
          platform_review_id: string | null
          platform_url: string | null
          rating: number
          requires_attention: boolean | null
          response_posted_at: string | null
          response_posted_by: string | null
          response_status: string
          response_text: string | null
          review_date: string
          reviewer_avatar_url: string | null
          reviewer_name: string
          sentiment_label: string | null
          sentiment_score: number | null
          title: string | null
          trip_id: string | null
          trip_type: string | null
          updated_at: string | null
        }
        Insert: {
          ai_suggested_response?: string | null
          ai_summary?: string | null
          ai_topics?: string[] | null
          attention_reason?: string | null
          client_id?: string | null
          comment?: string | null
          created_at?: string | null
          destination?: string | null
          id?: string
          is_featured?: boolean | null
          is_verified_client?: boolean | null
          language?: string | null
          organization_id: string
          platform?: string
          platform_review_id?: string | null
          platform_url?: string | null
          rating: number
          requires_attention?: boolean | null
          response_posted_at?: string | null
          response_posted_by?: string | null
          response_status?: string
          response_text?: string | null
          review_date?: string
          reviewer_avatar_url?: string | null
          reviewer_name: string
          sentiment_label?: string | null
          sentiment_score?: number | null
          title?: string | null
          trip_id?: string | null
          trip_type?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_suggested_response?: string | null
          ai_summary?: string | null
          ai_topics?: string[] | null
          attention_reason?: string | null
          client_id?: string | null
          comment?: string | null
          created_at?: string | null
          destination?: string | null
          id?: string
          is_featured?: boolean | null
          is_verified_client?: boolean | null
          language?: string | null
          organization_id?: string
          platform?: string
          platform_review_id?: string | null
          platform_url?: string | null
          rating?: number
          requires_attention?: boolean | null
          response_posted_at?: string | null
          response_posted_by?: string | null
          response_status?: string
          response_text?: string | null
          review_date?: string
          reviewer_avatar_url?: string | null
          reviewer_name?: string
          sentiment_label?: string | null
          sentiment_score?: number | null
          title?: string | null
          trip_id?: string | null
          trip_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reputation_reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reputation_reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reputation_reviews_response_posted_by_fkey"
            columns: ["response_posted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reputation_reviews_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      reputation_snapshots: {
        Row: {
          avg_response_time_hours: number | null
          created_at: string | null
          facebook_count: number | null
          facebook_rating: number | null
          google_count: number | null
          google_rating: number | null
          health_score: number | null
          id: string
          internal_count: number | null
          internal_rating: number | null
          makemytrip_count: number | null
          makemytrip_rating: number | null
          negative_count: number | null
          neutral_count: number | null
          nps_score: number | null
          organization_id: string
          overall_rating: number | null
          positive_count: number | null
          response_rate: number | null
          review_requests_converted: number | null
          review_requests_sent: number | null
          snapshot_date: string
          total_review_count: number | null
          tripadvisor_count: number | null
          tripadvisor_rating: number | null
        }
        Insert: {
          avg_response_time_hours?: number | null
          created_at?: string | null
          facebook_count?: number | null
          facebook_rating?: number | null
          google_count?: number | null
          google_rating?: number | null
          health_score?: number | null
          id?: string
          internal_count?: number | null
          internal_rating?: number | null
          makemytrip_count?: number | null
          makemytrip_rating?: number | null
          negative_count?: number | null
          neutral_count?: number | null
          nps_score?: number | null
          organization_id: string
          overall_rating?: number | null
          positive_count?: number | null
          response_rate?: number | null
          review_requests_converted?: number | null
          review_requests_sent?: number | null
          snapshot_date?: string
          total_review_count?: number | null
          tripadvisor_count?: number | null
          tripadvisor_rating?: number | null
        }
        Update: {
          avg_response_time_hours?: number | null
          created_at?: string | null
          facebook_count?: number | null
          facebook_rating?: number | null
          google_count?: number | null
          google_rating?: number | null
          health_score?: number | null
          id?: string
          internal_count?: number | null
          internal_rating?: number | null
          makemytrip_count?: number | null
          makemytrip_rating?: number | null
          negative_count?: number | null
          neutral_count?: number | null
          nps_score?: number | null
          organization_id?: string
          overall_rating?: number | null
          positive_count?: number | null
          response_rate?: number | null
          review_requests_converted?: number | null
          review_requests_sent?: number | null
          snapshot_date?: string
          total_review_count?: number | null
          tripadvisor_count?: number | null
          tripadvisor_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reputation_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reputation_widgets: {
        Row: {
          accent_color: string | null
          background_color: string | null
          border_radius: number | null
          created_at: string | null
          custom_footer: string | null
          custom_header: string | null
          destinations_filter: string[] | null
          embed_token: string | null
          id: string
          is_active: boolean | null
          max_reviews: number | null
          min_rating_to_show: number | null
          name: string
          organization_id: string
          platforms_filter: string[] | null
          show_branding: boolean | null
          text_color: string | null
          theme: string
          updated_at: string | null
          widget_type: string
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          border_radius?: number | null
          created_at?: string | null
          custom_footer?: string | null
          custom_header?: string | null
          destinations_filter?: string[] | null
          embed_token?: string | null
          id?: string
          is_active?: boolean | null
          max_reviews?: number | null
          min_rating_to_show?: number | null
          name?: string
          organization_id: string
          platforms_filter?: string[] | null
          show_branding?: boolean | null
          text_color?: string | null
          theme?: string
          updated_at?: string | null
          widget_type?: string
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          border_radius?: number | null
          created_at?: string | null
          custom_footer?: string | null
          custom_header?: string | null
          destinations_filter?: string[] | null
          embed_token?: string | null
          id?: string
          is_active?: boolean | null
          max_reviews?: number | null
          min_rating_to_show?: number | null
          name?: string
          organization_id?: string
          platforms_filter?: string[] | null
          show_branding?: boolean | null
          text_color?: string | null
          theme?: string
          updated_at?: string | null
          widget_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reputation_widgets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      review_marketing_assets: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          last_queued_at: string | null
          lifecycle_state: string
          organization_id: string
          platform_targets: Json
          quote_excerpt: string | null
          review_id: string
          social_post_id: string
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          last_queued_at?: string | null
          lifecycle_state?: string
          organization_id: string
          platform_targets?: Json
          quote_excerpt?: string | null
          review_id: string
          social_post_id: string
          template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          last_queued_at?: string | null
          lifecycle_state?: string
          organization_id?: string
          platform_targets?: Json
          quote_excerpt?: string | null
          review_id?: string
          social_post_id?: string
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_marketing_assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_marketing_assets_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "reputation_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_marketing_assets_social_post_id_fkey"
            columns: ["social_post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_itineraries: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          client_comments: Json
          client_preferences: Json | null
          created_at: string | null
          expires_at: string | null
          id: string
          itinerary_id: string | null
          offline_pack_ready: boolean | null
          recipient_phone: string | null
          self_service_status: string | null
          share_code: string
          status: string
          template_id: string
          viewed_at: string | null
          wishlist_items: Json | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          client_comments?: Json
          client_preferences?: Json | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          itinerary_id?: string | null
          offline_pack_ready?: boolean | null
          recipient_phone?: string | null
          self_service_status?: string | null
          share_code: string
          status?: string
          template_id?: string
          viewed_at?: string | null
          wishlist_items?: Json | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          client_comments?: Json
          client_preferences?: Json | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          itinerary_id?: string | null
          offline_pack_ready?: boolean | null
          recipient_phone?: string | null
          self_service_status?: string | null
          share_code?: string
          status?: string
          template_id?: string
          viewed_at?: string | null
          wishlist_items?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_itineraries_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: true
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_itinerary_cache: {
        Row: {
          budget_bucket: string
          created_at: string
          created_by: string | null
          destination_key: string
          duration_bucket: string
          fingerprint: string
          hit_count: number
          id: string
          interests_key: string
          itinerary_data: Json
          last_hit_at: string | null
          last_promoted_at: string
          promotion_state: string
          prompt_version: string
          quality_score: number
          season_key: string
          source_type: string
          updated_at: string
        }
        Insert: {
          budget_bucket: string
          created_at?: string
          created_by?: string | null
          destination_key: string
          duration_bucket: string
          fingerprint: string
          hit_count?: number
          id?: string
          interests_key: string
          itinerary_data: Json
          last_hit_at?: string | null
          last_promoted_at?: string
          promotion_state?: string
          prompt_version?: string
          quality_score?: number
          season_key: string
          source_type?: string
          updated_at?: string
        }
        Update: {
          budget_bucket?: string
          created_at?: string
          created_by?: string | null
          destination_key?: string
          duration_bucket?: string
          fingerprint?: string
          hit_count?: number
          id?: string
          interests_key?: string
          itinerary_data?: Json
          last_hit_at?: string | null
          last_promoted_at?: string
          promotion_state?: string
          prompt_version?: string
          quality_score?: number
          season_key?: string
          source_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      shared_itinerary_cache_events: {
        Row: {
          cache_source: string
          created_at: string
          destination_key: string | null
          duration_bucket: string | null
          event_type: string
          id: string
          metadata: Json
          organization_id: string | null
          response_time_ms: number | null
          shared_cache_id: string | null
        }
        Insert: {
          cache_source: string
          created_at?: string
          destination_key?: string | null
          duration_bucket?: string | null
          event_type: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          response_time_ms?: number | null
          shared_cache_id?: string | null
        }
        Update: {
          cache_source?: string
          created_at?: string
          destination_key?: string | null
          duration_bucket?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          response_time_ms?: number | null
          shared_cache_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_itinerary_cache_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_itinerary_cache_events_shared_cache_id_fkey"
            columns: ["shared_cache_id"]
            isOneToOne: false
            referencedRelation: "shared_itinerary_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      social_connections: {
        Row: {
          access_token_encrypted: string
          created_at: string
          id: string
          organization_id: string
          platform: string
          platform_page_id: string
          refresh_token_encrypted: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token_encrypted: string
          created_at?: string
          id?: string
          organization_id: string
          platform: string
          platform_page_id: string
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token_encrypted?: string
          created_at?: string
          id?: string
          organization_id?: string
          platform?: string
          platform_page_id?: string
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_library: {
        Row: {
          caption: string | null
          created_at: string
          file_path: string
          id: string
          mime_type: string | null
          organization_id: string
          source: string
          source_contact_phone: string | null
          tags: Json | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          file_path: string
          id?: string
          mime_type?: string | null
          organization_id: string
          source?: string
          source_contact_phone?: string | null
          tags?: Json | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          organization_id?: string
          source?: string
          source_contact_phone?: string | null
          tags?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "social_media_library_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_post_queue: {
        Row: {
          attempts: number
          connection_id: string
          created_at: string
          error_message: string | null
          id: string
          platform: string
          platform_post_id: string | null
          platform_post_url: string | null
          post_id: string
          scheduled_for: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          connection_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          platform: string
          platform_post_id?: string | null
          platform_post_url?: string | null
          post_id: string
          scheduled_for: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          connection_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          platform?: string
          platform_post_id?: string | null
          platform_post_url?: string | null
          post_id?: string
          scheduled_for?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_post_queue_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "social_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_post_queue_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          caption_facebook: string | null
          caption_instagram: string | null
          created_at: string
          created_by: string | null
          hashtags: string | null
          id: string
          organization_id: string
          rendered_image_url: string | null
          rendered_image_urls: string[] | null
          source: string
          status: string
          template_data: Json
          template_id: string
          updated_at: string
        }
        Insert: {
          caption_facebook?: string | null
          caption_instagram?: string | null
          created_at?: string
          created_by?: string | null
          hashtags?: string | null
          id?: string
          organization_id: string
          rendered_image_url?: string | null
          rendered_image_urls?: string[] | null
          source?: string
          status?: string
          template_data?: Json
          template_id: string
          updated_at?: string
        }
        Update: {
          caption_facebook?: string | null
          caption_instagram?: string | null
          created_at?: string
          created_by?: string | null
          hashtags?: string | null
          id?: string
          organization_id?: string
          rendered_image_url?: string | null
          rendered_image_urls?: string[] | null
          source?: string
          status?: string
          template_data?: Json
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_reviews: {
        Row: {
          comment: string | null
          created_at: string
          destination: string | null
          id: string
          is_featured: boolean
          organization_id: string
          rating: number | null
          reviewer_name: string
          source: string
          trip_name: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          destination?: string | null
          id?: string
          is_featured?: boolean
          organization_id: string
          rating?: number | null
          reviewer_name: string
          source?: string
          trip_name?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          destination?: string | null
          id?: string
          is_featured?: boolean
          organization_id?: string
          rating?: number | null
          reviewer_name?: string
          source?: string
          trip_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          billing_cycle: string | null
          cancel_at_period_end: boolean | null
          cancelled_at: string | null
          created_at: string | null
          currency: string | null
          current_period_end: string
          current_period_start: string
          failed_payment_count: number | null
          gst_amount: number | null
          id: string
          last_payment_attempt_at: string | null
          metadata: Json | null
          next_billing_date: string | null
          organization_id: string
          payment_method_id: string | null
          plan_id: string
          razorpay_plan_id: string | null
          razorpay_subscription_id: string | null
          status: string | null
          total_amount: number
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end: string
          current_period_start: string
          failed_payment_count?: number | null
          gst_amount?: number | null
          id?: string
          last_payment_attempt_at?: string | null
          metadata?: Json | null
          next_billing_date?: string | null
          organization_id: string
          payment_method_id?: string | null
          plan_id: string
          razorpay_plan_id?: string | null
          razorpay_subscription_id?: string | null
          status?: string | null
          total_amount: number
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string
          current_period_start?: string
          failed_payment_count?: number | null
          gst_amount?: number | null
          id?: string
          last_payment_attempt_at?: string | null
          metadata?: Json | null
          next_billing_date?: string | null
          organization_id?: string
          payment_method_id?: string | null
          plan_id?: string
          razorpay_plan_id?: string | null
          razorpay_subscription_id?: string | null
          status?: string | null
          total_amount?: number
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          admin_response: string | null
          category: string
          created_at: string
          description: string
          id: string
          organization_id: string
          priority: string
          responded_at: string | null
          responded_by: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          organization_id: string
          priority: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          organization_id?: string
          priority?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      template_accommodations: {
        Row: {
          amenities: string[] | null
          check_in_date: string | null
          check_out_date: string | null
          hotel_name: string
          id: string
          image_url: string | null
          price_per_night: number | null
          room_type: string | null
          star_rating: number | null
          template_day_id: string
        }
        Insert: {
          amenities?: string[] | null
          check_in_date?: string | null
          check_out_date?: string | null
          hotel_name: string
          id?: string
          image_url?: string | null
          price_per_night?: number | null
          room_type?: string | null
          star_rating?: number | null
          template_day_id: string
        }
        Update: {
          amenities?: string[] | null
          check_in_date?: string | null
          check_out_date?: string | null
          hotel_name?: string
          id?: string
          image_url?: string | null
          price_per_night?: number | null
          room_type?: string | null
          star_rating?: number | null
          template_day_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_accommodations_template_day_id_fkey"
            columns: ["template_day_id"]
            isOneToOne: false
            referencedRelation: "template_days"
            referencedColumns: ["id"]
          },
        ]
      }
      template_activities: {
        Row: {
          description: string | null
          display_order: number | null
          embedding: string | null
          embedding_model: string | null
          embedding_v2: string | null
          embedding_version: number | null
          id: string
          image_url: string | null
          is_optional: boolean | null
          is_premium: boolean | null
          location: string | null
          price: number | null
          searchable_text: string | null
          template_day_id: string
          time: string | null
          title: string
        }
        Insert: {
          description?: string | null
          display_order?: number | null
          embedding?: string | null
          embedding_model?: string | null
          embedding_v2?: string | null
          embedding_version?: number | null
          id?: string
          image_url?: string | null
          is_optional?: boolean | null
          is_premium?: boolean | null
          location?: string | null
          price?: number | null
          searchable_text?: string | null
          template_day_id: string
          time?: string | null
          title: string
        }
        Update: {
          description?: string | null
          display_order?: number | null
          embedding?: string | null
          embedding_model?: string | null
          embedding_v2?: string | null
          embedding_version?: number | null
          id?: string
          image_url?: string | null
          is_optional?: boolean | null
          is_premium?: boolean | null
          location?: string | null
          price?: number | null
          searchable_text?: string | null
          template_day_id?: string
          time?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_activities_template_day_id_fkey"
            columns: ["template_day_id"]
            isOneToOne: false
            referencedRelation: "template_days"
            referencedColumns: ["id"]
          },
        ]
      }
      template_days: {
        Row: {
          day_number: number
          description: string | null
          id: string
          template_id: string
          title: string | null
        }
        Insert: {
          day_number: number
          description?: string | null
          id?: string
          template_id: string
          title?: string | null
        }
        Update: {
          day_number?: number
          description?: string | null
          id?: string
          template_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_days_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "tour_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_usage: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          organization_id: string
          proposal_id: string
          template_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          organization_id: string
          proposal_id: string
          template_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          organization_id?: string
          proposal_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_proposal"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_template"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "tour_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_usage_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_usage_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "tour_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_usage_attribution: {
        Row: {
          contribution_percentage: number | null
          created_at: string | null
          id: string
          itinerary_cache_id: string | null
          requesting_organization_id: string | null
          similarity_score: number | null
          source_organization_id: string
          source_template_id: string
        }
        Insert: {
          contribution_percentage?: number | null
          created_at?: string | null
          id?: string
          itinerary_cache_id?: string | null
          requesting_organization_id?: string | null
          similarity_score?: number | null
          source_organization_id: string
          source_template_id: string
        }
        Update: {
          contribution_percentage?: number | null
          created_at?: string | null
          id?: string
          itinerary_cache_id?: string | null
          requesting_organization_id?: string | null
          similarity_score?: number | null
          source_organization_id?: string
          source_template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_usage_attribution_itinerary_cache_id_fkey"
            columns: ["itinerary_cache_id"]
            isOneToOne: false
            referencedRelation: "itinerary_cache"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_usage_attribution_requesting_organization_id_fkey"
            columns: ["requesting_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_usage_attribution_source_organization_id_fkey"
            columns: ["source_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_usage_attribution_source_template_id_fkey"
            columns: ["source_template_id"]
            isOneToOne: false
            referencedRelation: "tour_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_views: {
        Row: {
          id: string
          organization_id: string
          source: string | null
          template_id: string
          viewed_at: string | null
          viewed_by: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          source?: string | null
          template_id: string
          viewed_at?: string | null
          viewed_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          source?: string | null
          template_id?: string
          viewed_at?: string | null
          viewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_template"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "tour_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_views_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_views_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "tour_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_templates: {
        Row: {
          base_price: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          destination: string | null
          duration_days: number | null
          embedding: string | null
          embedding_model: string | null
          embedding_updated_at: string | null
          embedding_v2: string | null
          embedding_version: number | null
          hero_image_url: string | null
          id: string
          is_public: boolean | null
          last_used_at: string | null
          name: string
          organization_id: string
          quality_score: number | null
          searchable_text: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          base_price?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          destination?: string | null
          duration_days?: number | null
          embedding?: string | null
          embedding_model?: string | null
          embedding_updated_at?: string | null
          embedding_v2?: string | null
          embedding_version?: number | null
          hero_image_url?: string | null
          id?: string
          is_public?: boolean | null
          last_used_at?: string | null
          name: string
          organization_id: string
          quality_score?: number | null
          searchable_text?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          base_price?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          destination?: string | null
          duration_days?: number | null
          embedding?: string | null
          embedding_model?: string | null
          embedding_updated_at?: string | null
          embedding_v2?: string | null
          embedding_version?: number | null
          hero_image_url?: string | null
          id?: string
          is_public?: boolean | null
          last_used_at?: string | null
          name?: string
          organization_id?: string
          quality_score?: number | null
          searchable_text?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_documents: {
        Row: {
          client_id: string
          created_at: string | null
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          name: string
          trip_id: string | null
          type: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          name: string
          trip_id?: string | null
          type: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          name?: string
          trip_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_documents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_accommodations: {
        Row: {
          address: string | null
          check_in_time: string | null
          contact_phone: string | null
          created_at: string | null
          day_number: number
          hotel_name: string
          id: string
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          check_in_time?: string | null
          contact_phone?: string | null
          created_at?: string | null
          day_number: number
          hotel_name: string
          id?: string
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          check_in_time?: string | null
          contact_phone?: string | null
          created_at?: string | null
          day_number?: number
          hotel_name?: string
          id?: string
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_accommodations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_driver_assignments: {
        Row: {
          created_at: string | null
          day_number: number
          dropoff_location: string | null
          external_driver_id: string | null
          id: string
          notes: string | null
          notification_sent_at: string | null
          pickup_coordinates: Json | null
          pickup_location: string | null
          pickup_time: string | null
          trip_id: string
        }
        Insert: {
          created_at?: string | null
          day_number: number
          dropoff_location?: string | null
          external_driver_id?: string | null
          id?: string
          notes?: string | null
          notification_sent_at?: string | null
          pickup_coordinates?: Json | null
          pickup_location?: string | null
          pickup_time?: string | null
          trip_id: string
        }
        Update: {
          created_at?: string | null
          day_number?: number
          dropoff_location?: string | null
          external_driver_id?: string | null
          id?: string
          notes?: string | null
          notification_sent_at?: string | null
          pickup_coordinates?: Json | null
          pickup_location?: string | null
          pickup_time?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_driver_assignments_external_driver_id_fkey"
            columns: ["external_driver_id"]
            isOneToOne: false
            referencedRelation: "external_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_driver_assignments_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_location_share_access_logs: {
        Row: {
          created_at: string | null
          id: string
          ip_hash: string
          share_token_hash: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_hash: string
          share_token_hash: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_hash?: string
          share_token_hash?: string
        }
        Relationships: []
      }
      trip_location_shares: {
        Row: {
          created_at: string | null
          created_by: string | null
          day_number: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          share_token: string
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          day_number?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          share_token: string
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          day_number?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          share_token?: string
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_location_shares_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_location_shares_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_service_costs: {
        Row: {
          category: string
          commission_amount: number | null
          commission_pct: number | null
          cost_amount: number | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          id: string
          notes: string | null
          organization_id: string
          pax_count: number | null
          price_amount: number | null
          trip_id: string
          updated_at: string | null
          vendor_name: string | null
        }
        Insert: {
          category: string
          commission_amount?: number | null
          commission_pct?: number | null
          cost_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          pax_count?: number | null
          price_amount?: number | null
          trip_id: string
          updated_at?: string | null
          vendor_name?: string | null
        }
        Update: {
          category?: string
          commission_amount?: number | null
          commission_pct?: number | null
          cost_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          pax_count?: number | null
          price_amount?: number | null
          trip_id?: string
          updated_at?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_service_costs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_service_costs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_service_costs_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          client_id: string | null
          created_at: string | null
          created_by: string | null
          destination: string | null
          driver_id: string | null
          end_date: string | null
          gst_pct: number | null
          id: string
          itinerary_id: string | null
          name: string | null
          notes: string | null
          organization_id: string | null
          pax_count: number | null
          start_date: string | null
          status: string | null
          tcs_pct: number | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          destination?: string | null
          driver_id?: string | null
          end_date?: string | null
          gst_pct?: number | null
          id?: string
          itinerary_id?: string | null
          name?: string | null
          notes?: string | null
          organization_id?: string | null
          pax_count?: number | null
          start_date?: string | null
          status?: string | null
          tcs_pct?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          destination?: string | null
          driver_id?: string | null
          end_date?: string | null
          gst_pct?: number | null
          id?: string
          itinerary_id?: string | null
          name?: string | null
          notes?: string | null
          organization_id?: string | null
          pax_count?: number | null
          start_date?: string | null
          status?: string | null
          tcs_pct?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_chatbot_sessions: {
        Row: {
          ai_reply_count: number
          context: Json
          created_at: string
          handed_off_at: string | null
          id: string
          last_ai_reply_at: string | null
          last_message_at: string | null
          organization_id: string
          phone: string
          state: string
          updated_at: string
        }
        Insert: {
          ai_reply_count?: number
          context?: Json
          created_at?: string
          handed_off_at?: string | null
          id?: string
          last_ai_reply_at?: string | null
          last_message_at?: string | null
          organization_id: string
          phone: string
          state?: string
          updated_at?: string
        }
        Update: {
          ai_reply_count?: number
          context?: Json
          created_at?: string
          handed_off_at?: string | null
          id?: string
          last_ai_reply_at?: string | null
          last_message_at?: string | null
          organization_id?: string
          phone?: string
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_chatbot_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_connections: {
        Row: {
          assistant_group_jid: string | null
          connected_at: string | null
          created_at: string
          display_name: string | null
          history_imported: boolean
          id: string
          instance_name: string | null
          organization_id: string
          phone_number: string | null
          provider: string | null
          session_name: string
          session_token: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assistant_group_jid?: string | null
          connected_at?: string | null
          created_at?: string
          display_name?: string | null
          history_imported?: boolean
          id?: string
          instance_name?: string | null
          organization_id: string
          phone_number?: string | null
          provider?: string | null
          session_name: string
          session_token?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assistant_group_jid?: string | null
          connected_at?: string | null
          created_at?: string
          display_name?: string | null
          history_imported?: boolean
          id?: string
          instance_name?: string | null
          organization_id?: string
          phone_number?: string | null
          provider?: string | null
          session_name?: string
          session_token?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_contact_names: {
        Row: {
          created_at: string | null
          custom_name: string | null
          id: string
          is_personal: boolean | null
          org_id: string
          push_name: string | null
          updated_at: string | null
          wa_id: string
        }
        Insert: {
          created_at?: string | null
          custom_name?: string | null
          id?: string
          is_personal?: boolean | null
          org_id: string
          push_name?: string | null
          updated_at?: string | null
          wa_id: string
        }
        Update: {
          created_at?: string | null
          custom_name?: string | null
          id?: string
          is_personal?: boolean | null
          org_id?: string
          push_name?: string | null
          updated_at?: string | null
          wa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contact_names_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_presence: {
        Row: {
          id: string
          last_seen_at: string | null
          presence: string
          session_name: string
          updated_at: string
          wa_id: string
        }
        Insert: {
          id?: string
          last_seen_at?: string | null
          presence?: string
          session_name: string
          updated_at?: string
          wa_id: string
        }
        Update: {
          id?: string
          last_seen_at?: string | null
          presence?: string
          session_name?: string
          updated_at?: string
          wa_id?: string
        }
        Relationships: []
      }
      whatsapp_proposal_drafts: {
        Row: {
          budget_inr: number | null
          chatbot_session_id: string
          client_id: string | null
          created_at: string
          destination: string | null
          group_size: number | null
          id: string
          organization_id: string
          source_context: Json
          status: string
          template_id: string | null
          title: string
          travel_dates: string | null
          traveler_email: string | null
          traveler_name: string | null
          traveler_phone: string
          trip_end_date: string | null
          trip_start_date: string | null
          updated_at: string
        }
        Insert: {
          budget_inr?: number | null
          chatbot_session_id: string
          client_id?: string | null
          created_at?: string
          destination?: string | null
          group_size?: number | null
          id?: string
          organization_id: string
          source_context?: Json
          status?: string
          template_id?: string | null
          title: string
          travel_dates?: string | null
          traveler_email?: string | null
          traveler_name?: string | null
          traveler_phone: string
          trip_end_date?: string | null
          trip_start_date?: string | null
          updated_at?: string
        }
        Update: {
          budget_inr?: number | null
          chatbot_session_id?: string
          client_id?: string | null
          created_at?: string
          destination?: string | null
          group_size?: number | null
          id?: string
          organization_id?: string
          source_context?: Json
          status?: string
          template_id?: string | null
          title?: string
          travel_dates?: string | null
          traveler_email?: string | null
          traveler_name?: string | null
          traveler_phone?: string
          trip_end_date?: string | null
          trip_start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_proposal_drafts_chatbot_session_id_fkey"
            columns: ["chatbot_session_id"]
            isOneToOne: true
            referencedRelation: "whatsapp_chatbot_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_proposal_drafts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_proposal_drafts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_proposal_drafts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "tour_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_webhook_events: {
        Row: {
          event_type: string
          id: string
          metadata: Json
          payload_hash: string
          processed_at: string | null
          processing_status: string
          provider_message_id: string
          received_at: string
          reject_reason: string | null
          wa_id: string | null
        }
        Insert: {
          event_type?: string
          id?: string
          metadata?: Json
          payload_hash: string
          processed_at?: string | null
          processing_status?: string
          provider_message_id: string
          received_at?: string
          reject_reason?: string | null
          wa_id?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          metadata?: Json
          payload_hash?: string
          processed_at?: string | null
          processing_status?: string
          provider_message_id?: string
          received_at?: string
          reject_reason?: string | null
          wa_id?: string | null
        }
        Relationships: []
      }
      workflow_notification_rules: {
        Row: {
          created_at: string | null
          id: string
          lifecycle_stage: string
          notify_client: boolean
          organization_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lifecycle_stage: string
          notify_client?: boolean
          organization_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lifecycle_stage?: string
          notify_client?: boolean
          organization_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_notification_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_notification_rules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_stage_events: {
        Row: {
          changed_by: string | null
          created_at: string | null
          from_stage: string
          id: string
          notes: string | null
          organization_id: string | null
          profile_id: string
          to_stage: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          from_stage: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          profile_id: string
          to_stage: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          from_stage?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          profile_id?: string
          to_stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_stage_events_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_stage_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_stage_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_marketplace_profiles: {
        Row: {
          description: string | null
          gallery_urls: Json | null
          id: string | null
          is_verified: boolean | null
          listing_quality_score: number | null
          organization_id: string | null
          service_regions: Json | null
          specialties: Json | null
          updated_at: string | null
          verification_level: string | null
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          description?: string | null
          gallery_urls?: Json | null
          id?: string | null
          is_verified?: boolean | null
          listing_quality_score?: number | null
          organization_id?: string | null
          service_regions?: Json | null
          specialties?: Json | null
          updated_at?: string | null
          verification_level?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          description?: string | null
          gallery_urls?: Json | null
          id?: string | null
          is_verified?: boolean | null
          listing_quality_score?: number | null
          organization_id?: string | null
          service_regions?: Json | null
          specialties?: Json | null
          updated_at?: string | null
          verification_level?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_gst: {
        Args: {
          p_company_state: string
          p_customer_state: string
          p_subtotal: number
        }
        Returns: {
          cgst: number
          igst: number
          sgst: number
          total_gst: number
        }[]
      }
      calculate_proposal_price: {
        Args: { p_proposal_id: string }
        Returns: number
      }
      calculate_template_quality: {
        Args: { p_template_id: string }
        Returns: number
      }
      can_make_geocoding_api_call: { Args: never; Returns: boolean }
      can_publish_driver_location: {
        Args: { actor_user_id: string; target_trip_id: string }
        Returns: boolean
      }
      check_tier_limit: {
        Args: { p_feature: string; p_limit: number; p_organization_id: string }
        Returns: boolean
      }
      cleanup_expired_cache: { Args: never; Returns: undefined }
      clone_template_deep: {
        Args: { p_new_name?: string; p_template_id: string }
        Returns: string
      }
      clone_template_to_proposal: {
        Args: {
          p_client_id: string
          p_created_by: string
          p_template_id: string
        }
        Returns: string
      }
      complete_pdf_extraction: {
        Args: {
          p_confidence: number
          p_extracted_data: Json
          p_queue_id: string
        }
        Returns: boolean
      }
      create_proposal_version: {
        Args: {
          p_change_summary: string
          p_created_by: string
          p_proposal_id: string
        }
        Returns: string
      }
      driver_has_external_trip_assignment: {
        Args: { actor_user_id: string; target_trip_id: string }
        Returns: boolean
      }
      fail_pdf_extraction: {
        Args: { p_error: string; p_queue_id: string }
        Returns: boolean
      }
      generate_cache_key: {
        Args: {
          p_budget?: string
          p_days: number
          p_destination: string
          p_interests?: string[]
        }
        Returns: string
      }
      generate_share_token: { Args: never; Returns: string }
      generate_template_searchable_text: {
        Args: { p_template_id: string }
        Returns: string
      }
      get_addon_conversion_rate: {
        Args: { p_days?: number; p_organization_id: string }
        Returns: {
          add_on_id: string
          add_on_name: string
          conversion_rate: number
          purchases: number
          views: number
        }[]
      }
      get_cache_stats: {
        Args: { p_days?: number }
        Returns: {
          api_calls_avoided: number
          cache_hit_rate: number
          cost_savings_estimate: number
          top_destinations: Json
          total_cache_hits: number
          total_cache_misses: number
          total_cached_itineraries: number
        }[]
      }
      get_cached_itinerary: {
        Args: {
          p_budget?: string
          p_days: number
          p_destination: string
          p_interests?: string[]
        }
        Returns: Json
      }
      get_current_subscription: {
        Args: { p_organization_id: string }
        Returns: {
          amount: number
          billing_cycle: string
          current_period_end: string
          is_trial: boolean
          plan_id: string
          status: string
          subscription_id: string
        }[]
      }
      get_geocoding_usage_stats: {
        Args: never
        Returns: {
          api_calls: number
          cache_hit_rate: number
          cache_hits: number
          last_api_call_at: string
          limit_reached: boolean
          limit_threshold: number
          month_year: string
          remaining_calls: number
          total_requests: number
        }[]
      }
      get_my_org_id: { Args: never; Returns: string }
      get_or_create_geocoding_usage: {
        Args: never
        Returns: {
          api_calls: number
          cache_hits: number
          created_at: string
          id: string
          last_api_call_at: string | null
          limit_reached: boolean
          limit_threshold: number
          month_year: string
          total_requests: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "geocoding_usage"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_pdf_import_stats: {
        Args: { p_organization_id?: string }
        Returns: {
          approved_count: number
          avg_confidence: number
          extracted_count: number
          extracting_count: number
          failed_count: number
          published_count: number
          rejected_count: number
          reviewing_count: number
          total_imports: number
          uploaded_count: number
        }[]
      }
      get_pending_pdf_extractions: {
        Args: { p_limit?: number }
        Returns: {
          attempts: number
          file_name: string
          file_url: string
          organization_id: string
          pdf_import_id: string
          queue_id: string
        }[]
      }
      get_recommended_addons: {
        Args: {
          p_client_id: string
          p_max_results?: number
          p_trip_id?: string
        }
        Returns: {
          category: string
          description: string
          discount: number
          duration: string
          id: string
          image_url: string
          name: string
          price: number
          reason: string
          score: number
        }[]
      }
      get_rls_diagnostics: { Args: never; Returns: Json }
      get_special_offers: {
        Args: { p_client_id: string; p_max_results?: number }
        Returns: {
          category: string
          description: string
          discount: number
          duration: string
          id: string
          image_url: string
          name: string
          price: number
          reason: string
        }[]
      }
      get_template_analytics: {
        Args: { p_organization_id: string; p_template_id: string }
        Returns: Json
      }
      get_top_templates_by_usage: {
        Args: { p_days?: number; p_limit?: number; p_organization_id: string }
        Returns: {
          conversion_rate: number
          destination: string
          template_id: string
          template_name: string
          total_uses: number
          total_views: number
        }[]
      }
      get_trending_addons: {
        Args: {
          p_days?: number
          p_max_results?: number
          p_organization_id: string
        }
        Returns: {
          category: string
          description: string
          duration: string
          id: string
          image_url: string
          name: string
          price: number
          purchase_count: number
        }[]
      }
      get_user_organization_id: { Args: never; Returns: string }
      increment_geocoding_api_call: { Args: never; Returns: boolean }
      increment_geocoding_cache_hit: { Args: never; Returns: undefined }
      increment_template_usage: {
        Args: { p_template_id: string }
        Returns: undefined
      }
      is_org_admin: { Args: { target_org: string }; Returns: boolean }
      match_itineraries: {
        Args: {
          filter_days: number
          filter_destination: string
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          destination: string
          duration_days: number
          id: string
          itinerary_data: Json
          query_text: string
          similarity: number
        }[]
      }
      match_itineraries_v2: {
        Args: {
          filter_days: number
          filter_destination: string
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          destination: string
          duration_days: number
          id: string
          itinerary_data: Json
          query_text: string
          similarity: number
        }[]
      }
      reputation_user_org_id: { Args: never; Returns: string }
      save_itinerary_to_cache: {
        Args: {
          p_budget: string
          p_created_by?: string
          p_days: number
          p_destination: string
          p_interests: string[]
          p_itinerary_data: Json
        }
        Returns: string
      }
      search_similar_templates_with_quality: {
        Args: {
          p_exclude_organization_id?: string
          p_match_count?: number
          p_match_threshold?: number
          p_max_days?: number
          p_min_days?: number
          p_query_embedding: string
        }
        Returns: {
          base_price: number
          combined_rank: number
          destination: string
          duration_days: number
          name: string
          organization_id: string
          quality_score: number
          similarity: number
          template_id: string
          usage_count: number
        }[]
      }
      search_similar_templates_with_quality_v2: {
        Args: {
          p_exclude_organization_id?: string
          p_match_count?: number
          p_match_threshold?: number
          p_max_days?: number
          p_min_days?: number
          p_query_embedding: string
        }
        Returns: {
          base_price: number
          combined_rank: number
          destination: string
          duration_days: number
          name: string
          organization_id: string
          quality_score: number
          similarity: number
          template_id: string
          usage_count: number
        }[]
      }
      start_pdf_extraction: { Args: { p_queue_id: string }; Returns: boolean }
      track_addon_view: {
        Args: { p_add_on_id: string; p_client_id: string; p_source?: string }
        Returns: undefined
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
