import { CheckCircle2, MessageCircle, Palette, Plane } from 'lucide-react';
import { GlassButton } from '@/components/glass/GlassButton';
import { GlassInput } from '@/components/glass/GlassInput';

interface OnboardingDetailsStepsProps {
  currentStep: number;
  operatorName: string;
  companyName: string;
  setOperatorName: (value: string) => void;
  setCompanyName: (value: string) => void;
  onContinue: () => void;
  onEnterWorkspace: () => void;
  saving: boolean;
}

const PREVIEW_CARDS = [
  {
    icon: Palette,
    title: 'Customize your brand',
    description: 'Add your logo and colors',
  },
  {
    icon: Plane,
    title: 'Create your first itinerary',
    description: 'Use AI to build trip proposals',
  },
  {
    icon: MessageCircle,
    title: 'Connect WhatsApp',
    description: 'Chat with clients directly',
  },
] as const;

export function OnboardingDetailsSteps({
  currentStep,
  operatorName,
  companyName,
  setOperatorName,
  setCompanyName,
  onContinue,
  onEnterWorkspace,
  saving,
}: OnboardingDetailsStepsProps) {
  if (currentStep === 1) {
    return (
      <div className="space-y-5">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-semibold text-white">
            Let&apos;s set up your workspace
          </h2>
          <p className="text-sm text-white/50">It takes less than 30 seconds</p>
        </div>

        <div className="space-y-4">
          <GlassInput
            label="Your Name"
            value={operatorName}
            onChange={(e) => setOperatorName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
          />
          <GlassInput
            label="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Wanderlust Travels"
            required
          />
        </div>

        <GlassButton
          variant="primary"
          size="lg"
          fullWidth
          onClick={onContinue}
          className="!bg-[#00d084] hover:!bg-[#00b873]"
        >
          Continue
        </GlassButton>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="h-12 w-12 text-[#00d084]" />
        <h2 className="text-xl font-semibold text-white">
          Your workspace is ready
        </h2>
        <p className="text-sm text-white/50">
          Welcome, {companyName || 'your company'}!
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {PREVIEW_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2"
            >
              <Icon className="h-5 w-5 text-[#00d084]" />
              <p className="text-sm font-medium text-white">{card.title}</p>
              <p className="text-xs text-white/50">{card.description}</p>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-white/40">
        You can do these anytime from your dashboard
      </p>

      <GlassButton
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={saving}
        className="!bg-[#00d084] hover:!bg-[#00b873]"
        onClick={onEnterWorkspace}
      >
        Enter Your Workspace →
      </GlassButton>
    </div>
  );
}
