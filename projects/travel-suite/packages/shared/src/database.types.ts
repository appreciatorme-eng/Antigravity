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
          gstin: string | null
          id: string
          igst: number | null
          invoice_number: string
          issued_at: string | null
          metadata: Json | null
          organization_id: string
          paid_amount: number
          paid_at: string | null
          place_of_supply: string | null
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
          gstin?: string | null
          id?: string
          igst?: number | null
          invoice_number: string
          issued_at?: string | null
          metadata?: Json | null
          organization_id: string
          paid_amount?: number
          paid_at?: string | null
          place_of_supply?: string | null
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
          gstin?: string | null
          id?: string
          igst?: number | null
          invoice_number?: string
          issued_at?: string | null
          metadata?: Json | null
          organization_id?: string
          paid_amount?: number
          paid_at?: string | null
          place_of_supply?: string | null
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
          embedding: string
          id: string
          itinerary_data: Json
          query_text: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          destination: string
          duration_days: number
          embedding: string
          id?: string
          itinerary_data: Json
          query_text: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          destination?: string
          duration_days?: number
          embedding?: string
          id?: string
          itinerary_data?: Json
          query_text?: string
          usage_count?: number | null
        }
        Relationships: []
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
          compliance_documents: Json | null
          created_at: string | null
          description: string | null
          gallery_urls: Json | null
          id: string
          is_verified: boolean | null
          listing_quality_score: number | null
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
          compliance_documents?: Json | null
          created_at?: string | null
          description?: string | null
          gallery_urls?: Json | null
          id?: string
          is_verified?: boolean | null
          listing_quality_score?: number | null
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
          compliance_documents?: Json | null
          created_at?: string | null
          description?: string | null
          gallery_urls?: Json | null
          id?: string
          is_verified?: boolean | null
          listing_quality_score?: number | null
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
      organization_ai_usage: {
        Row: {
          ai_requests: number
          cache_hits: number
          created_at: string
          estimated_cost_usd: number
          fallback_count: number
          id: string
          month_start: string
          organization_id: string
          rag_hits: number
          updated_at: string
        }
        Insert: {
          ai_requests?: number
          cache_hits?: number
          created_at?: string
          estimated_cost_usd?: number
          fallback_count?: number
          id?: string
          month_start: string
          organization_id: string
          rag_hits?: number
          updated_at?: string
        }
        Update: {
          ai_requests?: number
          cache_hits?: number
          created_at?: string
          estimated_cost_usd?: number
          fallback_count?: number
          id?: string
          month_start?: string
          organization_id?: string
          rag_hits?: number
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
      organizations: {
        Row: {
          ai_monthly_request_cap: number | null
          ai_monthly_spend_cap_usd: number | null
          billing_address: Json | null
          billing_state: string | null
          created_at: string | null
          gstin: string | null
          id: string
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
          billing_state?: string | null
          created_at?: string | null
          gstin?: string | null
          id?: string
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
          billing_state?: string | null
          created_at?: string | null
          gstin?: string | null
          id?: string
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
            foreignKeyName: "payment_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
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
          share_token: string
          status: string | null
          template_id: string | null
          title: string
          total_price: number | null
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
          share_token: string
          status?: string | null
          template_id?: string | null
          title: string
          total_price?: number | null
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
          share_token?: string
          status?: string | null
          template_id?: string | null
          title?: string
          total_price?: number | null
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
          category: string
          created_at: string
          description: string
          id: string
          organization_id: string
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          organization_id: string
          priority: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          organization_id?: string
          priority?: string
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
          embedding_updated_at: string | null
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
          embedding_updated_at?: string | null
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
          embedding_updated_at?: string | null
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
