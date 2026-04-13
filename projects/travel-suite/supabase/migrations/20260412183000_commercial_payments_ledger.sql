create table if not exists public.commercial_payments (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid references public.organizations(id) on delete cascade not null,
    trip_id uuid references public.trips(id) on delete set null,
    proposal_id uuid references public.proposals(id) on delete set null,
    invoice_id uuid references public.invoices(id) on delete set null,
    amount numeric(12,2) not null,
    currency text not null default 'INR',
    payment_date timestamptz not null default now(),
    status text not null default 'completed' check (status in ('pending', 'completed', 'failed', 'refunded', 'voided')),
    source text not null check (source in ('manual_cash', 'invoice_payment', 'payment_link')),
    method text,
    reference text,
    notes text,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    deleted_at timestamptz
);

create index if not exists idx_commercial_payments_org_payment_date
    on public.commercial_payments(organization_id, payment_date desc);

create index if not exists idx_commercial_payments_trip
    on public.commercial_payments(trip_id, payment_date desc);

create index if not exists idx_commercial_payments_proposal
    on public.commercial_payments(proposal_id, payment_date desc);

create index if not exists idx_commercial_payments_invoice
    on public.commercial_payments(invoice_id, payment_date desc);

create unique index if not exists idx_commercial_payments_source_reference
    on public.commercial_payments(source, reference)
    where reference is not null and deleted_at is null;

alter table public.commercial_payments enable row level security;

drop policy if exists "Admins can manage commercial payments" on public.commercial_payments;
create policy "Admins can manage commercial payments"
    on public.commercial_payments for all
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
              and profiles.role = 'admin'
              and profiles.organization_id = commercial_payments.organization_id
        )
    );

insert into public.commercial_payments (
    organization_id,
    trip_id,
    proposal_id,
    invoice_id,
    amount,
    currency,
    payment_date,
    status,
    source,
    method,
    reference,
    notes,
    created_by,
    created_at,
    updated_at
)
select
    ip.organization_id,
    i.trip_id,
    (
        select p.id
        from public.proposals p
        where p.trip_id = i.trip_id
        order by p.created_at desc
        limit 1
    ) as proposal_id,
    ip.invoice_id,
    ip.amount,
    coalesce(ip.currency, 'INR'),
    coalesce(ip.payment_date, ip.created_at, now()),
    case
        when lower(coalesce(ip.status, '')) in ('completed', 'captured') then 'completed'
        when lower(coalesce(ip.status, '')) = 'refunded' then 'refunded'
        when lower(coalesce(ip.status, '')) = 'failed' then 'failed'
        else 'pending'
    end,
    'invoice_payment',
    ip.method,
    'invoice_payment:' || ip.id::text,
    ip.notes,
    ip.created_by,
    coalesce(ip.created_at, now()),
    now()
from public.invoice_payments ip
join public.invoices i on i.id = ip.invoice_id
where not exists (
    select 1
    from public.commercial_payments cp
    where cp.source = 'invoice_payment'
      and cp.reference = 'invoice_payment:' || ip.id::text
      and cp.deleted_at is null
);

insert into public.commercial_payments (
    organization_id,
    trip_id,
    proposal_id,
    invoice_id,
    amount,
    currency,
    payment_date,
    status,
    source,
    method,
    reference,
    notes,
    created_at,
    updated_at
)
select
    pl.organization_id,
    p.trip_id,
    pl.proposal_id,
    null,
    coalesce(pl.amount_paise, 0) / 100.0,
    coalesce(pl.currency, 'INR'),
    coalesce(pl.paid_at, pl.created_at, now()),
    case
        when lower(coalesce(pl.status, '')) = 'paid' then 'completed'
        when lower(coalesce(pl.status, '')) = 'cancelled' then 'voided'
        when lower(coalesce(pl.status, '')) = 'expired' then 'failed'
        else 'pending'
    end,
    'payment_link',
    'link',
    'payment_link:' || pl.id::text,
    null,
    coalesce(pl.created_at, now()),
    now()
from public.payment_links pl
left join public.proposals p on p.id = pl.proposal_id
where lower(coalesce(pl.status, '')) = 'paid'
  and not exists (
      select 1
      from public.commercial_payments cp
      where cp.source = 'payment_link'
        and cp.reference = 'payment_link:' || pl.id::text
        and cp.deleted_at is null
  );

insert into public.commercial_payments (
    organization_id,
    trip_id,
    proposal_id,
    invoice_id,
    amount,
    currency,
    payment_date,
    status,
    source,
    method,
    reference,
    notes,
    created_at,
    updated_at
)
select
    t.organization_id,
    t.id,
    (
        select p.id
        from public.proposals p
        where p.trip_id = t.id
        order by p.created_at desc
        limit 1
    ) as proposal_id,
    null,
    ((it.raw_data -> 'financial_summary' ->> 'manual_paid_amount')::numeric),
    coalesce(nullif(it.raw_data -> 'pricing' ->> 'currency', ''), 'INR'),
    now(),
    'completed',
    'manual_cash',
    'cash',
    'manual_cash:' || t.id::text,
    nullif(it.raw_data -> 'financial_summary' ->> 'notes', ''),
    now(),
    now()
from public.trips t
join public.itineraries it on it.id = t.itinerary_id
where coalesce(it.raw_data -> 'financial_summary' ->> 'payment_source', '') = 'manual_cash'
  and coalesce(it.raw_data -> 'financial_summary' ->> 'payment_status', '') in ('paid', 'partially_paid')
  and coalesce((it.raw_data -> 'financial_summary' ->> 'manual_paid_amount')::numeric, 0) > 0
  and not exists (
      select 1
      from public.commercial_payments cp
      where cp.source = 'manual_cash'
        and cp.reference = 'manual_cash:' || t.id::text
        and cp.deleted_at is null
  );
