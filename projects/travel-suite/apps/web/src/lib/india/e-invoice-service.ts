// E-invoice registration and management service for GST compliance via IRP

import { irpClient } from './irp-client';
import { PaymentServiceError } from '../payments/errors';
import { getPaymentClient, wrapPaymentError } from '../payments/payment-utils';
import { logPaymentEvent } from '../payments/payment-logger';
import type { Database } from '@/lib/database.types';
import type {
  IRNGenerationRequest,
  IRPCredentials,
} from './irp-client';
import type {
  PaymentExecutionContext,
  PaymentExecutionOptions,
} from '../payments/payment-types';

const REGISTER_INVOICE_SELECT = [
  'id',
  'organization_id',
  'invoice_number',
  'total_amount',
  'subtotal',
  'cgst',
  'sgst',
  'igst',
  'gstin',
  'place_of_supply',
  'sac_code',
  'created_at',
].join(', ');

type InvoiceForRegistration = Pick<
  Database['public']['Tables']['invoices']['Row'],
  | 'id'
  | 'organization_id'
  | 'invoice_number'
  | 'total_amount'
  | 'subtotal'
  | 'cgst'
  | 'sgst'
  | 'igst'
  | 'gstin'
  | 'place_of_supply'
  | 'sac_code'
  | 'created_at'
>;

const CANCEL_INVOICE_SELECT = [
  'id',
  'organization_id',
  'invoice_number',
  'irn',
  'e_invoice_status',
].join(', ');

type InvoiceForCancellation = Pick<
  Database['public']['Tables']['invoices']['Row'],
  'id' | 'organization_id' | 'invoice_number' | 'irn' | 'e_invoice_status'
>;

export interface RegisterEInvoiceOptions {
  invoiceId: string;
  sellerDetails: {
    legalName: string;
    address1: string;
    address2?: string;
    location: string;
    pincode: number;
    stateCode: string;
  };
  buyerDetails: {
    gstin?: string;
    legalName: string;
    address1: string;
    address2?: string;
    location: string;
    pincode: number;
    stateCode: string;
  };
  items?: Array<{
    description?: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
}

export interface CancelEInvoiceOptions {
  invoiceId: string;
  reason: string;
  remarks: string;
}

/**
 * Fetches IRP credentials for an organization
 */
async function getIRPCredentials(
  organizationId: string,
  execution: PaymentExecutionOptions = {}
): Promise<IRPCredentials> {
  const context: PaymentExecutionContext = execution.context || 'user_session';

  try {
    const supabase = await getPaymentClient(context);

    const { data: settings, error } = await supabase
      .from('e_invoice_settings')
      .select('gstin, irp_username, irp_password_encrypted, sandbox_mode')
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      throw new PaymentServiceError({
        code: 'payments_db_error',
        operation: 'create_invoice',
        message: error.message,
        tags: { context, organization_id: organizationId, severity: 'high' },
        cause: error,
      });
    }

    if (!settings) {
      throw new PaymentServiceError({
        code: 'payments_not_found',
        operation: 'create_invoice',
        message: 'E-invoice settings not found for organization',
        tags: { context, organization_id: organizationId, severity: 'medium' },
      });
    }

    if (!settings.gstin || !settings.irp_username || !settings.irp_password_encrypted) {
      throw new PaymentServiceError({
        code: 'payments_config_error',
        operation: 'create_invoice',
        message: 'Incomplete IRP credentials - please configure GSTIN, username, and password',
        tags: { context, organization_id: organizationId, severity: 'high' },
      });
    }

    return {
      gstin: settings.gstin,
      username: settings.irp_username,
      password: settings.irp_password_encrypted,
      sandboxMode: settings.sandbox_mode ?? true,
    };
  } catch (error) {
    wrapPaymentError(error, {
      code: 'payments_db_error',
      operation: 'create_invoice',
      context,
      message: 'Failed to fetch IRP credentials',
      tags: { organization_id: organizationId },
    });
  }
}

/**
 * Register an invoice with the IRP (Invoice Registration Portal) to generate IRN
 */
