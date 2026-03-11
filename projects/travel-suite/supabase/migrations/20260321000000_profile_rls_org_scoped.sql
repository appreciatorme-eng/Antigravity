-- C-08: Replace open profiles RLS policy with org-scoped policy
-- Drop the "Public profiles are viewable by everyone" policy that uses using(true)
-- Replace with org-scoped policy so users can only see profiles in their own organization

DO $$
BEGIN
  -- Drop the overly permissive policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
      AND policyname = 'Public profiles are viewable by everyone.'
  ) THEN
    DROP POLICY "Public profiles are viewable by everyone." ON profiles;
  END IF;

  -- Create org-scoped read policy if it doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
      AND policyname = 'Users can view profiles in their organization'
  ) THEN
    CREATE POLICY "Users can view profiles in their organization"
      ON profiles FOR SELECT
      USING (
        organization_id = (
          SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
        OR id = auth.uid()
      );
  END IF;
END $$;
