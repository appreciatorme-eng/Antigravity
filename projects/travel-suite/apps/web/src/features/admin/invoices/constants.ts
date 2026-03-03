import type { DraftLineItem, TemplateMeta } from "./types";

export const DEFAULT_GST_RATE = "18";

export const EMPTY_DRAFT_LINE_ITEM: DraftLineItem = {
  description: "",
  quantity: "1",
  unit_price: "0",
  tax_rate: DEFAULT_GST_RATE,
};

export const TEMPLATE_META: TemplateMeta[] = [
  {
    id: "executive",
    name: "Executive",
    description: "Crisp premium layout for enterprise billing",
    accentClass: "from-emerald-600/20 to-teal-500/10",
    pillClass: "text-emerald-700 bg-emerald-100 border-emerald-200",
  },
  {
    id: "obsidian",
    name: "Obsidian",
    description: "Dark-ink finance style with high contrast",
    accentClass: "from-slate-700/20 to-slate-900/5",
    pillClass: "text-slate-700 bg-slate-100 border-slate-200",
  },
  {
    id: "heritage",
    name: "Heritage",
    description: "Warm signature style for luxury operators",
    accentClass: "from-amber-600/20 to-orange-500/10",
    pillClass: "text-amber-700 bg-amber-100 border-amber-200",
  },
];

export const LINE_ITEM_PRESETS: Array<{ label: string; item: DraftLineItem }> = [
  {
    label: "Trip Planning Fee",
    item: { description: "Trip planning and concierge coordination", quantity: "1", unit_price: "12500", tax_rate: "18" },
  },
  {
    label: "Accommodation Block",
    item: { description: "Accommodation booking and supplier handling", quantity: "1", unit_price: "32500", tax_rate: "18" },
  },
  {
    label: "Transfers",
    item: { description: "Airport and intercity transfer arrangements", quantity: "1", unit_price: "6500", tax_rate: "18" },
  },
  {
    label: "Visa Support",
    item: { description: "Visa documentation and support assistance", quantity: "1", unit_price: "4500", tax_rate: "18" },
  },
  {
    label: "Premium Add-on",
    item: { description: "Premium add-on package", quantity: "1", unit_price: "9800", tax_rate: "18" },
  },
];
