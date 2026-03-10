-- Migration: Fix handle_new_user trigger — add role field
-- Root cause: profiles_role_check constraint (added in 20260315100000) requires
-- role IN ('admin', 'super_admin', 'manager', 'driver', 'staff'), but the trigger
-- was not updated to supply a role value. New signups inserted NULL → constraint
-- violation → Supabase auth returned 500 "Database error saving new user".
-- Self-registering users are tour operators, so role='admin' is correct.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        avatar_url,
        role,
        lead_status,
        lifecycle_stage,
        client_tag
    ) VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        'admin',
        'new',
        'lead',
        'standard'
    );
    RETURN NEW;
END;
$$;
