create table if not exists public.social_post_metrics (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.social_posts(id) on delete cascade,
  queue_id uuid references public.social_post_queue(id) on delete cascade not null,
  platform text not null,
  likes integer default 0 not null,
  comments integer default 0 not null,
  shares integer default 0 not null,
  reach integer default 0 not null,
  impressions integer default 0 not null,
  engagement_rate numeric(5,2) default 0 not null,
  fetched_at timestamptz not null,
  created_at timestamptz default now() not null
);

alter table public.social_post_metrics enable row level security;

create policy "org members can manage social_post_metrics" on public.social_post_metrics for all
using (
  exists (
    select 1 from public.social_post_queue spq
    join public.social_posts sp on sp.id = spq.post_id
    where spq.id = social_post_metrics.queue_id and public.is_org_admin(sp.organization_id)
  )
)
with check (
  exists (
    select 1 from public.social_post_queue spq
    join public.social_posts sp on sp.id = spq.post_id
    where spq.id = queue_id and public.is_org_admin(sp.organization_id)
  )
);
