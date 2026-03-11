"use client";

import { useKeyboardShortcuts } from "@/hooks/useShortcuts";
import { CommandMenu } from "@/components/layout/CommandMenu";

export function GlobalShortcuts() {
    useKeyboardShortcuts();
    return <CommandMenu />;
}
