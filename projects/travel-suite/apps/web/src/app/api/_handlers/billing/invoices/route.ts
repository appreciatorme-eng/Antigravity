import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/observability/logger";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ data: { invoices: [] } });
    }

    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("id, invoice_number, created_at, subtotal, cgst, sgst, igst, total_amount, status, razorpay_invoice_id")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({
      data: {
        invoices: (invoices || []).map((inv) => ({
          id: inv.id,
          invoice_number: inv.invoice_number,
          date: inv.created_at,
          subtotal: inv.subtotal,
          gst: (inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0),
          total: inv.total_amount,
          status: inv.status,
          razorpay_invoice_id: inv.razorpay_invoice_id,
        })),
      },
    });
  } catch (error) {
    logError("Error fetching invoices", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load invoices" },
      { status: 500 }
    );
  }
}
