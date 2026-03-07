#!/usr/bin/env node
// seed-demo.mjs — one-shot idempotent demo org seeder.
// Run from apps/web directory (needs @supabase/supabase-js in node_modules).
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node seed-demo.mjs

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) { console.error("Missing SUPABASE_URL"); process.exit(1); }
if (!SERVICE_ROLE_KEY) { console.error("Missing SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_ORG_ID = "d0000000-0000-4000-8000-000000000001";

const [t1,t2,t3,t4,t5,t6,t7,t8,t9,t10] = [
  "d0000000-0000-4000-8003-000000000001","d0000000-0000-4000-8003-000000000002",
  "d0000000-0000-4000-8003-000000000003","d0000000-0000-4000-8003-000000000004",
  "d0000000-0000-4000-8003-000000000005","d0000000-0000-4000-8003-000000000006",
  "d0000000-0000-4000-8003-000000000007","d0000000-0000-4000-8003-000000000008",
  "d0000000-0000-4000-8003-000000000009","d0000000-0000-4000-8003-000000000010",
];

function ok(label) { console.log(`  ✓ ${label}`); }
function fail(label, err) { console.error(`  ✗ ${label}: ${err?.message ?? err}`); }

async function insert(table, rows, label) {
  const { error } = await db.from(table).insert(Array.isArray(rows) ? rows : [rows]);
  if (error) { fail(label, error); return false; }
  ok(label); return true;
}

async function seed() {
  console.log("🌱  Seeding GoBuddy Adventures (Demo)…\n");

  const { data: existing } = await db.from("organizations").select("id").eq("id", DEMO_ORG_ID).maybeSingle();
  if (existing) { console.log("✅  Demo org already exists — nothing to do."); return; }

  // ── Organization ──────────────────────────────────────────────────────────
  const orgOk = await insert("organizations", {
    id: DEMO_ORG_ID,
    name: "GoBuddy Adventures (Demo)",
    slug: "gobuddy-demo",
    subscription_tier: "free",           // must match DB enum
    created_at: "2025-12-01T00:00:00Z",
  }, "organization");

  if (!orgOk) { console.error("\n❌  Org failed — aborting (FK cascade)."); return; }

  // ── External Drivers (no auth.users FK — headless) ────────────────────────
  await insert("external_drivers", [
    { id: "d0000000-0000-4000-8005-000000000001", organization_id: DEMO_ORG_ID, full_name: "Raju Singh",   phone: "+919800000001", vehicle_type: "suv",     vehicle_plate: "MH-02-AB-1234", is_active: true, vehicle_capacity: 7,  languages: ["Hindi","English"], notes: "", created_at: "2025-12-10T00:00:00Z" },
    { id: "d0000000-0000-4000-8005-000000000002", organization_id: DEMO_ORG_ID, full_name: "Suresh Kumar", phone: "+919800000002", vehicle_type: "minibus", vehicle_plate: "MH-04-CD-5678", is_active: true, vehicle_capacity: 12, languages: ["Hindi"],           notes: "", created_at: "2025-12-10T00:00:00Z" },
    { id: "d0000000-0000-4000-8005-000000000003", organization_id: DEMO_ORG_ID, full_name: "Mohan Yadav",  phone: "+919800000003", vehicle_type: "suv",     vehicle_plate: "MH-01-EF-9012", is_active: true, vehicle_capacity: 7,  languages: ["Hindi","Marathi"],  notes: "", created_at: "2025-12-10T00:00:00Z" },
    { id: "d0000000-0000-4000-8005-000000000004", organization_id: DEMO_ORG_ID, full_name: "Kiran Patil",  phone: "+919800000004", vehicle_type: "sedan",   vehicle_plate: "MH-03-GH-3456", is_active: true, vehicle_capacity: 5,  languages: ["Hindi","Kannada"],  notes: "", created_at: "2025-12-10T00:00:00Z" },
  ], "4 external drivers");

  // ── Trips (no client_id / itinerary_id — both have auth FK) ──────────────
  await insert("trips", [
    { id: t1,  organization_id: DEMO_ORG_ID, name: "Golden Triangle Classic",      destination: "Delhi, Agra, Jaipur",         start_date: "2026-01-05", end_date: "2026-01-12", status: "in_progress", pax_count: 4, created_at: "2025-12-20T00:00:00Z" },
    { id: t2,  organization_id: DEMO_ORG_ID, name: "Kerala Backwaters Escape",     destination: "Kochi, Alleppey, Munnar",     start_date: "2026-01-18", end_date: "2026-01-24", status: "in_progress", pax_count: 2, created_at: "2025-12-22T00:00:00Z" },
    { id: t3,  organization_id: DEMO_ORG_ID, name: "Goa Beach Holiday",            destination: "North Goa, South Goa",        start_date: "2026-02-01", end_date: "2026-02-06", status: "in_progress", pax_count: 6, created_at: "2025-12-25T00:00:00Z" },
    { id: t4,  organization_id: DEMO_ORG_ID, name: "Rajasthan Royal Tour",         destination: "Jodhpur, Udaipur, Jaisalmer", start_date: "2026-02-10", end_date: "2026-02-18", status: "in_progress", pax_count: 8, created_at: "2025-12-28T00:00:00Z" },
    { id: t5,  organization_id: DEMO_ORG_ID, name: "Himachal Adventure",           destination: "Manali, Kasol, Kufri",        start_date: "2026-02-20", end_date: "2026-02-27", status: "in_progress", pax_count: 3, created_at: "2026-01-02T00:00:00Z" },
    { id: t6,  organization_id: DEMO_ORG_ID, name: "Andaman Island Break",         destination: "Port Blair, Havelock Island", start_date: "2026-03-01", end_date: "2026-03-07", status: "in_progress", pax_count: 2, created_at: "2026-01-10T00:00:00Z" },
    { id: t7,  organization_id: DEMO_ORG_ID, name: "Varanasi Heritage Journey",    destination: "Varanasi, Sarnath",           start_date: "2026-03-12", end_date: "2026-03-16", status: "pending",     pax_count: 5, created_at: "2026-01-15T00:00:00Z" },
    { id: t8,  organization_id: DEMO_ORG_ID, name: "Coorg & Mysore Retreat",       destination: "Coorg, Mysore",               start_date: "2026-03-18", end_date: "2026-03-23", status: "pending",     pax_count: 4, created_at: "2026-01-20T00:00:00Z" },
    { id: t9,  organization_id: DEMO_ORG_ID, name: "Leh Ladakh Bike Expedition",   destination: "Leh, Nubra Valley, Pangong",  start_date: "2026-04-05", end_date: "2026-04-14", status: "pending",     pax_count: 6, created_at: "2026-02-01T00:00:00Z" },
    { id: t10, organization_id: DEMO_ORG_ID, name: "Kashmir Houseboat Experience", destination: "Srinagar, Gulmarg, Pahalgam", start_date: "2026-04-10", end_date: "2026-04-17", status: "pending",     pax_count: 4, created_at: "2026-02-10T00:00:00Z" },
  ], "10 trips");

  // ── Trip Service Costs ────────────────────────────────────────────────────
  await insert("trip_service_costs", [
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t1, category: "hotels",  vendor_name: "Taj Hotels",                description: "Taj Mahal Hotel Delhi — 3N",      pax_count: 4, cost_amount: 42000, price_amount:  60000, commission_pct: 10, commission_amount:  4200, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t1, category: "hotels",  vendor_name: "IHCL SeleQtions",           description: "Agra hotel — 2N",                 pax_count: 4, cost_amount: 28000, price_amount:  42000, commission_pct: 10, commission_amount:  2800, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t1, category: "vehicle", vendor_name: "Rajasthan Tours & Travels", description: "Tempo Traveller 7 days",          pax_count: 4, cost_amount: 22000, price_amount:  34000, commission_pct: 15, commission_amount:  3300, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t1, category: "flights", vendor_name: "IndiGo Airways",            description: "BOM-DEL + JAI-BOM (4 pax)",       pax_count: 4, cost_amount: 28000, price_amount:  40000, commission_pct:  3, commission_amount:   840, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t2, category: "hotels",  vendor_name: "Treebo Hotels",             description: "Kochi boutique 2N",               pax_count: 2, cost_amount: 12000, price_amount:  18000, commission_pct: 10, commission_amount:  1200, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t2, category: "hotels",  vendor_name: "Lake Palace Resort",        description: "Alleppey houseboat 1N",           pax_count: 2, cost_amount: 15000, price_amount:  24000, commission_pct: 10, commission_amount:  1500, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t2, category: "vehicle", vendor_name: "Kerala Driver Association", description: "Sedan 6 days",                    pax_count: 2, cost_amount:  9000, price_amount:  14000, commission_pct: 15, commission_amount:  1350, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t2, category: "flights", vendor_name: "Air India",                 description: "BOM-COK + COK-BOM (2 pax)",       pax_count: 2, cost_amount: 14000, price_amount:  20000, commission_pct:  3, commission_amount:   420, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t3, category: "hotels",  vendor_name: "Taj Exotica Goa",           description: "South Goa luxury 2N",             pax_count: 6, cost_amount: 48000, price_amount:  72000, commission_pct: 10, commission_amount:  4800, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t3, category: "vehicle", vendor_name: "Cab India",                 description: "Multi-vehicle fleet 5 days",      pax_count: 6, cost_amount: 15000, price_amount:  24000, commission_pct: 15, commission_amount:  2250, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t3, category: "flights", vendor_name: "SpiceJet",                  description: "BOM-GOI + GOI-BOM (6 pax)",       pax_count: 6, cost_amount: 36000, price_amount:  54000, commission_pct:  3, commission_amount:  1080, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t4, category: "hotels",  vendor_name: "Taj Hotels",                description: "Umaid Bhawan Jodhpur 3N",         pax_count: 8, cost_amount: 96000, price_amount: 144000, commission_pct: 10, commission_amount:  9600, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t4, category: "hotels",  vendor_name: "Taj Lake Palace Udaipur",   description: "Taj Lake Palace 3N",              pax_count: 8, cost_amount:120000, price_amount: 180000, commission_pct: 10, commission_amount: 12000, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t4, category: "vehicle", vendor_name: "Rajasthan Tours & Travels", description: "Luxury bus 8 days",               pax_count: 8, cost_amount: 48000, price_amount:  72000, commission_pct: 15, commission_amount:  7200, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t4, category: "flights", vendor_name: "IndiGo Airways",            description: "BOM-JDH + JAI-BOM (8 pax)",       pax_count: 8, cost_amount: 64000, price_amount:  96000, commission_pct:  3, commission_amount:  1920, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t5, category: "hotels",  vendor_name: "Snow Valley Resorts",       description: "Manali resort 4N",                pax_count: 3, cost_amount: 18000, price_amount:  28000, commission_pct: 10, commission_amount:  1800, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t5, category: "vehicle", vendor_name: "Himachal Cabs",             description: "SUV Innova Crysta 7 days",        pax_count: 3, cost_amount: 14000, price_amount:  22000, commission_pct: 15, commission_amount:  2100, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t6, category: "hotels",  vendor_name: "Havelock Beach Resort",     description: "Port Blair 2N + Havelock 3N",     pax_count: 2, cost_amount: 22000, price_amount:  35000, commission_pct: 10, commission_amount:  2200, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t6, category: "flights", vendor_name: "IndiGo Airways",            description: "MAA-IXZ + IXZ-MAA (2 pax)",       pax_count: 2, cost_amount: 18000, price_amount:  26000, commission_pct:  3, commission_amount:   540, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t7, category: "hotels",  vendor_name: "BrijRama Palace",           description: "Heritage haveli on the Ghats 3N", pax_count: 5, cost_amount: 35000, price_amount:  55000, commission_pct: 10, commission_amount:  3500, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t7, category: "train",   vendor_name: "Rajdhani Express",          description: "DEL-BSB + BSB-DEL (5 pax)",       pax_count: 5, cost_amount:  9000, price_amount:  14000, commission_pct:  0, commission_amount:     0, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t8, category: "hotels",  vendor_name: "Evolve Back Coorg",         description: "Coffee estate resort 3N",         pax_count: 4, cost_amount: 36000, price_amount:  54000, commission_pct: 10, commission_amount:  3600, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t8, category: "flights", vendor_name: "Air India",                 description: "BOM-MYQ + MYQ-BOM (4 pax)",       pax_count: 4, cost_amount: 20000, price_amount:  30000, commission_pct:  3, commission_amount:   600, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t9, category: "hotels",  vendor_name: "Grand Dragon Ladakh",       description: "Leh hotel 3N + Nubra camp 2N",    pax_count: 6, cost_amount: 36000, price_amount:  54000, commission_pct: 10, commission_amount:  3600, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t9, category: "flights", vendor_name: "IndiGo Airways",            description: "DEL-IXL + IXL-DEL (6 pax)",       pax_count: 6, cost_amount: 42000, price_amount:  60000, commission_pct:  3, commission_amount:  1260, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t9, category: "vehicle", vendor_name: "Ladakh Riders",             description: "Royal Enfield fleet 9 days",      pax_count: 6, cost_amount: 54000, price_amount:  78000, commission_pct: 15, commission_amount:  8100, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t10,category: "hotels",  vendor_name: "Butt Houseboat Group",      description: "Dal Lake houseboat 4N",           pax_count: 4, cost_amount: 28000, price_amount:  44000, commission_pct: 10, commission_amount:  2800, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, trip_id: t10,category: "flights", vendor_name: "Air India",                 description: "DEL-SXR + SXR-DEL (4 pax)",       pax_count: 4, cost_amount: 24000, price_amount:  36000, commission_pct:  3, commission_amount:   720, currency: "INR" },
  ], "28 trip service costs");

  // ── Monthly Overheads ─────────────────────────────────────────────────────
  await insert("monthly_overhead_expenses", [
    { id: randomUUID(), organization_id: DEMO_ORG_ID, month_start: "2026-01-01", category: "wages",     description: "Staff salaries (3 employees)",  amount: 120000, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, month_start: "2026-01-01", category: "rent",      description: "Office rent — Andheri West",     amount:  35000, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, month_start: "2026-01-01", category: "marketing", description: "Google Ads + social media",       amount:  18000, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, month_start: "2026-01-01", category: "other",     description: "Internet + software subs",        amount:   8000, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, month_start: "2026-02-01", category: "wages",     description: "Staff salaries (3 employees)",    amount: 120000, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, month_start: "2026-02-01", category: "rent",      description: "Office rent — Andheri West",      amount:  35000, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, month_start: "2026-02-01", category: "marketing", description: "Google Ads + Instagram boost",     amount:  22000, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, month_start: "2026-02-01", category: "other",     description: "Internet + SaaS tools",           amount:   8500, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, month_start: "2026-03-01", category: "wages",     description: "Staff salaries (3 employees)",    amount: 125000, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, month_start: "2026-03-01", category: "rent",      description: "Office rent — Andheri West",      amount:  35000, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, month_start: "2026-03-01", category: "marketing", description: "Peak season campaign boost",       amount:  28000, currency: "INR" },
    { id: randomUUID(), organization_id: DEMO_ORG_ID, month_start: "2026-03-01", category: "other",     description: "Internet + new CRM sub",          amount:  10000, currency: "INR" },
  ], "12 overhead expenses");

  console.log("\n✅  Done — GoBuddy Adventures demo org seeded (~90 records).");
  console.log("    Any tour operator can now enable Demo Mode to explore this data.");
}

seed().catch((err) => { console.error("Fatal:", err); process.exit(1); });
