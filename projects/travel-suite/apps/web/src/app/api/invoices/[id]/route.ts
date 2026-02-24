/**
 * Invoice Detail API Routes
 *
 * Endpoints:
 * - GET /api/invoices/[id] - Get invoice details
 * - PUT /api/invoices/[id] - Update invoice
 * - DELETE /api/invoices/[id] - Delete invoice
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { sanitizeText } from '@/lib/security/sanitize';
import type { Database, Json } from '@/lib/database.types';

const InvoiceUpdateSchema = z.object({
  status: z.string().min(1).max(60).optional(),
  notes: z.string().max(2000).optional().nullable(),
  due_date: z.string().optional().nullable(),
});

function asObjectJson(value: Json | null): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function normalizeDueDate(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  if (!Number.isFinite(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Fetch invoice with payments
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        clients(id, name, email, phone),
        invoice_payments(*)
      `)
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Error in GET /api/invoices/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json().catch(() => null);
    const parsed = InvoiceUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid invoice update payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Build update object
    const updates: Database['public']['Tables']['invoices']['Update'] = {};
    const status = sanitizeText(parsed.data.status, { maxLength: 60 });
    if (status) updates.status = status;

    const normalizedDueDate = normalizeDueDate(parsed.data.due_date);
    if (normalizedDueDate !== undefined) {
      updates.due_date = normalizedDueDate;
    }

    if (parsed.data.notes !== undefined) {
      const safeNotes = sanitizeText(parsed.data.notes, {
        maxLength: 2000,
        preserveNewlines: true,
      });
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('metadata')
        .eq('id', id)
        .eq('organization_id', profile.organization_id)
        .maybeSingle();
      const existingMeta = asObjectJson(existingInvoice?.metadata || null);
      updates.metadata = {
        ...existingMeta,
        notes: safeNotes || null,
      };
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No invoice fields to update' }, { status: 400 });
    }

    // Update invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .select('*, clients(name, email)')
      .single();

    if (error) {
      console.error('Error updating invoice:', error);
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
    }

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Error in PUT /api/invoices/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if invoice exists and belongs to organization
    const { data: invoice } = await supabase
      .from('invoices')
      .select('status')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single();

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Don't allow deletion of paid invoices
    if (invoice.status === 'paid') {
      return NextResponse.json(
        { error: 'Cannot delete paid invoice' },
        { status: 400 }
      );
    }

    // Delete invoice
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('organization_id', profile.organization_id);

    if (error) {
      console.error('Error deleting invoice:', error);
      return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/invoices/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
