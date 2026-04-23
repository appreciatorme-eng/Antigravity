/**
 * Rich WhatsApp message formatters for the TripBuilt Assistant.
 *
 * All functions are pure — they take data and return formatted strings.
 * Uses WhatsApp-compatible *bold*, _italic_, and monospace markers.
 *
 * All monetary amounts are in RUPEES (not paise) — matching the invoices table.
 */
import "server-only";

import type { ContextSnapshot } from "@/lib/assistant/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format rupees as ₹ INR with Indian locale. */
function inr(rupees: number): string {
    return `₹${rupees.toLocaleString("en-IN")}`;
}

/** Mask a phone number for privacy: +91 ••••3428 */
function maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.length <= 4) return phone;
    return "+" + digits.slice(0, 2) + " ••••" + digits.slice(-4);
}

/** Cap a list at max items. */
function takeMax<T>(items: readonly T[], max: number): readonly T[] {
    return items.slice(0, max);
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export function formatDashboard(
    snapshot: ContextSnapshot,
    monthRevenueRupees: number,
    monthName: string,
): string {
    const trips = snapshot.todayTrips.length;
    const invoices = snapshot.pendingInvoices.length;
    const clients = snapshot.recentClients.length;
    const pendingTotal = snapshot.pendingInvoices.reduce(
        (sum, inv) => sum + inv.balanceAmount,
        0,
    );

    return [
        `📊 *Today's Dashboard*`,
        "",
        `┌───────────────────────`,
        `│ 🎯 Trips Today       ${trips}`,
        `│ 💰 Revenue (${monthName})  ${inr(monthRevenueRupees)}`,
        `│ ⏳ Pending Payments   ${invoices}`,
        `│    Total Due          ${inr(pendingTotal)}`,
        `│ 👥 Active Clients     ${clients}`,
        `└───────────────────────`,
        "",
        `Reply: *today* · *leads* · *payments* · *revenue* · *help*`,
    ].join("\n");
}

// ---------------------------------------------------------------------------
// Today's trips
// ---------------------------------------------------------------------------

export function formatTripsToday(
    trips: ContextSnapshot["todayTrips"],
): string {
    if (trips.length === 0) {
        return "📋 *Today's Trips*\n\nNo trips scheduled for today. 🎉";
    }

    const lines = takeMax(trips, 8).map((t, i) => {
        const status = t.status ?? "active";
        const emoji = status === "completed" ? "✅" : status === "cancelled" ? "❌" : "🔵";
        return `${i + 1}. ${emoji} ${t.clientName ?? "Unknown"} — ${status}`;
    });

    return [
        `📋 *Today's Trips (${trips.length})*`,
        "",
        ...lines,
    ].join("\n");
}

// ---------------------------------------------------------------------------
// Pending payments
// ---------------------------------------------------------------------------

export function formatPendingPayments(
    invoices: ContextSnapshot["pendingInvoices"],
): string {
    if (invoices.length === 0) {
        return "💰 *Pending Payments*\n\nAll clear! No pending payments. ✅";
    }

    const total = invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);
    const lines = takeMax(invoices, 8).map((inv) => {
        const overdue = inv.dueDate && new Date(inv.dueDate) < new Date();
        const tag = overdue ? " 🔴 OVERDUE" : "";
        return `• ${inv.clientName ?? "Unknown"} — ${inr(inv.balanceAmount)}${tag}`;
    });

    return [
        `💰 *Pending Payments (${invoices.length})*`,
        `Total due: ${inr(total)}`,
        "",
        ...lines,
    ].join("\n");
}

// ---------------------------------------------------------------------------
// Revenue
// ---------------------------------------------------------------------------

export function formatRevenue(
    monthRevenueRupees: number,
    lastMonthRevenueRupees: number,
    monthName: string,
    lastMonthName: string,
    paidCount: number,
): string {
    const diff = monthRevenueRupees - lastMonthRevenueRupees;
    const pctChange = lastMonthRevenueRupees > 0
        ? Math.round((diff / lastMonthRevenueRupees) * 100)
        : 0;
    const trend = diff > 0 ? `📈 +${pctChange}%` : diff < 0 ? `📉 ${pctChange}%` : "➡️ 0%";

    return [
        `💵 *Revenue Summary*`,
        "",
        `*${monthName}:* ${inr(monthRevenueRupees)}`,
        `*${lastMonthName}:* ${inr(lastMonthRevenueRupees)}`,
        `*Trend:* ${trend}`,
        `*Payments received:* ${paidCount} this month`,
    ].join("\n");
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export function formatLeads(
    leads: ReadonlyArray<{
        readonly phone: string;
        readonly name: string | null;
        readonly preview: string;
    }>,
): string {
    if (leads.length === 0) {
        return "🆕 *Recent Leads*\n\nNo new inbound messages in the last 24 hours.";
    }

    const lines = takeMax(leads, 8).map((l, i) => {
        const display = l.name ?? maskPhone(l.phone);
        const msg = l.preview.slice(0, 50);
        return `${i + 1}. ${display}\n   💬 "${msg}"`;
    });

    return [
        `🆕 *Recent Leads (${leads.length})*`,
        "",
        ...lines,
    ].join("\n");
}

// ---------------------------------------------------------------------------
// Help menu
// ---------------------------------------------------------------------------

export function formatHelpMenu(): string {
    return [
        "🤖 *TripBuilt Assistant*",
        "",
        "*Quick Commands:*",
        "  📋 *today* — Today's trips",
        "  🔗 *link* — Share intake form",
        "  🆕 *leads* — Recent leads",
        "  💰 *payments* — Pending payments",
        "  💵 *revenue* — Revenue summary",
        "  📊 *stats* — Dashboard overview",
        "  📊 *brief* — Daily briefing",
        "",
        "*Or ask me anything:*",
        '  _"How many bookings this week?"_',
        '  _"Who has overdue payments?"_',
        '  _"Summarize today"_',
        "",
        "I'll answer using your live business data.",
    ].join("\n");
}
