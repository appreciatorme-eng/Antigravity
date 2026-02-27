create table if not exists public.social_posts (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  created_by uuid references auth.users(id) on delete set null,
  template_id text not null,
  template_data jsonb default '{}'::jsonb not null,
  caption_instagram text,
  caption_facebook text,
  hashtags text,
  rendered_image_url text,
  rendered_image_urls text[],
  status text default 'draft'::text not null,
  source text default 'manual'::text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.social_media_library (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  file_path text not null,
  source text default 'upload'::text not null,
  source_contact_phone text,
  caption text,
  mime_type text,
  tags jsonb default '[]'::jsonb,
  created_at timestamptz default now() not null
);

create table if not exists public.social_reviews (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  reviewer_name text not null,
  trip_name text,
  destination text,
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  source text default 'manual'::text not null,
  is_featured boolean default false not null,
  created_at timestamptz default now() not null
);

create table if not exists public.social_connections (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  platform text not null,
  platform_page_id text not null,
  access_token_encrypted text not null,
  token_expires_at timestamptz,
  refresh_token_encrypted text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(organization_id, platform, platform_page_id)
);

create table if not exists public.social_post_queue (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.social_posts(id) on delete cascade not null,
  platform text not null,
  connection_id uuid references public.social_connections(id) on delete cascade not null,
  scheduled_for timestamptz not null,
  status text default 'pending'::text not null,
  attempts integer default 0 not null,
  error_message text,
  platform_post_id text,
  platform_post_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.social_posts enable row level security;
alter table public.social_media_library enable row level security;
alter table public.social_reviews enable row level security;
alter table public.social_connections enable row level security;
alter table public.social_post_queue enable row level security;

create policy "org members can manage social_posts" on public.social_posts for all using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));
create policy "org members can manage social_media_library" on public.social_media_library for all using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));
create policy "org members can manage social_reviews" on public.social_reviews for all using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));
create policy "org members can manage social_connections" on public.social_connections for all using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));

create policy "org members can manage social_post_queue" on public.social_post_queue for all 
using (
  exists (
    select 1 from public.social_posts sp 
    where sp.id = social_post_queue.post_id and public.is_org_admin(sp.organization_id)
  )
)
with check (
  exists (
    select 1 from public.social_posts sp 
    where sp.id = post_id and public.is_org_admin(sp.organization_id)
  )
);

-- create buckets and policies
insert into storage.buckets (id, name, public) 
values ('social-media', 'social-media', true)
on conflict (id) do nothing;

create policy "public read social-media" on storage.objects for select 
using (bucket_id = 'social-media');

create policy "auth insert social-media" on storage.objects for insert 
with check (bucket_id = 'social-media' and auth.role() = 'authenticated');

create policy "auth update social-media" on storage.objects for update 
using (bucket_id = 'social-media' and auth.role() = 'authenticated');

create policy "auth delete social-media" on storage.objects for delete 
using (bucket_id = 'social-media' and auth.role() = 'authenticated');
