// DemoModeGuard — wraps mutation buttons/actions.
// In demo mode, intercepts clicks and shows a friendly toast.

"use client";

import { cloneElement, type ReactElement, type MouseEvent, type CSSProperties } from "react";
import { useDemoMode } from "@/lib/demo/demo-mode-context";

interface GuardedChildProps {
  onClick?: (e: MouseEvent) => void;
  style?: CSSProperties;
  title?: string;
}

interface DemoModeGuardProps {
  children: ReactElement<GuardedChildProps>;
  message?: string;
}

export default function DemoModeGuard({
  children,
  message = "Switch off Demo Mode to perform this action with your real data.",
}: DemoModeGuardProps) {
  const { isReadOnly } = useDemoMode();

  if (!isReadOnly) return children;

  return cloneElement(children, {
    onClick: (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof window !== "undefined") {
        const event = new CustomEvent("demo-mode-blocked", {
          detail: { message },
        });
        window.dispatchEvent(event);
      }
    },
    style: { ...(children.props.style || {}), cursor: "not-allowed" },
    title: message,
  });
}