export async function registerEInvoice(
  options: RegisterEInvoiceOptions,
  execution: PaymentExecutionOptions = {}
): Promise<{ irn: string; ackNo: string; qrCode: string }> {
  const context: PaymentExecutionContext = execution.context || 'user_session';

  try {
    const supabase = await getPaymentClient(context);

    // Fetch invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(REGISTER_INVOICE_SELECT)
      .eq('id', options.invoiceId)
      .single();
    const invoiceRow = invoice as unknown as InvoiceForRegistration | null;

    if (invoiceError) {
      throw new PaymentServiceError({
        code: 'payments_db_error',
        operation: 'create_invoice',
        message: invoiceError.message,
        tags: { context, invoice_id: options.invoiceId, severity: 'high' },
        cause: invoiceError,
      });
    }

    if (!invoiceRow) {
      throw new PaymentServiceError({
        code: 'payments_not_found',
        operation: 'create_invoice',
        message: 'Invoice not found',
        tags: { context, invoice_id: options.invoiceId, severity: 'medium' },
      });
    }

    // Get IRP credentials
    const credentials = await getIRPCredentials(invoiceRow.organization_id, execution);

    // Determine supply type (B2B if buyer has GSTIN, B2C otherwise)
    const supplyType = options.buyerDetails.gstin ? 'B2B' : 'B2C';

    // Format invoice date as DD/MM/YYYY
    const invoiceDate = new Date(invoiceRow.created_at || Date.now());
    const formattedDate = `${String(invoiceDate.getDate()).padStart(2, '0')}/${String(invoiceDate.getMonth() + 1).padStart(2, '0')}/${invoiceDate.getFullYear()}`;

    // Determine if this is IGST (inter-state) or CGST+SGST (intra-state)
    const isIGST = (invoiceRow.igst ?? 0) > 0;
    const placeOfSupply = invoiceRow.place_of_supply || options.buyerDetails.stateCode;

    // Build item list
    const itemList = options.items && options.items.length > 0
      ? options.items.map((item, index) => {
          const itemSubtotal = item.amount;
          const gstRate = invoiceRow.total_amount > 0
            ? ((invoiceRow.total_amount - (invoiceRow.subtotal || 0)) / (invoiceRow.subtotal || 1)) * 100
            : 0;

          return {
            slNo: String(index + 1),
            isServc: 'Y',
            hsnCd: invoiceRow.sac_code || '998314',
            prdDesc: item.description || 'Travel Services',
            qty: item.quantity,
            unit: 'OTH',
            unitPrice: item.unitPrice,
            totAmt: itemSubtotal,
            assAmt: itemSubtotal,
            gstRt: Math.round(gstRate * 100) / 100,
            ...(isIGST
              ? { igstAmt: (itemSubtotal * gstRate) / 100 }
              : {
                  cgstAmt: (itemSubtotal * (gstRate / 2)) / 100,
                  sgstAmt: (itemSubtotal * (gstRate / 2)) / 100,
                }),
            totItemVal: item.amount,
          };
        })
      : [
          {
            slNo: '1',
            isServc: 'Y',
            hsnCd: invoiceRow.sac_code || '998314',
            prdDesc: 'Travel Services',
            qty: 1,
            unit: 'OTH',
            unitPrice: invoiceRow.subtotal || invoiceRow.total_amount,
            totAmt: invoiceRow.subtotal || invoiceRow.total_amount,
            assAmt: invoiceRow.subtotal || invoiceRow.total_amount,
            gstRt: invoiceRow.total_amount > 0
              ? Math.round(
                  ((invoiceRow.total_amount - (invoiceRow.subtotal || 0)) /
                    (invoiceRow.subtotal || 1)) *
                    10000
                ) / 100
              : 0,
            ...(isIGST
              ? { igstAmt: invoiceRow.igst || 0 }
              : {
                  cgstAmt: invoiceRow.cgst || 0,
                  sgstAmt: invoiceRow.sgst || 0,
                }),
            totItemVal: invoiceRow.total_amount,
          },
        ];

    // Build IRP request payload
    const irnRequest: IRNGenerationRequest = {
      version: '1.1',
      tranDtls: {
        taxSch: 'GST',
        supTyp: supplyType,
      },
      docDtls: {
        typ: 'INV',
        no: invoiceRow.invoice_number,
        dt: formattedDate,
      },
      sellerDtls: {
        gstin: invoiceRow.gstin || credentials.gstin,
        lglNm: options.sellerDetails.legalName,
        addr1: options.sellerDetails.address1,
        addr2: options.sellerDetails.address2,
        loc: options.sellerDetails.location,
        pin: options.sellerDetails.pincode,
        stcd: options.sellerDetails.stateCode,
      },
      buyerDtls: {
        gstin: options.buyerDetails.gstin,
        lglNm: options.buyerDetails.legalName,
        pos: placeOfSupply,
        addr1: options.buyerDetails.address1,
        addr2: options.buyerDetails.address2,
        loc: options.buyerDetails.location,
        pin: options.buyerDetails.pincode,
        stcd: options.buyerDetails.stateCode,
      },
      itemList,
      valDtls: {
        assVal: invoiceRow.subtotal || invoiceRow.total_amount,
        ...(isIGST
          ? { igstVal: invoiceRow.igst || 0 }
          : {
              cgstVal: invoiceRow.cgst || 0,
              sgstVal: invoiceRow.sgst || 0,
            }),
        totInvVal: invoiceRow.total_amount,
      },
    };

    // Update invoice status to pending
    await supabase
      .from('invoices')
      .update({ e_invoice_status: 'pending' })
      .eq('id', options.invoiceId);

    // Generate IRN via IRP
    const irnResponse = await irpClient.generateIRN(credentials, irnRequest);

    if (irnResponse.status === 'error' || !irnResponse.irn || !irnResponse.ackNo) {
      // Update invoice with error
      await supabase
        .from('invoices')
        .update({
          e_invoice_status: 'failed',
          e_invoice_error: irnResponse.message || 'IRN generation failed',
        })
        .eq('id', options.invoiceId);

      await logPaymentEvent(
        supabase,
        {
          organizationId: invoiceRow.organization_id,
          invoiceId: options.invoiceId,
          eventType: 'e_invoice.generation_failed',
          status: 'failed',
          errorDescription: irnResponse.message,
          errorCode: irnResponse.errorCode,
          metadata: { irnResponse },
        },
        context
      );

      throw new PaymentServiceError({
        code: 'payments_provider_error',
        operation: 'create_invoice',
        message: irnResponse.message || 'IRN generation failed',
        tags: {
          context,
          organization_id: invoiceRow.organization_id,
          invoice_id: options.invoiceId,
          severity: 'high',
        },
      });
    }

    // Update invoice with IRN and signed data
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        irn: irnResponse.irn,
        e_invoice_json: irnResponse.signedInvoice
          ? JSON.parse(Buffer.from(irnResponse.signedInvoice, 'base64').toString('utf-8'))
          : null,
        e_invoice_status: 'acknowledged',
        qr_code_data: irnResponse.signedQRCode || null,
        e_invoice_generated_at: new Date().toISOString(),
        e_invoice_acknowledged_at: irnResponse.ackDt || new Date().toISOString(),
      })
      .eq('id', options.invoiceId);

    if (updateError) {
      throw new PaymentServiceError({
        code: 'payments_db_error',
        operation: 'create_invoice',
        message: updateError.message,
        tags: { context, invoice_id: options.invoiceId, severity: 'high' },
        cause: updateError,
      });
    }

    await logPaymentEvent(
      supabase,
      {
        organizationId: invoiceRow.organization_id,
        invoiceId: options.invoiceId,
        eventType: 'e_invoice.generated',
        externalId: irnResponse.irn,
        amount: invoiceRow.total_amount,
        currency: 'INR',
        status: 'acknowledged',
        metadata: {
          irn: irnResponse.irn,
          ackNo: irnResponse.ackNo,
          ackDt: irnResponse.ackDt,
        },
      },
      context
    );

    return {
      irn: irnResponse.irn,
      ackNo: irnResponse.ackNo,
      qrCode: irnResponse.signedQRCode || '',
    };
  } catch (error) {
    wrapPaymentError(error, {
      code: 'payments_provider_error',
      operation: 'create_invoice',
      context,
      message: 'Failed to register e-invoice',
      tags: { invoice_id: options.invoiceId },
    });
  }
}

