-- Break RLS recursion between trips and trip_driver_assignments.
-- Root cause:
-- - trips policy queried trip_driver_assignments
-- - trip_driver_assignments policies query trips
-- This can recurse during policy evaluation.

create or replace function public.driver_has_external_trip_assignment(
    target_trip_id uuid,
    actor_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.trip_driver_assignments a
        join public.driver_accounts da
          on da.external_driver_id = a.external_driver_id
         and da.is_active = true
        where a.trip_id = target_trip_id
          and da.profile_id = actor_user_id
    );
$$;

drop policy if exists "Drivers can view trips via external driver assignments" on public.trips;
create policy "Drivers can view trips via external driver assignments"
    on public.trips
    for select
    using (public.driver_has_external_trip_assignment(trips.id, auth.uid()));
