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
