-- Marketplace verification metadata + client self-service fields for shared itineraries.
-- Idempotent migration for development environments.

alter table if exists public.marketplace_profiles
  add column if not exists verified_at timestamptz,
  add column if not exists verification_notes text,
  add column if not exists verification_level text default 'standard',
  add column if not exists listing_quality_score integer default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'marketplace_profiles_verification_level_check'
  ) then
    alter table public.marketplace_profiles
      add constraint marketplace_profiles_verification_level_check
      check (verification_level in ('standard', 'gold', 'platinum'));
  end if;
end $$;

update public.marketplace_profiles
set verification_level = coalesce(nullif(verification_level, ''), 'standard')
where verification_level is null or verification_level = '';

create index if not exists idx_marketplace_profiles_verified_at
  on public.marketplace_profiles(verified_at desc);

create index if not exists idx_marketplace_profiles_quality
  on public.marketplace_profiles(listing_quality_score desc);

alter table if exists public.shared_itineraries
  add column if not exists client_preferences jsonb default '{}'::jsonb,
  add column if not exists wishlist_items jsonb default '[]'::jsonb,
  add column if not exists self_service_status text default 'active',
  add column if not exists offline_pack_ready boolean default false;

update public.shared_itineraries
set client_preferences = coalesce(client_preferences, '{}'::jsonb),
    wishlist_items = coalesce(wishlist_items, '[]'::jsonb),
    self_service_status = coalesce(nullif(self_service_status, ''), 'active'),
    offline_pack_ready = coalesce(offline_pack_ready, false)
where client_preferences is null
   or wishlist_items is null
   or self_service_status is null
   or self_service_status = ''
   or offline_pack_ready is null;

alter table public.shared_itineraries
  alter column client_preferences set default '{}'::jsonb,
  alter column wishlist_items set default '[]'::jsonb,
  alter column self_service_status set default 'active',
  alter column offline_pack_ready set default false;

create index if not exists idx_shared_itineraries_self_service_status
  on public.shared_itineraries(self_service_status);
