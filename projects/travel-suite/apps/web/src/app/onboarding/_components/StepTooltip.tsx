import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StepTooltipProps {
  content: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function StepTooltip({ content, side = 'top' }: StepTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger
          type="button"
          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[#9c7c46] transition-colors hover:bg-[#f8f1e6] hover:text-[#7c6032] focus:outline-none focus:ring-2 focus:ring-[#9c7c46] focus:ring-offset-2"
          aria-label="Help"
        >
          <HelpCircle className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-xs rounded-lg border-[#eadfcd] bg-white px-3 py-2 text-sm text-[#1b140a] shadow-md"
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
