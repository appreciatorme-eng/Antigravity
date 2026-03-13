'use client';

import Link from 'next/link';
import { Users, ArrowRight } from 'lucide-react';

export function TeamTab() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-secondary">Team Management</h2>
                <p className="text-sm text-text-secondary mt-1">Manage your team members, roles and permissions.</p>
            </div>

            <div className="flex flex-col items-start gap-6">
                <div className="flex items-center gap-4 p-5 bg-gray-50 border border-gray-100 rounded-2xl w-full">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-secondary">Team Members & Roles</h3>
                        <p className="text-sm text-text-muted mt-0.5">
                            Invite members, assign roles (Owner, Manager, Agent, Driver) and control permissions.
                        </p>
                    </div>
                </div>

                <Link
                    href="/settings/team"
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl px-6 py-3 transition-colors"
                >
                    Open Team Settings
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}
