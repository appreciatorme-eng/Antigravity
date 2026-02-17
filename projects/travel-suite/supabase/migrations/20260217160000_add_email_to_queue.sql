alter table public.notification_queue
add column if not exists recipient_email text;

comment on column public.notification_queue.recipient_email is 'Email address for email notifications';
