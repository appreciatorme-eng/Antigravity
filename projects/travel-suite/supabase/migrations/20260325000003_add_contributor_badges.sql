-- Add contributor_badge_tier column to profiles table for shared itinerary template marketplace
-- Badge tiers: Bronze (1 template), Silver (5 templates), Gold (10 templates)

alter table public.profiles
    add column if not exists contributor_badge_tier text
    default 'none'
    check (contributor_badge_tier in ('none', 'bronze', 'silver', 'gold'));

-- Create an index for querying contributors by badge tier
create index if not exists idx_profiles_contributor_badge_tier
    on public.profiles(contributor_badge_tier)
    where contributor_badge_tier != 'none';
