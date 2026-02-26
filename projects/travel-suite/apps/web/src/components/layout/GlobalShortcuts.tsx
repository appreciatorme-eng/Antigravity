"use client";

import { useKeyboardShortcuts } from "@/hooks/use-shortcuts";
import { CommandMenu } from "@/components/layout/CommandMenu";

export function GlobalShortcuts() {
    useKeyboardShortcuts();
    return <CommandMenu />;
}
