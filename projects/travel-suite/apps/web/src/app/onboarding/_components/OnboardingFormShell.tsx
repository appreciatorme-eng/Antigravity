import type { FormEvent, ReactNode } from 'react';
import { AlertCircle, Loader2, Plane } from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { TOTAL_WIZARD_STEPS } from './types';

interface OnboardingFormShellProps {
  currentStep: number;
  totalSteps?: number;
  error: string | null;
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}

export function OnboardingFormShell({
  currentStep,
  totalSteps = TOTAL_WIZARD_STEPS,
  error,
  saving,
  onSubmit,
  children,
}: OnboardingFormShellProps) {
  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        <GlassCard
          className="!bg-white/[0.07] !border-white/[0.12]"
          padding="xl"
          blur="lg"
          rounded="xl"
        >
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Logo */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #00d084, #009e63)',
                  boxShadow: '0 8px 24px rgba(0,208,132,0.25)',
                }}
              >
                <Plane className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-semibold text-xl tracking-tight">
                TripBuilt
              </span>
            </div>

            {/* Error banner */}
            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            ) : null}

            {/* Saving overlay */}
            {saving ? (
              <div className="flex items-center justify-center gap-2 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#00d084]" />
                <span className="text-sm text-white/60">Saving...</span>
              </div>
            ) : null}

            {/* Step content */}
            {children}

            {/* Stepper dots */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full transition-colors duration-200 ${
                    i + 1 === currentStep ? 'bg-[#00d084]' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
