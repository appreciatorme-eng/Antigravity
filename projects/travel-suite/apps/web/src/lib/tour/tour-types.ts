export interface TourStepConfig {
  element: string; // CSS selector like [data-tour="step-id"]
  popover: {
    title: string;
    description: string;
    side?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
  };
  /** If true, wait for element to appear before showing step (for async elements) */
  waitForElement?: boolean;
}

export interface TourConfig {
  readonly id: string;
  readonly steps: readonly TourStepConfig[];
}
