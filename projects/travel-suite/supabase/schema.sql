-- TravelSuite Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- USERS (extends Supabase Auth)
-- ================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'client' CHECK (role IN ('client', 'driver', 'admin')),
    phone TEXT,
    phone_normalized TEXT,
    preferred_destination TEXT,
    travelers_count INTEGER,
    budget_min NUMERIC,
    budget_max NUMERIC,
    travel_style TEXT,
    interests TEXT[],
    home_airport TEXT,
    notes TEXT,
    lead_status TEXT DEFAULT 'new',
    lifecycle_stage TEXT DEFAULT 'lead',
    last_contacted_at TIMESTAMPTZ,
    welcome_email_sent_at TIMESTAMPTZ,
    marketing_opt_in BOOLEAN DEFAULT false,
    referral_source TEXT,
    source_channel TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- ================================================
-- ITINERARIES
-- ================================================
CREATE TABLE IF NOT EXISTS public.itineraries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    trip_title TEXT NOT NULL,
    destination TEXT NOT NULL,
    summary TEXT,
    duration_days INTEGER DEFAULT 1,
    budget TEXT,
    interests TEXT[],
    raw_data JSONB NOT NULL, -- Full AI-generated itinerary
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- Itinerary policies
CREATE POLICY "Users can view their own itineraries" 
    ON public.itineraries FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create itineraries" 
    ON public.itineraries FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own itineraries" 
    ON public.itineraries FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own itineraries" 
    ON public.itineraries FOR DELETE 
    USING (auth.uid() = user_id);

-- ================================================
-- TRIPS (Active bookings/trips)
-- ================================================
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    itinerary_id UUID REFERENCES public.itineraries(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    start_date DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Trip policies
CREATE POLICY "Clients can view their trips" 
    ON public.trips FOR SELECT 
    USING (auth.uid() = client_id);

CREATE POLICY "Drivers can view assigned trips" 
    ON public.trips FOR SELECT 
    USING (auth.uid() = driver_id);

CREATE POLICY "Clients can create trips" 
    ON public.trips FOR INSERT 
    WITH CHECK (auth.uid() = client_id);

-- ================================================
-- DRIVER LOCATIONS (Real-time tracking)
-- ================================================
CREATE TABLE IF NOT EXISTS public.driver_locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    heading DOUBLE PRECISION, -- Direction in degrees
    speed DOUBLE PRECISION, -- km/h
    accuracy DOUBLE PRECISION,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_id ON public.driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_recorded_at ON public.driver_locations(recorded_at DESC);

-- Location policies
CREATE POLICY "Drivers can insert their own locations" 
    ON public.driver_locations FOR INSERT 
    WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can view their own locations" 
    ON public.driver_locations FOR SELECT 
    USING (auth.uid() = driver_id);

-- Clients can view driver location for their active trips
CREATE POLICY "Clients can view driver location for their trips" 
    ON public.driver_locations FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.trips 
            WHERE trips.id = driver_locations.trip_id 
            AND trips.client_id = auth.uid()
            AND trips.status = 'in_progress'
        )
    );

-- ================================================
-- SHARED ITINERARIES (for WhatsApp sharing)
-- ================================================
CREATE TABLE IF NOT EXISTS public.shared_itineraries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    itinerary_id UUID REFERENCES public.itineraries(id) ON DELETE CASCADE,
    share_code TEXT UNIQUE NOT NULL,
    recipient_phone TEXT,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    viewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.shared_itineraries ENABLE ROW LEVEL SECURITY;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_shared_itineraries_code ON public.shared_itineraries(share_code);

-- Anyone with the share code can view (public access via share_code)
CREATE POLICY "Anyone can view shared itinerary by code" 
    ON public.shared_itineraries FOR SELECT 
    USING (true);

-- Only itinerary owner can create shares
CREATE POLICY "Owners can create shares" 
    ON public.shared_itineraries FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.itineraries 
            WHERE itineraries.id = shared_itineraries.itinerary_id 
            AND itineraries.user_id = auth.uid()
        )
    );

-- ================================================
-- ORGANIZATIONS (Multi-tenant for travel agents)
-- ================================================
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#00d084',
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Organization policies
CREATE POLICY "Org owners can view their organization"
    ON public.organizations FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Org owners can update their organization"
    ON public.organizations FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create organizations"
    ON public.organizations FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- Add organization_id to profiles (for multi-tenancy)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- ================================================
