'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, Smartphone, Building2, Lock, CheckCircle, XCircle, Download, RefreshCw } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RazorpayModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  clientName: string
  tripName: string
  description?: string
  onSuccess?: (paymentId: string) => void
}

type TabKey = 'upi' | 'card' | 'netbanking'
type PaymentStatus = 'idle' | 'processing' | 'success' | 'failure'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GST_RATE = 0.18

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)
}

function randomPaymentId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'pay_'
  for (let i = 0; i < 14; i++) result += chars[Math.floor(Math.random() * chars.length)]
  return result
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return digits
}

// ---------------------------------------------------------------------------
// QR visual (SVG placeholder)
// ---------------------------------------------------------------------------

function QRCodePlaceholder() {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="w-40 h-40 bg-white rounded-xl p-2 flex items-center justify-center">
        {/* Minimal QR pattern using SVG rectangles */}
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Finder patterns */}
          <rect x="5" y="5" width="30" height="30" fill="black" rx="2" />
          <rect x="8" y="8" width="24" height="24" fill="white" />
          <rect x="12" y="12" width="16" height="16" fill="black" />
          <rect x="65" y="5" width="30" height="30" fill="black" rx="2" />
          <rect x="68" y="8" width="24" height="24" fill="white" />
          <rect x="72" y="12" width="16" height="16" fill="black" />
          <rect x="5" y="65" width="30" height="30" fill="black" rx="2" />
          <rect x="8" y="68" width="24" height="24" fill="white" />
          <rect x="12" y="72" width="16" height="16" fill="black" />
          {/* Data modules (simplified pattern) */}
          {[40, 45, 50, 55, 60].map(x =>
            [5, 10, 15, 20, 25, 30, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90].map(y => (
              Math.random() > 0.5 ? <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" fill="black" /> : null
            ))
          )}
          {[5, 10, 15, 20, 25, 30, 70, 75, 80, 85, 90, 95].map(x =>
            [40, 45, 50, 55, 60, 65].map(y => (
              Math.random() > 0.5 ? <rect key={`d${x}-${y}`} x={x} y={y} width="4" height="4" fill="black" /> : null
            ))
          )}
        </svg>
      </div>
      <p className="text-xs text-white/50 text-center">
        Scan with any UPI app<br />
        <span className="text-white/30">PhonePe &bull; Google Pay &bull; Paytm &bull; BHIM</span>
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// UPI Tab
// ---------------------------------------------------------------------------

function UPITab({ totalAmount, onPay }: { totalAmount: number; onPay: () => void }) {
  const [upiId, setUpiId] = useState('')
  const [showQR, setShowQR] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setShowQR(false)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
            !showQR ? 'bg-[#2563EB]/20 border-[#2563EB] text-blue-300' : 'bg-white/5 border-white/10 text-white/60'
          }`}
        >
          <Smartphone className="w-4 h-4 inline mr-1.5" />
          Enter UPI ID
        </button>
        <button
          onClick={() => setShowQR(true)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
            showQR ? 'bg-[#2563EB]/20 border-[#2563EB] text-blue-300' : 'bg-white/5 border-white/10 text-white/60'
          }`}
        >
          Scan QR
        </button>
      </div>

      {showQR ? (
        <QRCodePlaceholder />
      ) : (
        <>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">UPI ID</label>
            <input
              type="text"
              value={upiId}
              onChange={e => setUpiId(e.target.value)}
              placeholder="e.g. 9876543210@paytm"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#2563EB]/60 focus:ring-1 focus:ring-[#2563EB]/30 transition"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {['@paytm', '@gpay', '@ybl', '@okaxis', '@upi'].map(suffix => (
              <button
                key={suffix}
                onClick={() => {
                  const digits = upiId.replace(/@.*/, '')
                  setUpiId(digits + suffix)
                }}
                className="px-2.5 py-1 rounded-full text-xs border border-white/10 text-white/50 hover:border-white/30 hover:text-white/80 transition bg-white/5"
              >
                {suffix}
              </button>
            ))}
          </div>
        </>
      )}

      <button
        onClick={onPay}
        className="w-full py-3 rounded-xl font-semibold text-sm bg-[#2563EB] text-white hover:bg-[#2563EB]/90 transition-all"
      >
        Pay &#8377;{formatINR(totalAmount)}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Card Tab
