-- Ensure admins can insert/update external drivers within their own organization.
-- The original FOR ALL policy had only USING and could reject INSERTs.

drop policy if exists "Admins can manage external drivers" on public.external_drivers;

create policy "Admins can manage external drivers"
    on public.external_drivers
    for all
    using (
        exists (
            select 1
            from public.profiles
            where profiles.id = auth.uid()
              and profiles.role = 'admin'
              and profiles.organization_id = external_drivers.organization_id
        )
    )
    with check (
        exists (
            select 1
            from public.profiles
            where profiles.id = auth.uid()
              and profiles.role = 'admin'
              and profiles.organization_id = external_drivers.organization_id
        )
    );
