'use client'

import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Download, MessageSquare, Mail, Printer,
  CheckCircle, Clock, AlertCircle, Building2, User,
  IndianRupee, FileText,
} from 'lucide-react'
import { GlassButton } from '@/components/glass/GlassButton'
import type { GSTInvoiceData } from '@/lib/india/gst'
import { formatINR } from '@/lib/india/formats'

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface GSTInvoiceProps {
  invoiceData: GSTInvoiceData
  onClose?: () => void
  onDownload?: (invoiceData: GSTInvoiceData) => void
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  const d = new Date(date)
  const day   = d.getDate().toString().padStart(2, '0')
  const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]
  const year  = d.getFullYear()
  return `${day} ${month} ${year}`
}

function getDueDate(invoiceDate: Date): string {
  const d = new Date(invoiceDate)
  d.setDate(d.getDate() + 7)
  return formatDate(d)
}

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`
}

function validateGSTIN(gstin: string): boolean {
  // GSTIN: 15-character alphanumeric
  // Format: 2-digit state code + 10-char PAN + 1 entity number + 1 Z + 1 check digit
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  return gstinRegex.test(gstin.toUpperCase())
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────

function PaymentStatusBadge({ status }: { status: GSTInvoiceData['paymentStatus'] }) {
  const styles = {
    paid:    { bg: 'bg-[#00d084]/20 border-[#00d084]/40 text-[#00d084]',    icon: CheckCircle,  label: 'PAID'       },
    partial: { bg: 'bg-amber-400/20 border-amber-400/40 text-amber-400',    icon: Clock,        label: 'PARTIAL'    },
    pending: { bg: 'bg-red-400/20 border-red-400/40 text-red-400',          icon: AlertCircle,  label: 'DUE'        },
  }
  const s = styles[status]
  const Icon = s.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${s.bg}`}>
      <Icon className="w-3 h-3" />
      {s.label}
    </span>
  )
}

// ─── INVOICE PRINT AREA ───────────────────────────────────────────────────────