// ---------------------------------------------------------------------------

function CardTab({ totalAmount, onPay }: { totalAmount: number; onPay: () => void }) {
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [nameOnCard, setNameOnCard] = useState('')

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-white/50 mb-1.5">Card Number</label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={cardNumber}
            onChange={e => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="XXXX XXXX XXXX XXXX"
            maxLength={19}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/30 font-mono focus:outline-none focus:border-[#2563EB]/60 focus:ring-1 focus:ring-[#2563EB]/30 transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Expiry (MM/YY)</label>
          <input
            type="text"
            value={expiry}
            onChange={e => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/YY"
            maxLength={5}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 font-mono focus:outline-none focus:border-[#2563EB]/60 focus:ring-1 focus:ring-[#2563EB]/30 transition"
          />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1.5">CVV</label>
          <input
            type="password"
            value={cvv}
            onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="&bull;&bull;&bull;"
            maxLength={4}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 font-mono focus:outline-none focus:border-[#2563EB]/60 focus:ring-1 focus:ring-[#2563EB]/30 transition"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-white/50 mb-1.5">Name on Card</label>
        <input
          type="text"
          value={nameOnCard}
          onChange={e => setNameOnCard(e.target.value)}
          placeholder="RAHUL SHARMA"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#2563EB]/60 focus:ring-1 focus:ring-[#2563EB]/30 transition uppercase"
        />
      </div>

      <button
        onClick={onPay}
        className="w-full py-3 rounded-xl font-semibold text-sm bg-[#2563EB] text-white hover:bg-[#2563EB]/90 transition-all"
      >
        Pay Securely
      </button>

      <div className="flex items-center justify-center gap-1.5 text-xs text-white/40">
        <Lock className="w-3.5 h-3.5" />
        256-bit encrypted &bull; PCI DSS Compliant
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Net Banking Tab
// ---------------------------------------------------------------------------

const BANKS = ['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'PNB', 'Bank of Baroda', 'Others']

function NetBankingTab({ totalAmount, onPay }: { totalAmount: number; onPay: () => void }) {
  const [bank, setBank] = useState('')

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-white/50 mb-1.5">Select Your Bank</label>
        <select
          value={bank}
          onChange={e => setBank(e.target.value)}
          className="w-full bg-[#0d1f35] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#2563EB]/60 focus:ring-1 focus:ring-[#2563EB]/30 transition appearance-none"
        >
          <option value="" disabled>-- Choose bank --</option>
          {BANKS.map(b => (
            <option key={b} value={b} className="bg-[#0d1f35]">{b}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {BANKS.slice(0, 6).map(b => (
          <button
            key={b}
            onClick={() => setBank(b)}
            className={`py-2 px-1 rounded-lg text-xs font-medium border transition text-center ${
              bank === b
                ? 'bg-[#2563EB]/20 border-[#2563EB] text-blue-300'
                : 'bg-white/5 border-white/10 text-white/60 hover:border-white/25'
            }`}
          >
            {b.replace(' Bank', '').replace(' Mahindra', '')}
          </button>
        ))}
      </div>

      <button
        onClick={onPay}
        disabled={!bank}
        className="w-full py-3 rounded-xl font-semibold text-sm bg-[#2563EB] text-white hover:bg-[#2563EB]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        Proceed to Bank
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function RazorpayModal({
  isOpen,
  onClose,
  amount,
  clientName,
  tripName,
  description,
  onSuccess,
}: RazorpayModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('upi')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle')
  const [paymentId, setPaymentId] = useState('')
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const gstAmount = Math.round(amount * GST_RATE)
  const totalAmount = amount + gstAmount

  // Simulate mock email based on client name
  const mockEmail = `${clientName.toLowerCase().replace(/\s+/g, '.')}@example.com`

  function handlePay() {
    setPaymentStatus('processing')
    setTimeout(() => {
      // 20% failure rate for demo
      const failed = Math.random() < 0.2
      if (failed) {
        setPaymentStatus('failure')
      } else {
        const pid = randomPaymentId()
        setPaymentId(pid)
        setPaymentStatus('success')
        onSuccess?.(pid)
        autoCloseTimer.current = setTimeout(() => {
          onClose()
        }, 4000)
      }
    }, 2000)
  }

  function handleReset() {
    setPaymentStatus('idle')
    setPaymentId('')
  }

  useEffect(() => {
    return () => {
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current)
    }
  }, [])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPaymentStatus('idle')
      setPaymentId('')
      setActiveTab('upi')
    }
  }, [isOpen])

  if (!isOpen) return null

  const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'upi',        label: 'UPI',         icon: <Smartphone className="w-4 h-4" /> },
    { key: 'card',       label: 'Cards',        icon: <CreditCard className="w-4 h-4" /> },
    { key: 'netbanking', label: 'Net Banking',  icon: <Building2 className="w-4 h-4" /> },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative z-10 w-full max-w-md bg-[#0d1f35]/97 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {/* Razorpay wordmark */}
            <div className="flex items-center gap-1">
              <span className="text-[#2563EB] font-bold text-lg tracking-tight">razorpay</span>
            </div>
            <div className="h-4 w-px bg-white/15" />
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <Lock className="w-3 h-3 text-[#00d084]" />
              Secure Payment
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount block */}
        <div className="px-5 py-4 bg-white/3 border-b border-white/8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-white/40 mb-0.5 uppercase tracking-wider">{tripName}</p>
              <p className="text-xs text-white/30">{description ?? `Payment for ${clientName}`}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">&#8377;{formatINR(amount)}</div>
              <div className="text-xs text-white/40">+ 18% GST: &#8377;{formatINR(gstAmount)}</div>
              <div className="text-sm font-semibold text-[#00d084] mt-0.5">
                Total: &#8377;{formatINR(totalAmount)}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-5">
          <AnimatePresence mode="wait">
            {/* PROCESSING */}
            {paymentStatus === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-10 gap-4"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <RefreshCw className="w-10 h-10 text-[#2563EB]" />
                </motion.div>
                <p className="text-white/70 text-sm">Processing payment&hellip;</p>
                <p className="text-white/30 text-xs">Please do not close this window</p>
              </motion.div>
            )}

            {/* SUCCESS */}
            {paymentStatus === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-6 gap-3"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                >
                  <CheckCircle className="w-16 h-16 text-[#00d084]" />
                </motion.div>
                <h3 className="text-xl font-semibold text-white">Payment Successful!</h3>
                <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 w-full space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/50">Payment ID</span>
                    <span className="text-white font-mono text-xs">{paymentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Amount</span>
                    <span className="text-white">&#8377;{formatINR(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Client</span>
                    <span className="text-white">{clientName}</span>
                  </div>
                </div>
                <p className="text-xs text-white/40 text-center">
                  GST Invoice sent to {mockEmail}
                </p>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/15 text-sm font-medium transition">
                  <Download className="w-4 h-4" />
                  Download Receipt
                </button>
                <p className="text-xs text-white/20">Auto-closing in 4 seconds&hellip;</p>
              </motion.div>
            )}

            {/* FAILURE */}
            {paymentStatus === 'failure' && (
              <motion.div
                key="failure"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-8 gap-3"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <XCircle className="w-14 h-14 text-red-500" />
                </motion.div>
                <h3 className="text-lg font-semibold text-white">Payment Failed</h3>
                <p className="text-white/50 text-sm text-center">Please try again or use a different payment method.</p>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#2563EB]/90 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              </motion.div>
            )}

            {/* IDLE: payment form */}
            {paymentStatus === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Tabs */}
                <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-5">
                  {TABS.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition ${
                        activeTab === tab.key
                          ? 'bg-[#2563EB] text-white shadow'
                          : 'text-white/50 hover:text-white/80'
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.18 }}
                  >
                    {activeTab === 'upi' && <UPITab totalAmount={totalAmount} onPay={handlePay} />}
                    {activeTab === 'card' && <CardTab totalAmount={totalAmount} onPay={handlePay} />}
                    {activeTab === 'netbanking' && <NetBankingTab totalAmount={totalAmount} onPay={handlePay} />}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 text-center space-y-1">
          <p className="text-xs text-white/25">
            Secured by Razorpay &bull; PCI DSS Compliant &bull; Indian payment gateway
          </p>
          <p className="text-xs text-amber-500/50 font-medium">
            Test mode &mdash; no real transaction
          </p>
        </div>
      </motion.div>
    </div>
  )
}
