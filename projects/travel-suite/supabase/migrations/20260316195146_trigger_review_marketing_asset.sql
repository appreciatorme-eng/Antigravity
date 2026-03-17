-- Enable pg_net extension for async HTTP requests
create extension if not exists pg_net;

-- Function to invoke edge function for marketing asset generation
create or replace function public.invoke_review_marketing_asset_processor()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
    function_url text;
    cron_secret text;
    request_id bigint;
begin
    -- Only process 5-star reviews with non-empty comments
    if new.rating < 5 or new.comment is null or trim(new.comment) = '' then
        return new;
    end if;

    -- Get environment variables for edge function URL
    -- The edge function URL format: https://<project-ref>.supabase.co/functions/v1/<function-name>
    function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/process-review-marketing';
    cron_secret := current_setting('app.settings.cron_secret', true);

    -- If settings are not configured, skip invocation
    if function_url is null or cron_secret is null then
        raise warning 'Supabase function URL or cron secret not configured - skipping marketing asset generation for review %', new.id;
        return new;
    end if;

    -- Make async HTTP POST request to edge function
    -- pg_net.http_post returns request_id for tracking
    select into request_id
        net.http_post(
            url := function_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || cron_secret
            ),
            body := jsonb_build_object(
                'reviewId', new.id::text,
                'organizationId', new.organization_id::text
            )
        );

    raise log 'Triggered marketing asset generation for review % (request_id: %)', new.id, request_id;

    return new;
exception
    when others then
        -- Log error but don't fail the review insert
        raise warning 'Failed to invoke marketing asset processor for review %: %', new.id, SQLERRM;
        return new;
end;
$function$;

-- Drop existing trigger if it exists
drop trigger if exists trigger_review_marketing_asset on public.reputation_reviews;

-- Create trigger on reputation_reviews table
create trigger trigger_review_marketing_asset
after insert on public.reputation_reviews
for each row
execute function public.invoke_review_marketing_asset_processor();

-- Add comment for documentation
comment on trigger trigger_review_marketing_asset on public.reputation_reviews is
'Automatically generates marketing assets for 5-star reviews with comments by invoking the process-review-marketing edge function';
