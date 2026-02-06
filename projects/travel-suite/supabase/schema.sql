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
-- PUSH TOKENS (Expo push notification tokens)
-- ================================================
CREATE TABLE IF NOT EXISTS public.push_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    expo_push_token TEXT NOT NULL,
    device_type TEXT CHECK (device_type IN ('ios', 'android')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, expo_push_token)
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
    notification_type TEXT NOT NULL CHECK (notification_type IN ('trip_confirmed', 'driver_assigned', 'daily_briefing', 'client_landed', 'itinerary_update')),
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
-- REALTIME SUBSCRIPTIONS
-- ================================================
-- Enable realtime for driver locations (for live tracking)
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
