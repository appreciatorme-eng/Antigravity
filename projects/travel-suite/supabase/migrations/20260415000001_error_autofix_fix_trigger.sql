-- Fix: embed CRON_SECRET directly instead of reading from app.settings
-- (Supabase restricts ALTER DATABASE / ALTER ROLE to superuser; app.settings
--  cannot be set through normal MCP/CLI access)

create or replace function public.trigger_error_autofix()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
    request_id bigint;
begin
    if new.status <> 'open' then
        return new;
    end if;

    select into request_id
        net.http_post(
            url     := 'https://tripbuilt.com/api/webhooks/error-autofix',
            headers := jsonb_build_object(
                'Content-Type',           'application/json',
                'Authorization',          'Bearer 242624badf1e0a221ada851677d88b7e10a07403eda51a8c20e749957299ac36',
                'x-cron-idempotency-key', new.id::text
            ),
            body    := jsonb_build_object('error_event_id', new.id::text)
        );

    raise log 'error_autofix: fired for error_event % (request_id: %)', new.id, request_id;

    return new;
exception
    when others then
        raise warning 'error_autofix trigger: failed to fire for error_event %: %', new.id, SQLERRM;
        return new;
end;
$function$;
