'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Copy, Check, MessageSquare, Smartphone, Building2,
  QrCode, ChevronRight, IndianRupee, Share2, Printer,
} from 'lucide-react'
import { GlassModal } from '@/components/glass/GlassModal'
import { GlassButton } from '@/components/glass/GlassButton'
import { formatINR } from '@/lib/india/formats'

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface UPIPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  clientName: string
  tripName: string
  operatorUPI: string
  operatorName?: string
  bankDetails?: {
    accountName: string
    accountNumber: string
    ifsc: string
    bankName: string
    branch?: string
  }
  paymentLink?: string
  onPaymentReceived?: (amountReceived: number) => void
}

// ─── CONFIRMATION MODAL ───────────────────────────────────────────────────────

interface ConfirmPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  onConfirm: (received: number) => void
}

function ConfirmPaymentModal({ isOpen, onClose, amount, onConfirm }: ConfirmPaymentModalProps) {
  const [mode, setMode] = useState<'full' | 'partial' | null>(null)
  const [partialAmount, setPartialAmount] = useState('')

  const handleConfirm = () => {
    if (mode === 'full') {
      onConfirm(amount)
    } else if (mode === 'partial') {
      const parsed = parseFloat(partialAmount.replace(/,/g, ''))
      if (!isNaN(parsed) && parsed > 0) {
        onConfirm(parsed)
      }
    }
    onClose()
    setMode(null)
    setPartialAmount('')
  }

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} size="sm" title="Confirm Payment Receipt">
      <div className="space-y-4">
        <p className="text-sm text-white/70">
          Did you receive payment for <span className="text-white font-semibold">{formatINR(amount)}</span>?
        </p>

        <div className="grid grid-cols-2 gap-3">
          {/* Full */}
          <button
            onClick={() => setMode('full')}
            className={`p-3 rounded-xl border text-sm font-medium transition-all ${
              mode === 'full'
                ? 'border-[#00d084] bg-[#00d084]/20 text-[#00d084]'
                : 'border-white/20 text-white/70 hover:border-[#00d084]/50'
            }`}
          >
            Full Amount
            <div className="text-xs font-normal mt-1 opacity-80">{formatINR(amount)}</div>
          </button>

          {/* Partial */}
          <button
            onClick={() => setMode('partial')}
            className={`p-3 rounded-xl border text-sm font-medium transition-all ${
              mode === 'partial'
                ? 'border-amber-400 bg-amber-400/20 text-amber-400'
                : 'border-white/20 text-white/70 hover:border-amber-400/50'
            }`}
          >
            Partial
            <div className="text-xs font-normal mt-1 opacity-80">Enter amount</div>
          </button>
        </div>

        {mode === 'partial' && (
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">Amount Received (₹)</label>
            <input
              type="number"
              value={partialAmount}
              onChange={(e) => setPartialAmount(e.target.value)}
              placeholder="Enter amount received"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#00d084]/50 focus:border-[#00d084] transition-all"
            />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <GlassButton variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </GlassButton>
          <GlassButton
            variant="primary"
            className="flex-1"
            onClick={handleConfirm}
            disabled={!mode || (mode === 'partial' && !partialAmount)}
          >
            <Check className="w-4 h-4" /> Confirm
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  )
}

// ─── COPY BUTTON ──────────────────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).catch(() => {
      // Fallback for older browsers
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [text])

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg hover:bg-white/10 transition-all text-white/60 hover:text-white"
      title={`Copy ${label || 'to clipboard'}`}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span key="check" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }}>
            <Check className="w-3.5 h-3.5 text-[#00d084]" />
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }}>
            <Copy className="w-3.5 h-3.5" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

// ─── QR CODE GENERATOR (CSS-based visual placeholder + data URL) ──────────────

