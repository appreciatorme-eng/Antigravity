'use client'

import { Clock } from 'lucide-react'

export default function ActivityPage() {
  return (
    <div className="min-h-screen bg-[#0a1628] p-6 text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-semibold">Activity Log</h1>
          <p className="text-white/50 mt-1 text-sm">
            Complete audit trail of all actions in your workspace
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-[#00d084]/10 rounded-2xl flex items-center justify-center mb-6">
            <Clock className="w-8 h-8 text-[#00d084]" />
          </div>
          <h2 className="text-xl font-semibold">Coming Soon</h2>
          <p className="text-white/50 text-sm mt-2 max-w-md">
            Complete audit trail coming soon. This page will show a real-time
            log of all actions across your workspace, powered by live data.
          </p>
        </div>
      </div>
    </div>
  )
}
