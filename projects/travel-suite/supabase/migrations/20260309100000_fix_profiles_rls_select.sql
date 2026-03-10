-- Fix profiles SELECT RLS: restrict cross-org profile reads.
-- Previously "viewable by everyone" (using true) allowed any authenticated user
-- to read all profiles. Now limited to own profile or same organization.

drop policy if exists "Public profiles are viewable by everyone" on public.profiles;

create policy "Profiles viewable within same organization"
  on public.profiles for select
  using (
    auth.uid() = id
    or
    organization_id = (
      select organization_id
      from public.profiles
      where id = auth.uid()
      limit 1
    )
  );
