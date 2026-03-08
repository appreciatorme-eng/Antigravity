-- Security round two hardening for recent product tables.
-- This migration audits and hardens RLS on tables added during the web/product sprint.

ALTER TABLE IF EXISTS public.payment_links FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organization_settings FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'marketplace_profiles'
  ) THEN
    EXECUTE 'ALTER TABLE public.marketplace_profiles ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.marketplace_profiles FORCE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "org_members_view_marketplace_profile" ON public.marketplace_profiles';
    EXECUTE $sql$
      CREATE POLICY "org_members_view_marketplace_profile"
        ON public.marketplace_profiles
        FOR SELECT
        USING (organization_id = public.get_user_organization_id())
    $sql$;

    EXECUTE 'DROP POLICY IF EXISTS "org_admin_manage_marketplace_profile_insert" ON public.marketplace_profiles';
    EXECUTE $sql$
      CREATE POLICY "org_admin_manage_marketplace_profile_insert"
        ON public.marketplace_profiles
        FOR INSERT
        WITH CHECK (public.is_org_admin(organization_id))
    $sql$;

    EXECUTE 'DROP POLICY IF EXISTS "org_admin_manage_marketplace_profile_update" ON public.marketplace_profiles';
    EXECUTE $sql$
      CREATE POLICY "org_admin_manage_marketplace_profile_update"
        ON public.marketplace_profiles
        FOR UPDATE
        USING (public.is_org_admin(organization_id))
        WITH CHECK (public.is_org_admin(organization_id))
    $sql$;

    EXECUTE 'DROP POLICY IF EXISTS "org_admin_manage_marketplace_profile_delete" ON public.marketplace_profiles';
    EXECUTE $sql$
      CREATE POLICY "org_admin_manage_marketplace_profile_delete"
        ON public.marketplace_profiles
        FOR DELETE
        USING (public.is_org_admin(organization_id))
    $sql$;

    EXECUTE 'DROP VIEW IF EXISTS public.public_marketplace_profiles';
    EXECUTE $sql$
      CREATE VIEW public.public_marketplace_profiles AS
      SELECT
        id,
        organization_id,
        description,
        service_regions,
        specialties,
        gallery_urls,
        is_verified,
        verification_status,
        verification_level,
        verified_at,
        listing_quality_score,
        updated_at
      FROM public.marketplace_profiles
    $sql$;

    EXECUTE 'COMMENT ON VIEW public.public_marketplace_profiles IS ''Safe marketplace projection without operational fields like rate cards or compliance metadata.''';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'organization_settings'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "org_settings_update" ON public.organization_settings';
    EXECUTE $sql$
      CREATE POLICY "org_settings_update"
        ON public.organization_settings
        FOR UPDATE
        USING (public.is_org_admin(organization_id))
        WITH CHECK (public.is_org_admin(organization_id))
    $sql$;

    EXECUTE 'DROP POLICY IF EXISTS "org_settings_delete" ON public.organization_settings';
    EXECUTE $sql$
      CREATE POLICY "org_settings_delete"
        ON public.organization_settings
        FOR DELETE
        USING (public.is_org_admin(organization_id))
    $sql$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'subscriptions'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Organizations can update their subscriptions" ON public.subscriptions';
    EXECUTE $sql$
      CREATE POLICY "Organizations can update their subscriptions"
        ON public.subscriptions
        FOR UPDATE
        USING (organization_id = public.get_user_organization_id())
        WITH CHECK (organization_id = public.get_user_organization_id())
    $sql$;
  END IF;
END $$;