function UPIQRCode({ upiId, amount, name, note }: {
  upiId: string; amount: number; name: string; note: string
}) {
  const upiURI = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&tn=${encodeURIComponent(note)}&cu=INR`

  return (
    <div className="flex flex-col items-center gap-3">
      {/* QR visual: using a styled placeholder with actual UPI URI embedded */}
      <div className="relative">
        <div className="w-44 h-44 bg-white rounded-2xl p-3 flex items-center justify-center shadow-2xl">
          {/* Simulated QR grid pattern */}
          <div className="relative w-full h-full">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Corner position detection patterns */}
              {/* Top-left */}
              <rect x="5" y="5" width="25" height="25" fill="none" stroke="#000" strokeWidth="3" rx="1"/>
              <rect x="10" y="10" width="15" height="15" fill="#000" rx="1"/>
              {/* Top-right */}
              <rect x="70" y="5" width="25" height="25" fill="none" stroke="#000" strokeWidth="3" rx="1"/>
              <rect x="75" y="10" width="15" height="15" fill="#000" rx="1"/>
              {/* Bottom-left */}
              <rect x="5" y="70" width="25" height="25" fill="none" stroke="#000" strokeWidth="3" rx="1"/>
              <rect x="10" y="75" width="15" height="15" fill="#000" rx="1"/>
              {/* Data area - random-looking module pattern based on UPI ID */}
              {Array.from({ length: 12 }, (_, row) =>
                Array.from({ length: 12 }, (_, col) => {
                  const charCode = (upiId.charCodeAt((row * 12 + col) % upiId.length) + row * col) % 3
                  if (charCode === 0) return null
                  const x = 36 + col * 5
                  const y = 36 + row * 5
                  return <rect key={`${row}-${col}`} x={x} y={y} width="4" height="4" fill="#000" rx="0.5"/>
                })
              )}
              {/* Center logo placeholder */}
              <rect x="43" y="43" width="14" height="14" fill="white" rx="2"/>
              <text x="50" y="53" textAnchor="middle" fontSize="8" fill="#00d084" fontWeight="bold">₹</text>
            </svg>
          </div>
        </div>
        {/* UPI badge */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#00d084] text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-lg whitespace-nowrap">
          Scan to Pay
        </div>
      </div>

      {/* UPI URI (hidden, accessible) */}
      <div className="text-center mt-2">
        <div className="text-[10px] text-white/40 mb-1">UPI Payment Link</div>
        <code className="text-[9px] text-white/30 break-all max-w-[180px] block">{upiURI}</code>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

type Tab = 'upi' | 'link' | 'bank'

const UPI_APPS = [
  { name: 'PhonePe',   color: '#5f259f', label: 'PhonePe'   },
  { name: 'GPay',      color: '#1a73e8', label: 'Google Pay' },
  { name: 'Paytm',     color: '#00baf2', label: 'Paytm'     },
  { name: 'BHIM',      color: '#ff6600', label: 'BHIM'      },
]

export function UPIPaymentModal({
  isOpen,
  onClose,
  amount,
  clientName,
  tripName,
  operatorUPI,
  operatorName = 'Tour Operator',
  bankDetails,
  paymentLink,
  onPaymentReceived,
}: UPIPaymentModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('upi')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const defaultBankDetails = bankDetails || {
    accountName:   operatorName,
    accountNumber: 'XXXXXXXXXXXX',
    ifsc:          'SBIN0001234',
    bankName:      'State Bank of India',
    branch:        'Main Branch',
  }

  const generatedLink = paymentLink || `https://pay.example.com/p/${operatorUPI.replace('@', '-')}-${amount}`

  const whatsappMessage = encodeURIComponent(
    `Namaste ${clientName}! 🙏\n\n` +
    `Payment of *${formatINR(amount)}* is due for *${tripName}*.\n\n` +
    `Pay instantly via UPI:\n` +
    `UPI ID: *${operatorUPI}*\n\n` +
    `Or use payment link:\n${generatedLink}\n\n` +
    `For bank transfer:\n` +
    `Account: ${defaultBankDetails.accountNumber}\n` +
    `IFSC: ${defaultBankDetails.ifsc}\n\n` +
    `Thank you! – ${operatorName}`
  )

  const bankWhatsappMessage = encodeURIComponent(
    `Namaste ${clientName}! 🙏\n\n` +
    `Bank transfer details for *${tripName}* (${formatINR(amount)}):\n\n` +
    `Account Name: *${defaultBankDetails.accountName}*\n` +
    `Account No: *${defaultBankDetails.accountNumber}*\n` +
    `IFSC Code: *${defaultBankDetails.ifsc}*\n` +
    `Bank: ${defaultBankDetails.bankName}\n\n` +
    `Please share payment screenshot after transfer.\nThank you! – ${operatorName}`
  )

  const handlePaymentReceived = (received: number) => {
    onPaymentReceived?.(received)
    onClose()
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'upi',  label: 'UPI QR',    icon: <QrCode      className="w-4 h-4" /> },
    { id: 'link', label: 'Pay Link',  icon: <Share2      className="w-4 h-4" /> },
    { id: 'bank', label: 'Bank',      icon: <Building2   className="w-4 h-4" /> },
  ]

  return (
    <>
      <GlassModal
        isOpen={isOpen}
        onClose={onClose}
        size="md"
        title={`Collect Payment`}
      >
        <div className="space-y-5">

          {/* Amount display */}
          <div className="text-center py-4 bg-[#00d084]/10 rounded-2xl border border-[#00d084]/20">
            <div className="text-xs font-bold uppercase tracking-widest text-[#00d084]/70 mb-1">
              Amount Due
            </div>
            <div className="text-4xl font-black text-white tracking-tight">
              {formatINR(amount)}
            </div>
            <div className="text-sm text-white/50 mt-1">
              {tripName} • {clientName}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white/5 rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#00d084] text-white shadow-lg shadow-[#00d084]/20'
                    : 'text-white/50 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {activeTab === 'upi' && (
              <motion.div
                key="upi"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* QR Code */}
                <div className="flex justify-center">
                  <UPIQRCode
                    upiId={operatorUPI}
                    amount={amount}
                    name={operatorName}
                    note={tripName}
                  />
                </div>

                {/* Scan instruction */}
                <p className="text-center text-xs text-white/50">
                  Scan with PhonePe / Google Pay / Paytm / any UPI app
                </p>

                {/* UPI app logos */}
                <div className="flex justify-center gap-3">
                  {UPI_APPS.map((app) => (
                    <div key={app.name} className="flex flex-col items-center gap-1">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[9px] font-black shadow-lg"
                        style={{ backgroundColor: app.color }}
                      >
                        {app.name === 'BHIM' ? '₹' : app.name[0]}
                      </div>
                      <span className="text-[9px] text-white/40">{app.name}</span>
                    </div>
                  ))}
                </div>

                {/* UPI ID row */}
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <div>
                    <div className="text-[10px] text-white/40 mb-0.5">UPI ID</div>
                    <div className="text-sm font-mono font-semibold text-white">{operatorUPI}</div>
                  </div>
                  <CopyButton text={operatorUPI} label="UPI ID" />
                </div>
              </motion.div>
            )}

            {activeTab === 'link' && (
              <motion.div
                key="link"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* WhatsApp send */}
                <a
                  href={`https://wa.me/?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#1eb854] text-white font-semibold text-sm transition-all shadow-lg shadow-[#25D366]/20"
                >
                  <MessageSquare className="w-4 h-4" />
                  Send via WhatsApp
                </a>

                {/* Message preview */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                  <div className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Message Preview</div>
                  <p className="text-xs text-white/70 leading-relaxed whitespace-pre-line font-mono">
                    {`Namaste ${clientName}! 🙏\n\nPayment of ${formatINR(amount)} is due for ${tripName}.\n\nPay via UPI: ${operatorUPI}\nLink: ${generatedLink}`}
                  </p>
                </div>

                {/* Payment link row */}
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="text-[10px] text-white/40 mb-0.5">Payment Link</div>
                    <div className="text-xs font-mono text-white/80 truncate">{generatedLink}</div>
                  </div>
                  <CopyButton text={generatedLink} label="payment link" />
                </div>

                {/* SMS button */}
                <a
                  href={`sms:?&body=${encodeURIComponent(`Payment of ${formatINR(amount)} for ${tripName}. Pay via UPI: ${operatorUPI}`)}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/10 font-medium text-sm transition-all"
                >
                  <Smartphone className="w-4 h-4" />
                  Send SMS
                </a>
              </motion.div>
            )}

            {activeTab === 'bank' && (
              <motion.div
                key="bank"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {/* Bank detail rows */}
                {[
                  { label: 'Account Name',   value: defaultBankDetails.accountName   },
                  { label: 'Account Number', value: defaultBankDetails.accountNumber },
                  { label: 'IFSC Code',      value: defaultBankDetails.ifsc          },
                  { label: 'Bank',           value: defaultBankDetails.bankName      },
                  ...(defaultBankDetails.branch ? [{ label: 'Branch', value: defaultBankDetails.branch }] : []),
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                  >
                    <div>
                      <div className="text-[10px] text-white/40 mb-0.5">{label}</div>
                      <div className="text-sm font-mono font-medium text-white">{value}</div>
                    </div>
                    <CopyButton text={value} label={label} />
                  </div>
                ))}

                {/* NEFT/IMPS note */}
                <p className="text-[11px] text-white/40 text-center px-2">
                  Use NEFT / RTGS / IMPS for transfers. Include trip name as reference.
                </p>

                {/* Send via WhatsApp */}
                <a
                  href={`https://wa.me/?text=${bankWhatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#1eb854] text-white font-semibold text-sm transition-all shadow-lg shadow-[#25D366]/20"
                >
                  <MessageSquare className="w-4 h-4" />
                  Send Details via WhatsApp
                </a>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom: Mark as Received */}
          <div className="pt-2 border-t border-white/10">
            <GlassButton
              variant="primary"
              className="w-full h-12 text-base font-bold"
              onClick={() => setConfirmOpen(true)}
            >
              <IndianRupee className="w-5 h-5" />
              Mark as Received
            </GlassButton>
          </div>
        </div>
      </GlassModal>

      <ConfirmPaymentModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        amount={amount}
        onConfirm={handlePaymentReceived}
      />
    </>
  )
}
