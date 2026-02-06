export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    full_name: string | null
                    avatar_url: string | null
                    role: 'client' | 'driver' | 'admin'
                    phone: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    role?: 'client' | 'driver' | 'admin'
                    phone?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    role?: 'client' | 'driver' | 'admin'
                    phone?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            itineraries: {
                Row: {
                    id: string
                    user_id: string | null
                    trip_title: string
                    destination: string
                    summary: string | null
                    duration_days: number
                    budget: string | null
                    interests: string[] | null
                    raw_data: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    trip_title: string
                    destination: string
                    summary?: string | null
                    duration_days?: number
                    budget?: string | null
                    interests?: string[] | null
                    raw_data: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    trip_title?: string
                    destination?: string
                    summary?: string | null
                    duration_days?: number
                    budget?: string | null
                    interests?: string[] | null
                    raw_data?: Json
                    created_at?: string
                    updated_at?: string
                }
            }
            trips: {
                Row: {
                    id: string
                    itinerary_id: string | null
                    client_id: string | null
                    driver_id: string | null
                    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
                    start_date: string | null
                    end_date: string | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    itinerary_id?: string | null
                    client_id?: string | null
                    driver_id?: string | null
                    status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
                    start_date?: string | null
                    end_date?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    itinerary_id?: string | null
                    client_id?: string | null
                    driver_id?: string | null
                    status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
                    start_date?: string | null
                    end_date?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            driver_locations: {
                Row: {
                    id: string
                    driver_id: string | null
                    trip_id: string | null
                    latitude: number
                    longitude: number
                    heading: number | null
                    speed: number | null
                    accuracy: number | null
                    recorded_at: string
                }
                Insert: {
                    id?: string
                    driver_id?: string | null
                    trip_id?: string | null
                    latitude: number
                    longitude: number
                    heading?: number | null
                    speed?: number | null
                    accuracy?: number | null
                    recorded_at?: string
                }
                Update: {
                    id?: string
                    driver_id?: string | null
                    trip_id?: string | null
                    latitude?: number
                    longitude?: number
                    heading?: number | null
                    speed?: number | null
                    accuracy?: number | null
                    recorded_at?: string
                }
            }
            shared_itineraries: {
                Row: {
                    id: string
                    itinerary_id: string | null
                    share_code: string
                    recipient_phone: string | null
                    expires_at: string
                    viewed_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    itinerary_id?: string | null
                    share_code: string
                    recipient_phone?: string | null
                    expires_at?: string
                    viewed_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    itinerary_id?: string | null
                    share_code?: string
                    recipient_phone?: string | null
                    expires_at?: string
                    viewed_at?: string | null
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
