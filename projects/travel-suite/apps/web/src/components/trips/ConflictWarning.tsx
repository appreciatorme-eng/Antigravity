'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, AlertTriangle, ChevronDown, ChevronUp, X, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Conflict } from '@/lib/trips/conflict-detection'

interface ConflictWarningProps {
  conflicts: Conflict[]
  onDismiss?: (conflictIndex: number) => void
  onFixTime?: (activityId: string) => void
}

export function ConflictWarning({ conflicts, onDismiss, onFixTime }: ConflictWarningProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [dismissed, setDismissed] = useState<Set<number>>(new Set())

  if (conflicts.length === 0) return null

  const visibleConflicts = conflicts.filter((_, i) => !dismissed.has(i))

  if (visibleConflicts.length === 0) return null

  const errorCount = visibleConflicts.filter((c) => c.severity === 'error').length
  const warningCount = visibleConflicts.filter((c) => c.severity === 'warning').length

  function handleDismiss(originalIndex: number) {
    const next = new Set(dismissed)
    next.add(originalIndex)
    setDismissed(next)
    onDismiss?.(originalIndex)
  }

  return (
    <div
      className={cn(
        'rounded-2xl border-l-4 border-amber-400 overflow-hidden',
        'bg-[#0a1628]/80 backdrop-blur-xl border border-amber-400/30',
        'shadow-xl shadow-amber-500/10'
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        className="w-full flex items-center justify-between px-5 py-4 text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-sm font-black uppercase tracking-widest text-amber-300">
            {visibleConflicts.length} Schedule Issue{visibleConflicts.length !== 1 ? 's' : ''} Detected
          </span>
          {collapsed && (
            <div className="flex items-center gap-2 ml-2">
              {errorCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-[10px] font-black text-red-400 uppercase tracking-widest">
                  {errorCount} Error{errorCount !== 1 ? 's' : ''}
                </span>
              )}
              {warningCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-[10px] font-black text-amber-400 uppercase tracking-widest">
                  {warningCount} Warning{warningCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!collapsed && (
            <div className="flex items-center gap-2">
              {errorCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-[10px] font-black text-red-400 uppercase tracking-widest">
                  {errorCount} Error{errorCount !== 1 ? 's' : ''}
                </span>
              )}
              {warningCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-[10px] font-black text-amber-400 uppercase tracking-widest">
                  {warningCount} Warning{warningCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
          <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
            {collapsed
              ? <ChevronDown className="w-4 h-4 text-slate-400" />
              : <ChevronUp className="w-4 h-4 text-slate-400" />
            }
          </div>
        </div>
      </button>

      {/* Conflict list */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="conflict-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <ul className="px-5 pb-4 space-y-3">
              <AnimatePresence>
                {conflicts.map((conflict, originalIndex) => {
                  if (dismissed.has(originalIndex)) return null

                  const isError = conflict.severity === 'error'

                  return (
                    <motion.li
                      key={`conflict-${originalIndex}-${conflict.type}-${conflict.activityIds.join('-')}`}
                      initial={{ opacity: 0, x: -12, height: 'auto' }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className={cn(
                        'flex items-start gap-3 p-3.5 rounded-xl border',
                        isError
                          ? 'bg-red-500/8 border-red-500/20'
                          : 'bg-amber-400/8 border-amber-400/20'
                      )}
                    >
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {isError
                          ? <AlertCircle className="w-4 h-4 text-red-400" />
                          : <AlertTriangle className="w-4 h-4 text-amber-400" />
                        }
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className={cn(
                          'text-sm font-semibold leading-snug',
                          isError ? 'text-red-300' : 'text-amber-300'
                        )}>
                          {conflict.message}
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {conflict.suggestion}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex items-center gap-1.5 ml-2">
                        {onFixTime && conflict.activityIds[0] && (
                          <button
                            type="button"
                            onClick={() => onFixTime(conflict.activityIds[0])}
                            className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg',
                              'text-[10px] font-black uppercase tracking-widest transition-colors',
                              isError
                                ? 'bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/20'
                                : 'bg-amber-400/15 text-amber-300 hover:bg-amber-400/25 border border-amber-400/20'
                            )}
                          >
                            <Wrench className="w-3 h-3" />
                            Fix
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDismiss(originalIndex)}
                          className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
                          aria-label="Dismiss this conflict"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ConflictWarning
