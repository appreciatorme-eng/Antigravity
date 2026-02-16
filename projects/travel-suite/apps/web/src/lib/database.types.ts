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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      crm_contacts: {
        Row: {
          converted_at: string | null
          converted_profile_id: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          notes: string | null
          organization_id: string
          phone: string | null
          phone_normalized: string | null
          source: string | null
          updated_at: string | null
        }
        Insert: {
          converted_at?: string | null
          converted_profile_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          phone_normalized?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          converted_at?: string | null
          converted_profile_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          phone_normalized?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Relationships: [
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
          client_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string
          due_date: string | null
          id: string
          invoice_number: string
          issued_at: string | null
          metadata: Json | null
          organization_id: string
          paid_amount: number
          paid_at: string | null
          status: string
          subtotal_amount: number
          tax_amount: number
          total_amount: number
          trip_id: string | null
          updated_at: string | null
        }
        Insert: {
          balance_amount?: number
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          issued_at?: string | null
          metadata?: Json | null
          organization_id: string
          paid_amount?: number
          paid_at?: string | null
          status?: string
          subtotal_amount?: number
          tax_amount?: number
          total_amount?: number
          trip_id?: string | null
          updated_at?: string | null
        }
        Update: {
          balance_amount?: number
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string | null
          metadata?: Json | null
          organization_id?: string
          paid_amount?: number
          paid_at?: string | null
          status?: string
          subtotal_amount?: number
          tax_amount?: number
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
          created_at: string | null
          destination: string
          duration_days: number | null
          id: string
          interests: string[] | null
          raw_data: Json
          summary: string | null
          trip_title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          budget?: string | null
          created_at?: string | null
          destination: string
          duration_days?: number | null
          id?: string
          interests?: string[] | null
          raw_data: Json
          summary?: string | null
          trip_title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          budget?: string | null
          created_at?: string | null
          destination?: string
          duration_days?: number | null
          id?: string
          interests?: string[] | null
          raw_data?: Json
          summary?: string | null
          trip_title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itineraries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      organizations: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string | null
          primary_color: string | null
          slug: string
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id?: string | null
          primary_color?: string | null
          slug: string
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          primary_color?: string | null
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
      policy_embeddings: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
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
          id?: string
          metadata?: Json | null
          source_file?: string | null
          source_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          budget_max: number | null
          budget_min: number | null
          client_info: Json | null
          client_tag: string | null
          created_at: string | null
          dietary_requirements: string[] | null
          driver_info: Json | null
          email: string | null
          full_name: string | null
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
          bio?: string | null
          budget_max?: number | null
          budget_min?: number | null
          client_info?: Json | null
          client_tag?: string | null
          created_at?: string | null
          dietary_requirements?: string[] | null
          driver_info?: Json | null
          email?: string | null
          full_name?: string | null
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
          bio?: string | null
          budget_max?: number | null
          budget_min?: number | null
          client_info?: Json | null
          client_tag?: string | null
          created_at?: string | null
          dietary_requirements?: string[] | null
          driver_info?: Json | null
          email?: string | null
          full_name?: string | null
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
      shared_itineraries: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          itinerary_id: string | null
          recipient_phone: string | null
          share_code: string
          viewed_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          itinerary_id?: string | null
          recipient_phone?: string | null
          share_code: string
          viewed_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          itinerary_id?: string | null
          recipient_phone?: string | null
          share_code?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_itineraries_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
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
      trips: {
        Row: {
          client_id: string | null
          created_at: string | null
          driver_id: string | null
          end_date: string | null
          id: string
          itinerary_id: string | null
          notes: string | null
          organization_id: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          driver_id?: string | null
          end_date?: string | null
          id?: string
          itinerary_id?: string | null
          notes?: string | null
          organization_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          driver_id?: string | null
          end_date?: string | null
          id?: string
          itinerary_id?: string | null
          notes?: string | null
          organization_id?: string | null
          start_date?: string | null
          status?: string | null
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
      [_ in never]: never
    }
    Functions: {
      can_publish_driver_location: {
        Args: { actor_user_id: string; target_trip_id: string }
        Returns: boolean
      }
      get_rls_diagnostics: { Args: never; Returns: Json }
      is_org_admin: { Args: { target_org: string }; Returns: boolean }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
