-- Check what tables exist in the public schema
-- Run this in Supabase Dashboard > SQL Editor

SELECT
    tablename as table_name,
    schemaname as schema_name
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check if critical tables exist
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organizations')
        THEN 'EXISTS' ELSE 'MISSING'
    END as organizations_table,
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles')
        THEN 'EXISTS' ELSE 'MISSING'
    END as profiles_table,
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients')
        THEN 'EXISTS' ELSE 'MISSING'
    END as clients_table,
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'trips')
        THEN 'EXISTS' ELSE 'MISSING'
    END as trips_table;
