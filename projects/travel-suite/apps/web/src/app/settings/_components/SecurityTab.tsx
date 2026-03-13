'use client';

import { Shield, Smartphone } from 'lucide-react';
import { GlassButton } from '@/components/glass/GlassButton';
import { GlassBadge } from '@/components/glass/GlassBadge';

export function SecurityTab() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-secondary">Security Posture</h2>
                <p className="text-sm text-text-secondary mt-1">Audit privileges and fortify application defense systems.</p>
            </div>

            <div className="space-y-6">
                <div className="p-5 border border-amber-200 bg-amber-50 rounded-2xl flex items-start gap-4">
                    <Shield className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
                    <div>
                        <h4 className="font-bold text-amber-900">Two-Factor Authentication Pipeline</h4>
                        <p className="text-sm text-amber-800/80 mt-1 mb-3">Enforce 2FA via authenticator app across your entire organization payload.</p>
                        <GlassButton variant="outline" className="text-xs bg-white border-amber-200 text-amber-700 hover:bg-amber-100">
                            Enforce Policy
                        </GlassButton>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-2">Active Sessions</h3>
                    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl bg-white">
                        <div className="flex items-center gap-3">
                            <Smartphone className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-sm font-bold text-secondary">iPhone 14 Pro Max</p>
                                <p className="text-xs text-text-muted mt-0.5">San Francisco, CA - Safari - Active Now</p>
                            </div>
                        </div>
                        <GlassBadge variant="success">Current</GlassBadge>
                    </div>
                </div>
            </div>
        </div>
    );
}