/**
 * Cancel a previously generated e-invoice
 * Can only be cancelled within 24 hours of generation
 */
export async function cancelEInvoice(
  options: CancelEInvoiceOptions,
  execution: PaymentExecutionOptions = {}
): Promise<void> {
  const context: PaymentExecutionContext = execution.context || 'user_session';

  try {
    const supabase = await getPaymentClient(context);

    // Fetch invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(CANCEL_INVOICE_SELECT)
      .eq('id', options.invoiceId)
      .single();
    const invoiceRow = invoice as unknown as InvoiceForCancellation | null;

    if (invoiceError) {
      throw new PaymentServiceError({
        code: 'payments_db_error',
        operation: 'create_invoice',
        message: invoiceError.message,
        tags: { context, invoice_id: options.invoiceId, severity: 'high' },
        cause: invoiceError,
      });
    }

    if (!invoiceRow) {
      throw new PaymentServiceError({
        code: 'payments_not_found',
        operation: 'create_invoice',
        message: 'Invoice not found',
        tags: { context, invoice_id: options.invoiceId, severity: 'medium' },
      });
    }

    if (!invoiceRow.irn) {
      throw new PaymentServiceError({
        code: 'payments_invalid_input',
        operation: 'create_invoice',
        message: 'Invoice does not have an IRN - cannot cancel',
        tags: { context, invoice_id: options.invoiceId, severity: 'medium' },
      });
    }

    if (invoiceRow.e_invoice_status === 'cancelled') {
      return;
    }

    // Get IRP credentials
    const credentials = await getIRPCredentials(invoiceRow.organization_id, execution);

    // Cancel IRN via IRP
    const cancelResponse = await irpClient.cancelIRN(credentials, {
      irn: invoiceRow.irn,
      cnlRsn: '1',
      cnlRem: options.remarks,
    });

    if (cancelResponse.status === 'error') {
      await logPaymentEvent(
        supabase,
        {
          organizationId: invoiceRow.organization_id,
          invoiceId: options.invoiceId,
          eventType: 'e_invoice.cancellation_failed',
          externalId: invoiceRow.irn,
          status: 'failed',
          errorDescription: cancelResponse.message,
          errorCode: cancelResponse.errorCode,
          metadata: { cancelResponse },
        },
        context
      );

      throw new PaymentServiceError({
        code: 'payments_provider_error',
        operation: 'create_invoice',
        message: cancelResponse.message || 'IRN cancellation failed',
        tags: {
          context,
          organization_id: invoiceRow.organization_id,
          invoice_id: options.invoiceId,
          severity: 'high',
        },
      });
    }

    // Update invoice status
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        e_invoice_status: 'cancelled',
        e_invoice_cancelled_at: cancelResponse.cancelDate || new Date().toISOString(),
      })
      .eq('id', options.invoiceId);

    if (updateError) {
      throw new PaymentServiceError({
        code: 'payments_db_error',
        operation: 'create_invoice',
        message: updateError.message,
        tags: { context, invoice_id: options.invoiceId, severity: 'high' },
        cause: updateError,
      });
    }

    await logPaymentEvent(
      supabase,
      {
        organizationId: invoiceRow.organization_id,
        invoiceId: options.invoiceId,
        eventType: 'e_invoice.cancelled',
        externalId: invoiceRow.irn,
        status: 'cancelled',
        metadata: {
          irn: invoiceRow.irn,
          cancelDate: cancelResponse.cancelDate,
          reason: options.reason,
          remarks: options.remarks,
        },
      },
      context
    );
  } catch (error) {
    wrapPaymentError(error, {
      code: 'payments_provider_error',
      operation: 'create_invoice',
      context,
      message: 'Failed to cancel e-invoice',
      tags: { invoice_id: options.invoiceId },
    });
  }
}

