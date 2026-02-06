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