-- EXTERNAL DRIVERS (Third-party drivers, no app account)
-- ================================================
CREATE TABLE IF NOT EXISTS public.external_drivers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    vehicle_type TEXT CHECK (vehicle_type IN ('sedan', 'suv', 'van', 'minibus', 'bus')),
    vehicle_plate TEXT,
    vehicle_capacity INTEGER DEFAULT 4,
    languages TEXT[],
    photo_url TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.external_drivers ENABLE ROW LEVEL SECURITY;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_external_drivers_org ON public.external_drivers(organization_id);

-- External driver policies (admin only)
CREATE POLICY "Admins can manage external drivers"
    ON public.external_drivers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.organization_id = external_drivers.organization_id
        )
    );

-- ================================================
-- TRIP DRIVER ASSIGNMENTS (Driver per trip day)
-- ================================================
CREATE TABLE IF NOT EXISTS public.trip_driver_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    external_driver_id UUID REFERENCES public.external_drivers(id) ON DELETE SET NULL,
    day_number INTEGER NOT NULL,
    pickup_time TIME,
    pickup_location TEXT,
    pickup_coordinates JSONB,
    dropoff_location TEXT,
    notes TEXT,
    notification_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.trip_driver_assignments ENABLE ROW LEVEL SECURITY;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_trip_driver_assignments_trip ON public.trip_driver_assignments(trip_id);

-- Assignment policies
CREATE POLICY "Admins can manage driver assignments"
    ON public.trip_driver_assignments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Clients can view their trip assignments"
    ON public.trip_driver_assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_driver_assignments.trip_id
            AND trips.client_id = auth.uid()
        )
    );

-- ================================================
-- TRIP ACCOMMODATIONS (Hotels per trip day)
-- ================================================
CREATE TABLE IF NOT EXISTS public.trip_accommodations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    day_number INTEGER NOT NULL,
    hotel_name TEXT NOT NULL,
    address TEXT,
    coordinates JSONB,
    check_in_time TIME DEFAULT '15:00',
    check_out_time TIME DEFAULT '11:00',
    confirmation_number TEXT,
    contact_phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.trip_accommodations ENABLE ROW LEVEL SECURITY;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_trip_accommodations_trip ON public.trip_accommodations(trip_id);

-- Accommodation policies
CREATE POLICY "Admins can manage accommodations"
    ON public.trip_accommodations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Clients can view their trip accommodations"
    ON public.trip_accommodations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_accommodations.trip_id
            AND trips.client_id = auth.uid()
        )
    );

-- ================================================
-- PUSH TOKENS (FCM push notification tokens)
-- ================================================
CREATE TABLE IF NOT EXISTS public.push_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    fcm_token TEXT NOT NULL,
    platform TEXT CHECK (platform IN ('ios', 'android')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, platform)
);

-- Enable RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Push token policies
CREATE POLICY "Users can manage their own push tokens"
    ON public.push_tokens FOR ALL
    USING (auth.uid() = user_id);

