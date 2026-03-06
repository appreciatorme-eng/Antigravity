'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassButton } from '@/components/glass/GlassButton';
import { GlassBadge } from '@/components/glass/GlassBadge';
import { User, Bell, Link2, CreditCard, Shield, Globe, Smartphone, Clock, Users, ArrowRight, MessageCircle, Mail, Building2, MapPin, IndianRupee, Instagram, Linkedin } from 'lucide-react';
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

    // Other integration state
    const [isGmailConnected, setIsGmailConnected] = useState(false);
    const [upiId, setUpiId] = useState('');
    const [isUpiSaved, setIsUpiSaved] = useState(false);

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
                                    <div className="border-b border-gray-100 pb-4">
                                        <h2 className="text-xl font-bold text-secondary">Service Integrations</h2>
                                        <p className="text-sm text-text-secondary mt-1">Connect your existing tools. Get the inbox working in minutes — no API approvals needed.</p>
                                    </div>

                                    {/* ── Messaging ───────────────────────────────────────── */}
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-3">Messaging</h3>
                                        <div className="space-y-3">
                                            {/* WhatsApp — Hero */}
                                            <div className="p-5 border-2 border-[#25D366]/30 bg-[#25D366]/5 rounded-2xl flex items-start gap-4">
                                                <div className="w-11 h-11 rounded-xl bg-[#25D366] flex items-center justify-center shrink-0 shadow-lg shadow-[#25D366]/30">
                                                    <MessageCircle className="w-6 h-6 text-white fill-current" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-bold text-secondary">WhatsApp</h4>
                                                        <span className="text-[9px] bg-[#25D366]/20 text-[#25D366] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Recommended</span>
                                                        {isWhatsAppConnected && (
                                                            <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">● Connected</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-text-muted leading-relaxed">Use your current WhatsApp number — scan a QR code to link your device. No Meta Business API or approval required.</p>
                                                </div>
                                                <GlassButton
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => setIsWhatsAppConnectOpen(true)}
                                                    className={cn(
                                                        'text-xs shrink-0 font-bold',
                                                        isWhatsAppConnected
                                                            ? 'border-[#25D366]/30 text-[#1da650] bg-[#25D366]/10 border'
                                                            : 'bg-[#25D366] text-white border-transparent hover:bg-[#20bd5a]'
                                                    )}
                                                >
                                                    {isWhatsAppConnected ? 'Manage' : 'Scan QR Code'}
                                                </GlassButton>
                                            </div>

                                            {/* Gmail */}
                                            <div className="p-5 border border-gray-100 rounded-2xl flex items-center gap-4 hover:border-primary/30 transition-colors bg-gray-50/50">
                                                <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                                                    <Mail className="w-5 h-5 text-red-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <h4 className="font-bold text-secondary">Gmail</h4>
                                                        {isGmailConnected && (
                                                            <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">● Connected</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-text-muted">Manage email enquiries and send confirmations directly from the unified inbox.</p>
                                                </div>
                                                <GlassButton
                                                    variant={isGmailConnected ? 'outline' : 'secondary'}
                                                    size="sm"
                                                    onClick={() => {
                                                        setIsGmailConnected(true);
                                                        toast({ title: 'Gmail connected', description: 'Email conversations will appear in your inbox.', variant: 'success' });
                                                    }}
                                                    className={cn('text-xs shrink-0', isGmailConnected ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : '')}
                                                >
                                                    {isGmailConnected ? 'Connected ✓' : 'Connect Google'}
                                                </GlassButton>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Payments ──────────────────────────────────────── */}
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-3">Payments</h3>
                                        <div className="p-5 border border-gray-100 rounded-2xl bg-gray-50/50">
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                                    <IndianRupee className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <h4 className="font-bold text-secondary">UPI</h4>
                                                        {isUpiSaved && (
                                                            <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">● Saved</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-text-muted">Add your UPI ID to include payment links in WhatsApp messages and proposals.</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={upiId}
                                                    onChange={(e) => setUpiId(e.target.value)}
                                                    placeholder="yourname@upi or yourname@bank"
                                                    className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                                                />
                                                <GlassButton
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (upiId.trim()) {
                                                            setIsUpiSaved(true);
                                                            toast({ title: 'UPI ID saved', description: `Payment links will use ${upiId}`, variant: 'success' });
                                                        }
                                                    }}
                                                    className="text-xs px-5"
                                                >
                                                    Save
                                                </GlassButton>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Reviews & Discovery ────────────────────────────── */}
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-3">Reviews & Discovery</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-4 border border-gray-100 rounded-2xl hover:border-primary/30 transition-colors bg-gray-50/50 flex flex-col gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                                                    <Building2 className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-secondary text-sm">Google Business</h4>
                                                    <p className="text-xs text-text-muted mt-1">Respond to reviews and manage your listing from the dashboard.</p>
                                                </div>
                                                <GlassButton variant="outline" size="sm" className="text-xs w-full mt-auto">Connect</GlassButton>
                                            </div>
                                            <div className="p-4 border border-gray-100 rounded-2xl hover:border-primary/30 transition-colors bg-gray-50/50 flex flex-col gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                                                    <MapPin className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-secondary text-sm">TripAdvisor</h4>
                                                    <p className="text-xs text-text-muted mt-1">Sync your listing and pull review data into the reputation tab.</p>
                                                </div>
                                                <GlassButton variant="outline" size="sm" className="text-xs w-full mt-auto">Connect</GlassButton>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Social Media ──────────────────────────────────── */}
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-3">Social Media</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-4 border border-gray-100 rounded-2xl hover:border-primary/30 transition-colors bg-gray-50/50 flex flex-col gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center">
                                                    <Instagram className="w-4 h-4 text-pink-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-secondary text-sm">Instagram</h4>
                                                    <p className="text-xs text-text-muted mt-1">Import leads from DMs and comments into the CRM automatically.</p>
                                                </div>
                                                <GlassButton variant="outline" size="sm" className="text-xs w-full mt-auto">Connect</GlassButton>
                                            </div>
                                            <div className="p-4 border border-gray-100 rounded-2xl hover:border-primary/30 transition-colors bg-gray-50/50 flex flex-col gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                                                    <Linkedin className="w-4 h-4 text-blue-700" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-secondary text-sm">LinkedIn</h4>
                                                    <p className="text-xs text-text-muted mt-1">Sync corporate travel enquiries and company contacts.</p>
                                                </div>
                                                <GlassButton variant="outline" size="sm" className="text-xs w-full mt-auto">Connect</GlassButton>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Maps & Data ────────────────────────────────────── */}
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-3">Maps & Data</h3>
                                        <div className="p-4 border border-gray-100 rounded-2xl flex items-center gap-4 hover:border-primary/30 transition-colors bg-gray-50/50">
                                            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                                <Globe className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-secondary text-sm">Google Places & Maps</h4>
                                                <p className="text-xs text-text-muted mt-0.5">Geospatial mapping and point-of-interest data for itinerary building.</p>
                                            </div>
                                            <GlassButton variant="outline" size="sm" className="text-xs shrink-0">Connect</GlassButton>
                                        </div>
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
