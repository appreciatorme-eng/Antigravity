"use client";

import { useState, useMemo } from "react";
import { useClients } from "@/lib/queries/clients";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, User, Phone, Mail, MessageSquare, Send, Loader2, Save } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { logError } from "@/lib/observability/logger";
import { authedFetch } from "@/lib/api/authed-fetch";

interface Client {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

interface ClientPickerProps {
  shareLink: string;
  itineraryId?: string;
  tripId?: string;
  onAssigned?: () => void;
}

type SendChannel = "whatsapp" | "email" | "both";

export default function ClientPicker({ shareLink, itineraryId, tripId, onAssigned }: ClientPickerProps) {
  const { data: clients, isLoading: clientsLoading } = useClients();
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [sending, setSending] = useState<SendChannel | null>(null);
  const [inlinePhone, setInlinePhone] = useState("");
  const [inlineEmail, setInlineEmail] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const filteredClients = useMemo(() => {
    if (!clients || !Array.isArray(clients)) return [];
    if (!search.trim()) return clients.slice(0, 20);
    const q = search.toLowerCase();
    return (clients as Client[]).filter(
      (c) =>
        c.full_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q)
    ).slice(0, 20);
  }, [clients, search]);

  const assignClient = async (client: Client) => {
    setAssigning(true);
    try {
      // Assign client to itinerary
      if (itineraryId) {
        const { error } = await supabase
          .from("itineraries")
          .update({ client_id: client.id })
          .eq("id", itineraryId);
        if (error) throw error;
      }

      if (tripId) {
        const { error } = await supabase
          .from("trips")
          .update({ client_id: client.id })
          .eq("id", tripId);
        if (error) throw error;
      } else if (itineraryId) {
        const { error } = await supabase
          .from("trips")
          .update({ client_id: client.id })
          .eq("itinerary_id", itineraryId);
        if (error) throw error;
      }

      setSelectedClient(client);
      setInlinePhone("");
      setInlineEmail("");
      onAssigned?.();
    } catch (err) {
      logError("[ClientPicker] Failed to assign client", err);
      toast({
        title: "Failed to assign client",
        description: "Please try again.",
        variant: "error",
        durationMs: 3000,
      });
    } finally {
      setAssigning(false);
    }
  };

  const saveContactField = async (field: "phone" | "email", value: string) => {
    if (!selectedClient) return;
    const setter = field === "phone" ? setSavingPhone : setSavingEmail;
    setter(true);
    try {
      const updates: Record<string, string> = {};
      if (field === "phone") {
        updates.phone = value;
        updates.phone_normalized = value.replace(/\D/g, "");
      } else {
        updates.email = value;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", selectedClient.id);

      if (error) throw error;

      // Update local state immutably
      setSelectedClient({
        ...selectedClient,
        [field]: value,
      });
      toast({
        title: `${field === "phone" ? "Phone" : "Email"} saved`,
        durationMs: 2000,
      });
    } catch (err) {
      logError(`[ClientPicker] Failed to save ${field}`, err);
      toast({
        title: `Failed to save ${field}`,
        variant: "error",
        durationMs: 3000,
      });
    } finally {
      setter(false);
    }
  };

  const sendShare = async (channel: SendChannel) => {
    if (!selectedClient) return;
    setSending(channel);
    try {
      const res = await authedFetch("/api/admin/share/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shareLink,
          clientId: selectedClient.id,
          channel,
          phone: selectedClient.phone || inlinePhone || undefined,
          email: selectedClient.email || inlineEmail || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Send failed");
      }

      const results = data.results as Record<string, { success: boolean; error?: string }>;
      const failures = Object.entries(results)
        .filter(([, r]) => !r.success)
        .map(([ch, r]) => `${ch}: ${r.error}`);

      if (failures.length > 0) {
        toast({
          title: "Partially sent",
          description: failures.join("; "),
          variant: "error",
          durationMs: 4000,
        });
      } else {
        toast({
          title: "Sent!",
          description: `Itinerary shared via ${channel}.`,
          durationMs: 3000,
        });
      }
    } catch (err) {
      logError("[ClientPicker] Send failed", err);
      toast({
        title: "Failed to send",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "error",
        durationMs: 3000,
      });
    } finally {
      setSending(null);
    }
  };

  // -- Selected client view --
  if (selectedClient) {
    const hasPhone = !!selectedClient.phone;
    const hasEmail = !!selectedClient.email;

    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">
          <User className="w-4 h-4 inline mr-1" />
          Assigned to Client
        </Label>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{selectedClient.full_name}</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-500"
              onClick={() => setSelectedClient(null)}
            >
              Change
            </Button>
          </div>

          {/* Phone row */}
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400 shrink-0" />
            {hasPhone ? (
              <>
                <span className="text-sm text-gray-700 flex-1">{selectedClient.phone}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  disabled={sending !== null}
                  onClick={() => sendShare("whatsapp")}
                >
                  {sending === "whatsapp" ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <MessageSquare className="w-3 h-3 mr-1" />
                  )}
                  WhatsApp
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  placeholder="Enter phone number..."
                  value={inlinePhone}
                  onChange={(e) => setInlinePhone(e.target.value)}
                  className="h-7 text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs px-2"
                  disabled={!inlinePhone.trim() || savingPhone}
                  onClick={() => saveContactField("phone", inlinePhone.trim())}
                >
                  {savingPhone ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                </Button>
              </div>
            )}
          </div>

          {/* Email row */}
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400 shrink-0" />
            {hasEmail ? (
              <>
                <span className="text-sm text-gray-700 flex-1">{selectedClient.email}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  disabled={sending !== null}
                  onClick={() => sendShare("email")}
                >
                  {sending === "email" ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Send className="w-3 h-3 mr-1" />
                  )}
                  Email
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  placeholder="Enter email..."
                  value={inlineEmail}
                  onChange={(e) => setInlineEmail(e.target.value)}
                  className="h-7 text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs px-2"
                  disabled={!inlineEmail.trim() || savingEmail}
                  onClick={() => saveContactField("email", inlineEmail.trim())}
                >
                  {savingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                </Button>
              </div>
            )}
          </div>

          {/* Send via Both */}
          {hasPhone && hasEmail && (
            <Button
              size="sm"
              className="w-full text-xs"
              disabled={sending !== null}
              onClick={() => sendShare("both")}
            >
              {sending === "both" ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Send className="w-3 h-3 mr-1" />
              )}
              Send via Both
            </Button>
          )}
        </div>
      </div>
    );
  }

  // -- Client search / selection view --
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">
        <User className="w-4 h-4 inline mr-1" />
        Assign to Client
      </Label>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 text-sm"
        />
      </div>
      {clientsLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
      ) : filteredClients.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-3">
          {search ? "No clients match your search" : "No clients found"}
        </p>
      ) : (
        <div className="max-h-40 overflow-y-auto rounded-md border border-gray-200 divide-y divide-gray-100">
          {filteredClients.map((client: Client) => (
            <button
              key={client.id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center justify-between gap-2"
              disabled={assigning}
              onClick={() => assignClient(client)}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {client.full_name || "Unnamed"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {[client.email, client.phone].filter(Boolean).join(" / ") || "No contact info"}
                </p>
              </div>
              {assigning && (
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
