"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import {
    Search,
    FileText,
    Users,
    LayoutDashboard,
    Settings,
    Plus,
    Calendar,
    Map
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useUIStore } from "@/stores/ui-store";

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const { modalState, closeModal } = useUIStore();

    // Toggle the menu when ⌘K is pressed, Handle Cmd+N, Escape
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
            if (e.key === "n" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                router.push("/trips/create");
            }
            if (e.key === "Escape") {
                if (modalState.isOpen) {
                    closeModal();
                } else {
                    setOpen(false);
                }
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [router, modalState.isOpen, closeModal]);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden"
                    >
                        <Command label="Command Palette" className="flex flex-col h-full">
                            <div className="flex items-center gap-3 px-4 border-b border-gray-100 dark:border-slate-800">
                                <Search className="w-5 h-5 text-gray-400" />
                                <Command.Input
                                    placeholder="Search command or navigate..."
                                    className="flex-1 h-14 bg-transparent border-none outline-none text-base placeholder:text-gray-400 dark:text-slate-200"
                                />
                                <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-1.5 text-[10px] font-medium text-gray-500 uppercase">
                                    ESC
                                </kbd>
                            </div>

                            <Command.List className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                                <Command.Empty className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                    No results found.
                                </Command.Empty>

                                <Command.Group heading="Navigation" className="px-2 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <CommandItem
                                        onSelect={() => runCommand(() => router.push("/"))}
                                        icon={<LayoutDashboard className="w-4 h-4" />}
                                    >
                                        Dashboard
                                    </CommandItem>
                                    <CommandItem
                                        onSelect={() => runCommand(() => router.push("/trips"))}
                                        icon={<Map className="w-4 h-4" />}
                                    >
                                        Trips Pipeline
                                    </CommandItem>
                                    <CommandItem
                                        onSelect={() => runCommand(() => router.push("/clients"))}
                                        icon={<Users className="w-4 h-4" />}
                                    >
                                        Customer CRM
                                    </CommandItem>
                                    <CommandItem
                                        onSelect={() => runCommand(() => router.push("/proposals"))}
                                        icon={<FileText className="w-4 h-4" />}
                                    >
                                        Proposals & Quotes
                                    </CommandItem>
                                </Command.Group>

                                <Command.Group heading="Actions" className="px-2 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <CommandItem
                                        onSelect={() => runCommand(() => router.push("/planner"))}
                                        icon={<Plus className="w-4 h-4" />}
                                    >
                                        Create New Trip
                                    </CommandItem>
                                    <CommandItem
                                        onSelect={() => runCommand(() => router.push("/admin/marketplace"))}
                                        icon={<Calendar className="w-4 h-4" />}
                                    >
                                        Browse Marketplace
                                    </CommandItem>
                                </Command.Group>

                                <Command.Group heading="Settings" className="px-2 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <CommandItem
                                        onSelect={() => runCommand(() => router.push("/admin/settings"))}
                                        icon={<Settings className="w-4 h-4" />}
                                    >
                                        Organization Settings
                                    </CommandItem>
                                </Command.Group>
                            </Command.List>

                            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 text-[10px] text-gray-400 font-medium">
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1 py-0.5 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">↑↓</kbd>
                                        Navigate
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1 py-0.5 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">Enter</kbd>
                                        Select
                                    </span>
                                </div>
                                <span className="uppercase tracking-widest">Command Center</span>
                            </div>
                        </Command>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function CommandItem({
    children,
    icon,
    onSelect
}: {
    children: React.ReactNode;
    icon: React.ReactNode;
    onSelect: () => void;
}) {
    return (
        <Command.Item
            onSelect={onSelect}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-600 dark:text-slate-300 aria-selected:bg-primary aria-selected:text-white transition-all cursor-pointer group"
        >
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center group-aria-selected:bg-white/20 group-aria-selected:scale-110 transition-transform">
                {icon}
            </div>
            <span className="flex-1 font-medium">{children}</span>
        </Command.Item>
    );
}
