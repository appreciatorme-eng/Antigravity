-- Add unique constraint on queue_id to enable upserts
-- Each queue item should have at most one metrics record

create unique index if not exists idx_social_post_metrics_queue_id
  on public.social_post_metrics(queue_id);
