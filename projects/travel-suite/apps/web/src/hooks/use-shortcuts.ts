"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/stores/ui-store";

export function useKeyboardShortcuts() {
    const router = useRouter();
    const { toggleCommandMenu, setCommandMenuOpen, closeModal, modalState } = useUIStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+K or Ctrl+K
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                toggleCommandMenu();
            }

            // Cmd+N or Ctrl+N
            if ((e.metaKey || e.ctrlKey) && e.key === "n") {
                e.preventDefault();
                router.push("/trips/create");
            }

            // Escape
            if (e.key === "Escape") {
                // If a specific modal is open, close it
                if (modalState.isOpen) {
                    closeModal();
                } else {
                    // Otherwise close the command menu
                    setCommandMenuOpen(false);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [router, toggleCommandMenu, setCommandMenuOpen, closeModal, modalState.isOpen]);
}
