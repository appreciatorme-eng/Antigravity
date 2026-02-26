"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/stores/ui-store";
import { Plane, Users, FileText, LayoutDashboard, Calendar } from "lucide-react";

export function CommandMenu() {
    const { commandMenuOpen, setCommandMenuOpen } = useUIStore();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    if (!commandMenuOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/20 backdrop-blur-sm">
            <div
                className="fixed inset-0"
                onClick={() => setCommandMenuOpen(false)}
            />

            <div className="relative w-full max-w-xl mx-4 overflow-hidden bg-white/90 dark:bg-[#0a1628]/90 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200">
                <Command
                    onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === "Escape") setCommandMenuOpen(false);
                    }}
                    className="w-full text-text-primary dark:text-gray-100"
                >
                    <div className="flex items-center px-4 border-b border-gray-100 dark:border-white/10">
                        <Command.Input
                            autoFocus
                            placeholder="Type a command or search..."
                            className="w-full h-14 bg-transparent outline-none placeholder:text-text-muted text-lg"
                        />
                    </div>

                    <Command.List className="max-h-[300px] overflow-y-auto p-2">
                        <Command.Empty className="py-6 text-center text-sm text-text-muted">
                            No results found.
                        </Command.Empty>

                        <Command.Group heading="Navigation" className="text-xs font-semibold text-text-muted uppercase px-2 py-1.5 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2.5 [&_[cmdk-item]]:flex [&_[cmdk-item]]:items-center [&_[cmdk-item]]:gap-3 [&_[cmdk-item]]:rounded-xl [&_[cmdk-item]]:text-sm [&_[cmdk-item]]:font-medium [&_[cmdk-item]]:cursor-pointer [&_[cmdk-item][data-selected]]:bg-primary/10 [&_[cmdk-item][data-selected]]:text-primary transition-colors">
                            <Command.Item onSelect={() => { router.push("/"); setCommandMenuOpen(false); }}>
                                <LayoutDashboard className="w-4 h-4" />
                                Dashboard
                            </Command.Item>
                            <Command.Item onSelect={() => { router.push("/trips"); setCommandMenuOpen(false); }}>
                                <Plane className="w-4 h-4" />
                                Trips
                            </Command.Item>
                            <Command.Item onSelect={() => { router.push("/clients"); setCommandMenuOpen(false); }}>
                                <Users className="w-4 h-4" />
                                Clients
                            </Command.Item>
                            <Command.Item onSelect={() => { router.push("/proposals"); setCommandMenuOpen(false); }}>
                                <FileText className="w-4 h-4" />
                                Proposals
                            </Command.Item>
                            <Command.Item onSelect={() => { router.push("/calendar"); setCommandMenuOpen(false); }}>
                                <Calendar className="w-4 h-4" />
                                Calendar
                            </Command.Item>
                        </Command.Group>

                        <Command.Group heading="Actions" className="mt-2 text-xs font-semibold text-text-muted uppercase px-2 py-1.5 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2.5 [&_[cmdk-item]]:flex [&_[cmdk-item]]:items-center [&_[cmdk-item]]:gap-3 [&_[cmdk-item]]:rounded-xl [&_[cmdk-item]]:text-sm [&_[cmdk-item]]:font-medium [&_[cmdk-item]]:cursor-pointer [&_[cmdk-item][data-selected]]:bg-primary/10 [&_[cmdk-item][data-selected]]:text-primary">
                            <Command.Item onSelect={() => { router.push("/trips/create"); setCommandMenuOpen(false); }}>
                                <Plane className="w-4 h-4" />
                                Create New Trip
                            </Command.Item>
                            <Command.Item onSelect={() => { router.push("/proposals/create"); setCommandMenuOpen(false); }}>
                                <FileText className="w-4 h-4" />
                                Generate Proposal
                            </Command.Item>
                        </Command.Group>
                    </Command.List>
                </Command>
            </div>
        </div>
    );
}
