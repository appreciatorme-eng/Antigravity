import { useEffect, useMemo, useState } from "react";
import type { ClientOption, DraftLineItem, DraftTotals, InvoiceLineItem } from "./types";
import { computeTaxSplit, roundCurrency } from "./helpers";
import { DEFAULT_GST_RATE, EMPTY_DRAFT_LINE_ITEM } from "./constants";

export function useInvoiceDraft(organizationBillingState: string | null) {
  const [clientId, setClientId] = useState<string>("");
  const [currency, setCurrency] = useState("INR");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [draftItems, setDraftItems] = useState<DraftLineItem[]>([{ ...EMPTY_DRAFT_LINE_ITEM }]);
  const [gstEnabled, setGstEnabled] = useState(true);
  const [placeOfSupply, setPlaceOfSupply] = useState(organizationBillingState || "");
  const [sacCode, setSacCode] = useState("998314");
  const [tripDates, setTripDates] = useState("");

  useEffect(() => {
    if (organizationBillingState && !placeOfSupply) {
      setPlaceOfSupply(organizationBillingState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationBillingState]);

  useEffect(() => {
    if (gstEnabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraftItems((previous) =>
        previous.map((item) => {
          const numericTax = Number.parseFloat(item.tax_rate || "0");
          if (!Number.isFinite(numericTax) || numericTax <= 0) {
            return { ...item, tax_rate: DEFAULT_GST_RATE };
          }
          return item;
        })
      );
      return;
    }
     
    setDraftItems((previous) => previous.map((item) => ({ ...item, tax_rate: "0" })));
  }, [gstEnabled]);

  const draftTotals: DraftTotals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;

    for (const item of draftItems) {
      const qty = Number.parseFloat(item.quantity || "0");
      const rate = Number.parseFloat(item.unit_price || "0");
      const taxRate = gstEnabled ? Number.parseFloat(item.tax_rate || "0") : 0;
      if (!Number.isFinite(qty) || !Number.isFinite(rate) || qty <= 0 || rate < 0) continue;
      const lineSubtotal = roundCurrency(qty * rate);
      const lineTax = roundCurrency((lineSubtotal * Math.max(taxRate, 0)) / 100);
      subtotal += lineSubtotal;
      tax += lineTax;
    }

    const subtotalSafe = roundCurrency(subtotal);
    const taxSafe = roundCurrency(tax);
    const split = computeTaxSplit(taxSafe, organizationBillingState, placeOfSupply || organizationBillingState || "");

    return { subtotal: subtotalSafe, tax: taxSafe, total: roundCurrency(subtotalSafe + taxSafe), split };
  }, [draftItems, gstEnabled, organizationBillingState, placeOfSupply]);

  const computedLineItems: InvoiceLineItem[] = useMemo(() => {
    return draftItems.map((item) => {
      const qty = Number.parseFloat(item.quantity || "0");
      const rate = Number.parseFloat(item.unit_price || "0");
      const taxRate = gstEnabled ? Number.parseFloat(item.tax_rate || "0") : 0;
      const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 0;
      const safeRate = Number.isFinite(rate) && rate >= 0 ? rate : 0;
      const safeTax = Number.isFinite(taxRate) && taxRate >= 0 ? taxRate : 0;
      const lineSubtotal = roundCurrency(safeQty * safeRate);
      const lineTax = roundCurrency((lineSubtotal * safeTax) / 100);
      return {
        description: item.description || "Untitled item",
        quantity: safeQty,
        unit_price: safeRate,
        tax_rate: safeTax,
        line_subtotal: lineSubtotal,
        line_tax: lineTax,
        line_total: roundCurrency(lineSubtotal + lineTax),
      };
    });
  }, [draftItems, gstEnabled]);

  const addDraftLine = () =>
    setDraftItems((prev) => [...prev, { ...EMPTY_DRAFT_LINE_ITEM, tax_rate: gstEnabled ? DEFAULT_GST_RATE : "0" }]);

  const applyPreset = (preset: DraftLineItem) => {
    setDraftItems((previous) => [
      ...previous,
      { ...preset, tax_rate: gstEnabled ? preset.tax_rate : "0" },
    ]);
  };

  const removeDraftLine = (index: number) => {
    setDraftItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, currentIndex) => currentIndex !== index);
    });
  };

  const updateDraftLine = (index: number, field: keyof DraftLineItem, value: string) => {
    setDraftItems((prev) =>
      prev.map((item, currentIndex) =>
        currentIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const autoFillForClient = (client: ClientOption | null) => {
    if (!client) return;
    setDraftItems((previous) => {
      if (previous.length !== 1 || previous[0].description.trim().length > 0) return previous;
      return [
        {
          description: `Travel operations for ${client.full_name || client.email || "client"}`,
          quantity: "1",
          unit_price: "0",
          tax_rate: gstEnabled ? DEFAULT_GST_RATE : "0",
        },
      ];
    });
  };

  const resetDraft = () => {
    setClientId("");
    setCurrency("INR");
    setDueDate("");
    setNotes("");
    setGstEnabled(true);
    setPlaceOfSupply(organizationBillingState || "");
    setSacCode("998314");
    setTripDates("");
    setDraftItems([{ ...EMPTY_DRAFT_LINE_ITEM }]);
  };

  return {
    clientId,
    setClientId,
    currency,
    setCurrency,
    dueDate,
    setDueDate,
    notes,
    setNotes,
    gstEnabled,
    setGstEnabled,
    placeOfSupply,
    setPlaceOfSupply,
    sacCode,
    setSacCode,
    tripDates,
    setTripDates,
    draftItems,
    draftTotals,
    computedLineItems,
    addDraftLine,
    applyPreset,
    removeDraftLine,
    updateDraftLine,
    autoFillForClient,
    resetDraft,
  };
}
