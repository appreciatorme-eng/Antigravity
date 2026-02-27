'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassButton } from '@/components/glass/GlassButton';
import { GlassBadge } from '@/components/glass/GlassBadge';
import { Settings, User, Bell, Link2, CreditCard, Shield, Globe, Smartphone, Lock, Eye, Clock, Users, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { WhatsAppConnectModal } from '@/components/whatsapp/WhatsAppConnectModal';

const TABS = [
    { id: 'organization', label: 'Organization', icon: Globe },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Link2 },
    { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'team', label: 'Team', icon: Users },
];

export default function SettingsPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('organization');
    const [loading, setLoading] = useState(false);

    // WhatsApp Connect State
    const [isWhatsAppConnectOpen, setIsWhatsAppConnectOpen] = useState(false);
    const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);

    const handleSave = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast({ title: 'Settings saved', description: 'Your configuration has been updated.', variant: 'success' });
        }, 800);
    };

    return (
        <>
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-serif text-secondary tracking-tight">Settings</h1>
                    <p className="text-text-secondary mt-2 text-lg">
                        Configure your workspace, operational preferences, and security footprint.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Sidebar Nav */}
                    <aside className="w-full md:w-64 shrink-0 space-y-1">
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left",
                                        isActive
                                            ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]"
                                            : "text-text-secondary hover:bg-white hover:text-secondary hover:shadow-sm"
                                    )}
                                >
                                    <tab.icon className={cn("w-5 h-5", isActive ? "text-white/80" : "text-text-muted")} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </aside>

                    {/* Content Area */}
                    <main className="flex-1 w-full min-w-0">
                        <GlassCard padding="lg" className="border-gray-100 shadow-xl overflow-hidden min-h-[500px]">
                            {activeTab === 'organization' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="border-b border-gray-100 pb-4">
                                        <h2 className="text-xl font-bold text-secondary">Organization Profile</h2>
                                        <p className="text-sm text-text-secondary mt-1">Manage global brand identity and account settings.</p>
                                    </div>

                                    <div className="grid gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Official Name</label>
                                            <input type="text" defaultValue="Travel Suite Elite" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-secondary" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Website Domain</label>
                                            <input type="text" defaultValue="www.travelsuite.app" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-secondary" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Base Currency</label>
                                                <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-secondary">
                                                    <option value="USD">USD ($)</option>
                                                    <option value="EUR">EUR (€)</option>
                                                    <option value="GBP">GBP (£)</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Timezone</label>
                                                <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-secondary">
                                                    <option value="UTC">UTC Focus</option>
                                                    <option value="EST">Eastern Time (US)</option>
                                                    <option value="PST">Pacific Time (US)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-gray-50 flex justify-end">
                                        <GlassButton variant="primary" onClick={handleSave} disabled={loading} className="rounded-xl px-8">
                                            {loading ? 'Committing...' : 'Save Configuration'}
                                        </GlassButton>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'profile' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="border-b border-gray-100 pb-4">
                                        <h2 className="text-xl font-bold text-secondary">Personal Account</h2>
                                        <p className="text-sm text-text-secondary mt-1">Manage your operational identity and personal details.</p>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="w-24 h-24 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center relative group cursor-pointer">
                                            <User className="w-10 h-10 text-gray-400 group-hover:scale-110 transition-transform" />
                                            <div className="absolute inset-0 bg-primary/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            </div>
                                        </div>
                                        <div>
                                            <GlassButton variant="secondary" className="text-xs font-bold rounded-xl" size="sm">
                                                Upload Avatar
                                            </GlassButton>
                                            <p className="text-xs text-text-muted mt-2">JPG or PNG. Max size of 2MB.</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Full Name</label>
                                            <input type="text" defaultValue="Admin User" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Email Address</label>
                                            <input type="email" defaultValue="admin@travelsuite.app" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" />
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-gray-50 flex justify-end">
                                        <GlassButton variant="primary" onClick={handleSave} disabled={loading} className="rounded-xl px-8">
                                            {loading ? 'Committing...' : 'Save Configuration'}
                                        </GlassButton>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'integrations' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="border-b border-gray-100 pb-4 flex justify-between items-end">
                                        <div>
                                            <h2 className="text-xl font-bold text-secondary">Service Integrations</h2>
                                            <p className="text-sm text-text-secondary mt-1">Connect operational tools and augment your stack.</p>
                                        </div>
                                        <GlassBadge variant="primary" className="text-xs">Premium Features</GlassBadge>
                                    </div>

                                    <div className="space-y-4">
                                        {[
                                            { name: 'Amadeus Booking API', desc: 'Flight, hotel, and vehicle reservation networking.', status: 'Connected' },
                                            { name: 'Stripe Payments', desc: 'Secure financial routing and proposal checkout.', status: 'Connected' },
                                            { name: 'Google Places & Maps', desc: 'Geospatial mapping and point of interest data.', status: 'Disconnected' },
                                            {
                                                name: 'WhatsApp Web Link',
                                                desc: 'Zero-cost meta bypass using device linking.',
                                                status: isWhatsAppConnected ? 'Connected' : 'Disconnected',
                                                accent: 'text-[#25D366] bg-[#25D366]/10 border-[#25D366]/20 hover:bg-[#25D366]/20',
                                                action: () => setIsWhatsAppConnectOpen(true)
                                            },
                                        ].map(integration => (
                                            <div key={integration.name} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl hover:border-primary/30 transition-colors bg-gray-50/50">
                                                <div>
                                                    <h4 className="font-bold text-secondary flex items-center gap-2">
                                                        {integration.name}
                                                        {integration.name === 'WhatsApp Web Link' && (
                                                            <span className="text-[10px] bg-[#25D366]/20 text-[#25D366] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Recommended</span>
                                                        )}
                                                    </h4>
                                                    <p className="text-xs text-text-muted mt-1">{integration.desc}</p>
                                                </div>
                                                <GlassButton
                                                    variant={integration.status === 'Connected' ? 'outline' : 'primary'}
                                                    size="sm"
                                                    onClick={integration.action}
                                                    className={cn(
                                                        "text-xs transition-colors",
                                                        integration.status === 'Connected'
                                                            ? (integration.name === 'WhatsApp Web Link' ? 'border-[#25D366]/30 text-[#1da650] bg-[#25D366]/10' : 'border-emerald-200 text-emerald-600 bg-emerald-50')
                                                            : (integration.accent || '')
                                                    )}
                                                >
                                                    {integration.status === 'Connected' ? 'Manage' : 'Link Device'}
                                                </GlassButton>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
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
                                                        <p className="text-xs text-text-muted mt-0.5">San Francisco, CA • Safari • Active Now</p>
                                                    </div>
                                                </div>
                                                <GlassBadge variant="success">Current</GlassBadge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'team' && (
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
                            )}

                            {['billing', 'notifications'].includes(activeTab) && (
                                <div className="h-full flex flex-col items-center justify-center text-center p-12 text-text-muted space-y-4 animate-in fade-in duration-500">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                                        <Clock className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-secondary">Subsystem Initializing</h3>
                                    <p className="max-w-sm text-sm">This module is currently queued for standard deployment in the next sprint.</p>
                                </div>
                            )}

                        </GlassCard>
                    </main>
                </div>
            </div>

            <WhatsAppConnectModal
                isOpen={isWhatsAppConnectOpen}
                onClose={() => setIsWhatsAppConnectOpen(false)}
                onConnected={() => setIsWhatsAppConnected(true)}
            />
        </>
    );
}
