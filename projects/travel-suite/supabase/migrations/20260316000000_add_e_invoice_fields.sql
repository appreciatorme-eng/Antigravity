-- Add e-invoicing fields to invoices table for GST compliance

-- Add e-invoice columns to existing invoices table
alter table public.invoices
    add column if not exists irn text,
    add column if not exists e_invoice_json jsonb,
    add column if not exists e_invoice_status text check (e_invoice_status in ('pending', 'generated', 'acknowledged', 'failed', 'cancelled')),
    add column if not exists qr_code_data text,
    add column if not exists e_invoice_error text,
    add column if not exists e_invoice_generated_at timestamptz,
    add column if not exists e_invoice_acknowledged_at timestamptz,
    add column if not exists e_invoice_cancelled_at timestamptz;

-- Create index for e-invoice status queries
create index if not exists idx_invoices_e_invoice_status
    on public.invoices(organization_id, e_invoice_status, created_at desc)
    where e_invoice_status is not null;

-- Create unique index for IRN (Invoice Reference Number)
create unique index if not exists idx_invoices_irn_unique
    on public.invoices(irn)
    where irn is not null;

-- Add comment for documentation
comment on column public.invoices.irn is 'Invoice Reference Number from government IRP (Invoice Registration Portal)';
comment on column public.invoices.e_invoice_json is 'Signed e-invoice JSON response from IRP API';
comment on column public.invoices.e_invoice_status is 'E-invoice generation status: pending, generated, acknowledged, failed, cancelled';
comment on column public.invoices.qr_code_data is 'QR code data string per GST e-invoice specification';
comment on column public.invoices.e_invoice_error is 'Error message if e-invoice generation failed';

-- Create e_invoice_settings table for organization credentials and configuration
create table if not exists public.e_invoice_settings (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid references public.organizations(id) on delete cascade not null,
    gstin text not null,
    irp_username text,
    irp_password_encrypted text,
    irp_api_key_encrypted text,
    threshold_amount numeric(12,2) not null default 0,
    auto_generate_enabled boolean not null default false,
    sandbox_mode boolean not null default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique (organization_id)
);

create index if not exists idx_e_invoice_settings_org
    on public.e_invoice_settings(organization_id);

alter table public.e_invoice_settings enable row level security;

create policy "Admins can manage e-invoice settings"
    on public.e_invoice_settings for all
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
              and profiles.role = 'admin'
              and profiles.organization_id = e_invoice_settings.organization_id
        )
    );

comment on table public.e_invoice_settings is 'E-invoicing configuration and IRP credentials per organization';
comment on column public.e_invoice_settings.gstin is 'Organization GSTIN (Goods and Services Tax Identification Number)';
comment on column public.e_invoice_settings.irp_username is 'Username for IRP (Invoice Registration Portal) API';
comment on column public.e_invoice_settings.irp_password_encrypted is 'Encrypted password for IRP API authentication';
comment on column public.e_invoice_settings.irp_api_key_encrypted is 'Encrypted API key for IRP service';
comment on column public.e_invoice_settings.threshold_amount is 'Minimum invoice amount (INR) for automatic e-invoice generation';
comment on column public.e_invoice_settings.auto_generate_enabled is 'Whether to automatically generate e-invoices for qualifying invoices';
comment on column public.e_invoice_settings.sandbox_mode is 'Whether to use IRP sandbox/test environment (true) or production (false)';
