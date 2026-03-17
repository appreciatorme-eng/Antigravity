'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  MessageCircle,
  CheckCircle2,
  Loader2,
  Phone,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { WhatsAppConnectModal } from '@/components/whatsapp/WhatsAppConnectModal';

interface WhatsAppProfile {
  number: string;
  name: string;
}

interface WhatsAppSetupStepProps {
  onConnected?: () => void;
}

export function WhatsAppSetupStep({ onConnected }: WhatsAppSetupStepProps) {
  const supabase = createClient();
  const [isConnected, setIsConnected] = useState(false);
  const [whatsAppProfile, setWhatsAppProfile] = useState<WhatsAppProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const checkConnection = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Check WhatsApp connection status
      const { data } = await supabase
        .from('whatsapp_connections')
        .select('status, phone_number, display_name')
        .eq('status', 'connected')
        .maybeSingle();

      if (data) {
        setIsConnected(true);
        setWhatsAppProfile({
          number: data.phone_number ?? '',
          name: data.display_name ?? '',
        });
      } else {
        setIsConnected(false);
        setWhatsAppProfile(null);
      }
    } catch (checkError) {
      console.error('Error checking WhatsApp connection:', checkError);
      setError('Failed to check WhatsApp connection status. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void checkConnection();
  }, [checkConnection]);

  const handleConnectClick = () => {
    setShowConnectModal(true);
  };

  const handleConnected = () => {
    setShowConnectModal(false);
    void checkConnection();
    if (onConnected) {
      onConnected();
    }
  };

  const handleDisconnect = async () => {
    setError(null);
    try {
      const res = await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      if (!res.ok) throw new Error('Disconnect failed');
      setIsConnected(false);
      setWhatsAppProfile(null);
    } catch (disconnectError) {
      console.error('Error disconnecting WhatsApp:', disconnectError);
      setError('Failed to disconnect WhatsApp. Please try again or contact support.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#9c7c46]" />
          <p className="mt-3 text-sm text-[#6f5b3e]">Checking WhatsApp connection...</p>
        </div>
      </div>
    );
  }

  if (isConnected && whatsAppProfile) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-green-200 bg-green-50 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-700" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-green-900">WhatsApp Connected!</h3>
              <p className="mt-1 text-sm text-green-700">
                Your WhatsApp Business account is connected and ready to use.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#eadfcd] bg-white p-4">
          <div className="flex items-start gap-3">
            <MessageCircle className="mt-0.5 h-5 w-5 text-[#9c7c46]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#1b140a]">{whatsAppProfile.name}</p>
              <p className="mt-1 flex items-center gap-2 text-xs text-[#6f5b3e]">
                <Phone className="h-3 w-3" />
                {whatsAppProfile.number}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#eadfcd] bg-[#fcf8f1] p-4">
          <p className="text-xs text-[#6f5b3e]">
            <span className="font-medium text-[#1b140a]">What you can do now:</span> Send proposals,
            itineraries, and updates directly to your clients via WhatsApp. Messages are sent
            automatically when you share documents from the dashboard.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={handleDisconnect}
            className="inline-flex items-center gap-2 rounded-lg border border-[#dcc9aa] px-3 py-2.5 text-[#6f5b3e] hover:bg-[#f8f1e6]"
          >
            <RefreshCw className="h-4 w-4" />
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#eadfcd] bg-[#fcf8f1] p-4">
        <div className="flex items-start gap-3">
          <MessageCircle className="mt-0.5 h-5 w-5 text-[#9c7c46]" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9c7c46]">
              WhatsApp Integration
            </p>
            <h3 className="mt-1 text-lg font-semibold text-[#1b140a]">
              Connect WhatsApp Business
            </h3>
            <p className="mt-1 text-sm text-[#6f5b3e]">
              Connect your WhatsApp Business account to send proposals, itineraries, and updates
              directly to your clients. This step is optional but highly recommended for better
              client communication.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[#eadfcd] bg-white p-6">
        <h4 className="text-sm font-semibold text-[#1b140a]">Benefits of WhatsApp Integration:</h4>
        <ul className="mt-3 space-y-2 text-sm text-[#6f5b3e]">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#9c7c46]" />
            <span>Send proposals and itineraries directly to clients</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#9c7c46]" />
            <span>Receive instant client responses and confirmations</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#9c7c46]" />
            <span>Automated booking confirmations and reminders</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#9c7c46]" />
            <span>Better client engagement and faster response times</span>
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <button
          type="button"
          onClick={handleConnectClick}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#9c7c46] px-4 py-2.5 text-white transition hover:bg-[#8a6b3d]"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Connect WhatsApp</span>
        </button>

        <a
          href="https://business.whatsapp.com/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#dcc9aa] px-3 py-2.5 text-[#6f5b3e] transition hover:bg-[#f8f1e6] sm:w-auto"
        >
          <span>Learn More</span>
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="rounded-xl border border-[#eadfcd] bg-[#fcf8f1] p-4 text-sm text-[#6f5b3e]">
        <p>
          <span className="font-medium text-[#1b140a]">Note:</span> You&apos;ll need a WhatsApp Business
          account to connect. If you don&apos;t have one yet, you can skip this step and set it up later
          from Settings.
        </p>
      </div>

      <WhatsAppConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onConnected={handleConnected}
      />
    </div>
  );
}