/**
 * Get the current status of an e-invoice from IRP
 */
export async function getEInvoiceStatus(
  invoiceId: string,
  execution: PaymentExecutionOptions = {}
): Promise<{ status: 'ACT' | 'CNL'; irn: string; ackNo?: string }> {
  const context: PaymentExecutionContext = execution.context || 'user_session';

  try {
    const supabase = await getPaymentClient(context);

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, organization_id, irn')
      .eq('id', invoiceId)
      .single();

    if (invoiceError) {
      throw new PaymentServiceError({
        code: 'payments_db_error',
        operation: 'create_invoice',
        message: invoiceError.message,
        tags: { context, invoice_id: invoiceId, severity: 'high' },
        cause: invoiceError,
      });
    }

    if (!invoice) {
      throw new PaymentServiceError({
        code: 'payments_not_found',
        operation: 'create_invoice',
        message: 'Invoice not found',
        tags: { context, invoice_id: invoiceId, severity: 'medium' },
      });
    }

    if (!invoice.irn) {
      throw new PaymentServiceError({
        code: 'payments_invalid_input',
        operation: 'create_invoice',
        message: 'Invoice does not have an IRN',
        tags: { context, invoice_id: invoiceId, severity: 'medium' },
      });
    }

    const credentials = await getIRPCredentials(invoice.organization_id, execution);
    const statusResponse = await irpClient.getIRNStatus(credentials, invoice.irn);

    if (statusResponse.status === 'error' || !statusResponse.irnStatus) {
      throw new PaymentServiceError({
        code: 'payments_provider_error',
        operation: 'create_invoice',
        message: statusResponse.message || 'Failed to retrieve IRN status',
        tags: {
          context,
          organization_id: invoice.organization_id,
          invoice_id: invoiceId,
          severity: 'medium',
        },
      });
    }

    return {
      status: statusResponse.irnStatus,
      irn: statusResponse.irn || invoice.irn,
      ackNo: statusResponse.ackNo,
    };
  } catch (error) {
    wrapPaymentError(error, {
      code: 'payments_provider_error',
      operation: 'create_invoice',
      context,
      message: 'Failed to get e-invoice status',
      tags: { invoice_id: invoiceId },
    });
  }
}