-- ================================================
-- NOTIFICATION LOGS (Audit trail)
-- ================================================
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recipient_phone TEXT,
    recipient_type TEXT CHECK (recipient_type IN ('client', 'driver')),
    notification_type TEXT NOT NULL CHECK (notification_type IN ('trip_confirmed', 'driver_assigned', 'daily_briefing', 'client_landed', 'itinerary_update', 'manual', 'general')),
    title TEXT,
    body TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    external_id TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_notification_logs_trip ON public.notification_logs(trip_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON public.notification_logs(status);

-- Notification log policies
CREATE POLICY "Admins can view all notification logs"
    ON public.notification_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can view their own notifications"
    ON public.notification_logs FOR SELECT
    USING (auth.uid() = recipient_id);

-- ================================================
-- FUNCTIONS & TRIGGERS
-- ================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_itineraries
    BEFORE UPDATE ON public.itineraries
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_trips
    BEFORE UPDATE ON public.trips
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_organizations
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_external_drivers
    BEFORE UPDATE ON public.external_drivers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_push_tokens
    BEFORE UPDATE ON public.push_tokens
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- AI AGENT TABLES (Agno Framework)
-- ================================================

-- Enable pgvector extension for RAG embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Vector embeddings for RAG (policies, FAQs, destination guides)
CREATE TABLE IF NOT EXISTS public.policy_embeddings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content TEXT NOT NULL,
    embedding vector(1536), -- OpenAI embedding dimension
    source_type TEXT CHECK (source_type IN ('policy', 'faq', 'destination', 'trip')),
    source_file TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.policy_embeddings ENABLE ROW LEVEL SECURITY;

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_policy_embeddings_vector ON public.policy_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Embeddings policies (service role only for write, public read)
CREATE POLICY "Anyone can search embeddings"
    ON public.policy_embeddings FOR SELECT
    USING (true);

-- User preferences learned by AI agents
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    preference_type TEXT NOT NULL CHECK (preference_type IN (
        'travel_style', 'budget', 'interests', 'destinations',
        'accommodation', 'dietary', 'accessibility', 'avoid', 'other'
    )),
    preference_value JSONB NOT NULL,
    confidence FLOAT DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
    source TEXT DEFAULT 'agent' CHECK (source IN ('agent', 'explicit', 'inferred')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_type ON public.user_preferences(preference_type);

-- User preferences policies
CREATE POLICY "Users can view their own preferences"
    ON public.user_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON public.user_preferences FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON public.user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_user_preferences
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Agent conversation history
CREATE TABLE IF NOT EXISTS public.agent_conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    agent_name TEXT NOT NULL CHECK (agent_name IN ('TripPlanner', 'SupportBot', 'TravelRecommender')),
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    summary TEXT,
    metadata JSONB,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_agent_conversations_user ON public.agent_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_session ON public.agent_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_agent ON public.agent_conversations(agent_name);

-- Agent conversation policies
CREATE POLICY "Users can view their own conversations"
    ON public.agent_conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create conversations"
    ON public.agent_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversations"
    ON public.agent_conversations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Scheduled notification queue (for background workers)
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'daily_briefing', 'trip_reminder', 'driver_assigned',
        'pickup_reminder', 'custom'
    )),
    recipient_phone TEXT,
    recipient_type TEXT CHECK (recipient_type IN ('client', 'driver', 'admin')),
    channel_preference TEXT DEFAULT 'whatsapp_first',
    idempotency_key TEXT,
    scheduled_for TIMESTAMPTZ NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- Indexes for scheduled notifications
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON public.notification_queue(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user ON public.notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_trip ON public.notification_queue(trip_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_queue_idempotency ON public.notification_queue(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Notification queue policies (service role only for processing)
CREATE POLICY "Admins can view notification queue"
    ON public.notification_queue FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage notification queue"
    ON public.notification_queue FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Queue pickup reminder notifications whenever driver assignments are changed.
CREATE OR REPLACE FUNCTION public.queue_pickup_reminders_from_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    trip_rec record;
    driver_rec record;
    pickup_ts timestamptz;
    reminder_ts timestamptz;
    pickup_time_text text;
    pickup_location_text text;
    destination_text text;
BEGIN
    SELECT
        t.id,
        t.client_id,
        t.start_date,
        i.trip_title,
        COALESCE(i.destination, '') AS destination,
        p.full_name AS client_name,
        COALESCE(p.phone_normalized, p.phone, '') AS client_phone
    INTO trip_rec
    FROM public.trips t
    LEFT JOIN public.itineraries i ON i.id = t.itinerary_id
    LEFT JOIN public.profiles p ON p.id = t.client_id
    WHERE t.id = NEW.trip_id;

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    IF NEW.pickup_time IS NULL THEN
        UPDATE public.notification_queue
        SET
            status = 'cancelled',
            processed_at = NOW(),
            error_message = 'Pickup time removed by assignment update'
        WHERE idempotency_key IN (
            NEW.id::text || ':client:pickup',
            NEW.id::text || ':driver:pickup'
        )
        AND status IN ('pending', 'processing');
        RETURN NEW;
    END IF;

    pickup_ts := (
        (trip_rec.start_date::date + (NEW.day_number - 1))::timestamp
        + NEW.pickup_time
    )::timestamptz;
    reminder_ts := GREATEST(pickup_ts - INTERVAL '60 minutes', NOW());

    pickup_time_text := TO_CHAR(NEW.pickup_time, 'HH24:MI');
    pickup_location_text := COALESCE(NULLIF(NEW.pickup_location, ''), 'Hotel lobby');
    destination_text := COALESCE(NULLIF(trip_rec.destination, ''), 'your destination');

    INSERT INTO public.notification_queue (
        user_id,
        trip_id,
        notification_type,
        recipient_phone,
        recipient_type,
        scheduled_for,
        payload,
        status,
        idempotency_key
    ) VALUES (
        trip_rec.client_id,
        NEW.trip_id,
        'pickup_reminder',
        NULLIF(trip_rec.client_phone, ''),
        'client',
        reminder_ts,
        jsonb_build_object(
            'title', 'Pickup Reminder',
            'body', format(
                'Your pickup is in 1 hour (%s) at %s for Day %s.',
                pickup_time_text,
                pickup_location_text,
                NEW.day_number
            ),
            'trip_id', NEW.trip_id::text,
            'day_number', NEW.day_number,
            'pickup_time', pickup_time_text,
            'pickup_location', pickup_location_text,
            'destination', destination_text,
            'trip_title', COALESCE(trip_rec.trip_title, destination_text),
            'recipient', 'client'
        ),
        'pending',
        NEW.id::text || ':client:pickup'
    )
    ON CONFLICT (idempotency_key)
    DO UPDATE SET
        user_id = EXCLUDED.user_id,
        recipient_phone = EXCLUDED.recipient_phone,
        scheduled_for = EXCLUDED.scheduled_for,
        payload = EXCLUDED.payload,
        status = 'pending',
        attempts = 0,
        error_message = NULL,
        last_attempt_at = NULL,
        processed_at = NULL;

    IF NEW.external_driver_id IS NOT NULL THEN
        SELECT d.full_name, d.phone
        INTO driver_rec
        FROM public.external_drivers d
        WHERE d.id = NEW.external_driver_id;

        INSERT INTO public.notification_queue (
            user_id,
            trip_id,
            notification_type,
            recipient_phone,
            recipient_type,
            scheduled_for,
            payload,
            status,
            idempotency_key
        ) VALUES (
            NULL,
            NEW.trip_id,
            'pickup_reminder',
            COALESCE(driver_rec.phone, ''),
            'driver',
            reminder_ts,
            jsonb_build_object(
                'title', 'Upcoming Pickup',
                'body', format(
                    'Pickup in 1 hour (%s) at %s. Client: %s.',
                    pickup_time_text,
                    pickup_location_text,
                    COALESCE(trip_rec.client_name, 'Client')
                ),
                'trip_id', NEW.trip_id::text,
                'day_number', NEW.day_number,
                'pickup_time', pickup_time_text,
                'pickup_location', pickup_location_text,
                'destination', destination_text,
                'trip_title', COALESCE(trip_rec.trip_title, destination_text),
                'recipient', 'driver'
            ),
            'pending',
            NEW.id::text || ':driver:pickup'
        )
        ON CONFLICT (idempotency_key)
        DO UPDATE SET
            recipient_phone = EXCLUDED.recipient_phone,
            scheduled_for = EXCLUDED.scheduled_for,
            payload = EXCLUDED.payload,
            status = 'pending',
            attempts = 0,
            error_message = NULL,
            last_attempt_at = NULL,
            processed_at = NULL;
    ELSE
        UPDATE public.notification_queue
        SET
            status = 'cancelled',
            processed_at = NOW(),
            error_message = 'Driver removed from assignment'
        WHERE idempotency_key = NEW.id::text || ':driver:pickup'
        AND status IN ('pending', 'processing');
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cancel_pickup_reminders_on_assignment_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    UPDATE public.notification_queue
    SET
        status = 'cancelled',
        processed_at = NOW(),
        error_message = 'Assignment deleted'
    WHERE idempotency_key IN (
        OLD.id::text || ':client:pickup',
        OLD.id::text || ':driver:pickup'
    )
    AND status IN ('pending', 'processing');

    RETURN OLD;
END;
$function$;

DROP TRIGGER IF EXISTS trg_queue_pickup_reminders ON public.trip_driver_assignments;
CREATE TRIGGER trg_queue_pickup_reminders
AFTER INSERT OR UPDATE OF pickup_time, pickup_location, external_driver_id, day_number
ON public.trip_driver_assignments
FOR EACH ROW
EXECUTE FUNCTION public.queue_pickup_reminders_from_assignment();

DROP TRIGGER IF EXISTS trg_cancel_pickup_reminders_delete ON public.trip_driver_assignments;
CREATE TRIGGER trg_cancel_pickup_reminders_delete
AFTER DELETE
ON public.trip_driver_assignments
FOR EACH ROW
EXECUTE FUNCTION public.cancel_pickup_reminders_on_assignment_delete();

-- ================================================
-- REALTIME SUBSCRIPTIONS
-- ================================================
-- Enable realtime for driver locations (for live tracking)
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