function InvoicePrintView({ data }: { data: GSTInvoiceData }) {
  const gstinValid = validateGSTIN(data.operator.gstin)

  return (
    <div
      id="gst-invoice-print-area"
      className="bg-white text-gray-900 rounded-2xl overflow-hidden shadow-2xl font-sans"
      style={{ minWidth: '640px' }}
    >
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="bg-[#0a1628] text-white px-8 py-6 flex justify-between items-start">
        <div>
          <div className="text-2xl font-black tracking-tight">{data.operator.name}</div>
          <div className="text-sm text-white/70 mt-1 max-w-xs">{data.operator.address}</div>
          <div className="mt-2 space-y-0.5">
            <div className="text-xs text-white/60">
              GSTIN: <span className={`font-mono font-semibold ${gstinValid ? 'text-[#00d084]' : 'text-amber-400'}`}>
                {data.operator.gstin}
              </span>
              {!gstinValid && <span className="ml-2 text-amber-400/70 text-[10px]">(verify format)</span>}
            </div>
            <div className="text-xs text-white/60">State: {data.operator.state} ({data.operator.stateCode})</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#00d084] mb-1">Tax Invoice</div>
          <div className="text-2xl font-black text-white">{data.invoiceNumber}</div>
          <div className="text-sm text-white/60 mt-1">Date: {formatDate(data.invoiceDate)}</div>
          <div className="text-sm text-white/60">Due: {getDueDate(data.invoiceDate)}</div>
        </div>
      </div>

      {/* ── BILLED TO ──────────────────────────────────────────────────────── */}
      <div className="px-8 py-5 border-b border-gray-100 grid grid-cols-2 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Billed To</span>
          </div>
          <div className="font-bold text-gray-900 text-base">{data.client.name}</div>
          {data.client.address && <div className="text-sm text-gray-600 mt-0.5">{data.client.address}</div>}
          <div className="text-sm text-gray-600 mt-0.5">{data.client.email}</div>
          <div className="text-sm text-gray-600">{data.client.phone}</div>
          {data.client.gstin && (
            <div className="text-xs text-gray-500 mt-1 font-mono">GSTIN: {data.client.gstin}</div>
          )}
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Payment Status</span>
          </div>
          <div className="flex justify-end">
            <PaymentStatusBadge status={data.paymentStatus} />
          </div>
          {data.amountPaid > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              Paid: <span className="font-semibold text-[#00d084]">{formatINR(data.amountPaid)}</span>
            </div>
          )}
          {data.balanceDue > 0 && (
            <div className="text-sm text-gray-600">
              Balance: <span className="font-semibold text-red-500">{formatINR(data.balanceDue)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── LINE ITEMS TABLE ───────────────────────────────────────────────── */}
      <div className="px-8 py-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 text-xs font-bold uppercase tracking-wider text-gray-400 w-[35%]">Description</th>
              <th className="text-center py-2 text-xs font-bold uppercase tracking-wider text-gray-400">HSN/SAC</th>
              <th className="text-center py-2 text-xs font-bold uppercase tracking-wider text-gray-400">Qty</th>
              <th className="text-center py-2 text-xs font-bold uppercase tracking-wider text-gray-400">Unit</th>
              <th className="text-right py-2 text-xs font-bold uppercase tracking-wider text-gray-400">Rate</th>
              <th className="text-right py-2 text-xs font-bold uppercase tracking-wider text-gray-400">Amount</th>
              <th className="text-center py-2 text-xs font-bold uppercase tracking-wider text-gray-400">GST%</th>
              <th className="text-right py-2 text-xs font-bold uppercase tracking-wider text-gray-400">GST</th>
            </tr>
          </thead>
          <tbody>
            {data.lineItems.map((item, i) => (
              <tr key={i} className={`border-b border-gray-50 ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                <td className="py-3 pr-4 text-gray-800 font-medium text-sm leading-snug">{item.description}</td>
                <td className="py-3 text-center font-mono text-xs text-gray-500">{item.hsn}</td>
                <td className="py-3 text-center text-gray-700">{item.quantity}</td>
                <td className="py-3 text-center text-gray-500 text-xs">{item.unit}</td>
                <td className="py-3 text-right text-gray-700">{formatINR(item.rate)}</td>
                <td className="py-3 text-right font-semibold text-gray-800">{formatINR(item.amount)}</td>
                <td className="py-3 text-center text-xs text-gray-500">{formatPercent(item.gstRate)}</td>
                <td className="py-3 text-right text-gray-700">{formatINR(item.gstAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── SUMMARY ────────────────────────────────────────────────────────── */}
      <div className="px-8 pb-6 flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span className="font-medium">{formatINR(data.subtotal)}</span>
          </div>

          {/* CGST + SGST (intra-state) or IGST (inter-state) */}
          {data.gstBreakdown.isInterState ? (
            <div className="flex justify-between text-sm text-gray-600">
              <span>IGST</span>
              <span>{formatINR(data.gstBreakdown.igst)}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-sm text-gray-600">
                <span>CGST</span>
                <span>{formatINR(data.gstBreakdown.cgst)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>SGST ({data.operator.state})</span>
                <span>{formatINR(data.gstBreakdown.sgst)}</span>
              </div>
            </>
          )}

          <div className="flex justify-between font-black text-lg text-gray-900 pt-2 border-t-2 border-gray-300">
            <span>Total</span>
            <span>{formatINR(data.total)}</span>
          </div>

          {/* Amount in words */}
          <div className="text-[10px] text-gray-500 italic leading-snug pt-1">
            {data.amountInWords}
          </div>
        </div>
      </div>

      {/* ── NOTES & TERMS ──────────────────────────────────────────────────── */}
      <div className="px-8 py-5 bg-gray-50 border-t border-gray-100">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Notes & Terms</div>
        <p className="text-xs text-gray-500 leading-relaxed">{data.notes}</p>
        <div className="mt-3 text-xs text-gray-400 leading-relaxed space-y-0.5">
          <p>• This is a computer-generated invoice and does not require a physical signature.</p>
          <p>• GST is charged as per applicable rates under the CGST/SGST/IGST Acts.</p>
          <p>• Disputes must be raised within 48 hours of invoice receipt.</p>
          <p>• Cancellation policy applies as per the tour agreement.</p>
        </div>
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <div className="px-8 py-3 bg-[#0a1628] text-center">
        <div className="text-[10px] text-white/40">
          Generated by TravelSuite • {data.operator.name} • GSTIN: {data.operator.gstin}
        </div>
      </div>
    </div>
  )
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function GSTInvoice({ invoiceData, onClose, onDownload }: GSTInvoiceProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handlePrint = useCallback(() => {
    const printContents = document.getElementById('gst-invoice-print-area')?.innerHTML
    if (!printContents) return

    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>Invoice ${invoiceData.invoiceNumber}</title>
          <style>
            body { font-family: sans-serif; margin: 0; padding: 16px; }
            @media print { body { padding: 0; } }
            table { border-collapse: collapse; width: 100%; }
            th, td { padding: 8px; }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => {
      win.print()
      win.close()
    }, 300)
  }, [invoiceData.invoiceNumber])

  const handleDownload = useCallback(async () => {
    setDownloading(true)
    try {
      onDownload?.(invoiceData)
      // In production this would call a PDF generation API
      // For now we trigger the print dialog as a fallback
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          handlePrint()
          resolve()
        }, 100)
      })
    } finally {
      setTimeout(() => setDownloading(false), 800)
    }
  }, [invoiceData, onDownload, handlePrint])

  const handleEmail = useCallback(() => {
    const subject = encodeURIComponent(`Invoice ${invoiceData.invoiceNumber} – ${invoiceData.operator.name}`)
    const body = encodeURIComponent(
      `Dear ${invoiceData.client.name},\n\n` +
      `Please find attached invoice ${invoiceData.invoiceNumber} for ` +
      `${formatINR(invoiceData.total)}.\n\n` +
      `Balance Due: ${formatINR(invoiceData.balanceDue)}\n` +
      `Payment Due: ${getDueDate(invoiceData.invoiceDate)}\n\n` +
      `Thank you,\n${invoiceData.operator.name}`
    )
    window.open(`mailto:${invoiceData.client.email}?subject=${subject}&body=${body}`)
    setEmailSent(true)
    setTimeout(() => setEmailSent(false), 3000)
  }, [invoiceData])

  const whatsappMsg = encodeURIComponent(
    `Namaste ${invoiceData.client.name}! 🙏\n\n` +
    `Invoice ${invoiceData.invoiceNumber} — ${formatINR(invoiceData.total)}\n` +
    `Balance Due: ${formatINR(invoiceData.balanceDue)}\n\n` +
    `Please complete payment by ${getDueDate(invoiceData.invoiceDate)}.\n\n` +
    `– ${invoiceData.operator.name}`
  )

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex flex-wrap gap-2 justify-end print:hidden">
        <GlassButton
          variant="outline"
          size="sm"
          onClick={handleDownload}
          loading={downloading}
        >
          <Download className="w-4 h-4" />
          Download PDF
        </GlassButton>

        <a
          href={`https://wa.me/${invoiceData.client.phone.replace(/\D/g, '')}?text=${whatsappMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1eb854] text-white text-sm font-semibold transition-all shadow-lg shadow-[#25D366]/20"
        >
          <MessageSquare className="w-4 h-4" />
          WhatsApp
        </a>

        <GlassButton
          variant="outline"
          size="sm"
          onClick={handleEmail}
        >
          <Mail className="w-4 h-4" />
          {emailSent ? 'Email Opened' : 'Email'}
        </GlassButton>

        <GlassButton
          variant="ghost"
          size="sm"
          onClick={handlePrint}
        >
          <Printer className="w-4 h-4" />
          Print
        </GlassButton>
      </div>

      {/* Invoice content */}
      <div ref={printRef} className="overflow-x-auto">
        <InvoicePrintView data={invoiceData} />
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-3 gap-3 print:hidden">
        {[
          { label: 'Subtotal',  value: formatINR(invoiceData.subtotal),     color: 'text-white/70'    },
          { label: 'GST',       value: formatINR(invoiceData.gstBreakdown.totalGST), color: 'text-amber-400' },
          { label: 'Total',     value: formatINR(invoiceData.total),        color: 'text-[#00d084]'   },
        ].map(({ label, value, color }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-xl p-3 text-center"
          >
            <div className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-1">{label}</div>
            <div className={`text-base font-black ${color}`}>{value}</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Re-export helper for external use
export { formatDate, getDueDate }
