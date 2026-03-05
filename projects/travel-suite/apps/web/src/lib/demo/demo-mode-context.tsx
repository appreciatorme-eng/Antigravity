// DemoModeProvider — React context that manages demo toggle state.
// Wraps the admin layout so all pages can check isDemoMode.

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEMO_ORG_ID } from "@/lib/demo/constants";

interface DemoModeContextValue {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  demoOrgId: string;
  isReadOnly: boolean;
  mounted: boolean;
}

const DemoModeContext = createContext<DemoModeContextValue>({
  isDemoMode: false,
  toggleDemoMode: () => {},
  demoOrgId: DEMO_ORG_ID,
  isReadOnly: false,
  mounted: false,
});

const LS_KEY = "antigravity:demo_mode";

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR hydration guard
    setMounted(true);
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored === "true") {
        setIsDemoMode(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const toggleDemoMode = useCallback(() => {
    setIsDemoMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(LS_KEY, String(next));
      } catch {
        // localStorage unavailable
      }
      return next;
    });
  }, []);

  const value = useMemo<DemoModeContextValue>(
    () => ({
      isDemoMode,
      toggleDemoMode,
      demoOrgId: DEMO_ORG_ID,
      isReadOnly: isDemoMode,
      mounted,
    }),
    [isDemoMode, toggleDemoMode, mounted]
  );

  return (
    <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>
  );
}

export function useDemoMode(): DemoModeContextValue {
  return useContext(DemoModeContext);
}
