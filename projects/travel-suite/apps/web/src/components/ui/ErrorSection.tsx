"use client";

import { Component, type ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";
import { GlassButton } from "@/components/glass/GlassButton";

interface ErrorSectionProps {
  children: ReactNode;
  label?: string;
}

interface ErrorSectionState {
  hasError: boolean;
}

export class ErrorSection extends Component<ErrorSectionProps, ErrorSectionState> {
  state: ErrorSectionState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    Sentry.captureException(error, {
      extra: {
        section: this.props.label ?? "unknown-section",
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="mb-3 text-sm text-white/55">
            {this.props.label ?? "This section"} couldn&apos;t load.
          </p>
          <GlassButton
            variant="ghost"
            onClick={() => this.setState({ hasError: false })}
          >
            Retry
          </GlassButton>
        </div>
      );
    }

    return this.props.children;
  }
}
