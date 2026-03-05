// seed-demo — one-shot idempotent demo data seeder.
// POST /api/admin/seed-demo  →  inserts GoBuddy Adventures (Demo) org + all records.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEMO_ORG_ID } from "@/lib/demo/constants";

const DEMO_ADMIN_ID   = "d0000000-0000-4000-8000-000000000002";
const DEMO_CLIENT_IDS = [
  "d0000000-0000-4000-8001-000000000001",
  "d0000000-0000-4000-8001-000000000002",
  "d0000000-0000-4000-8001-000000000003",
  "d0000000-0000-4000-8001-000000000004",
  "d0000000-0000-4000-8001-000000000005",
  "d0000000-0000-4000-8001-000000000006",
  "d0000000-0000-4000-8001-000000000007",
  "d0000000-0000-4000-8001-000000000008",
  "d0000000-0000-4000-8001-000000000009",
  "d0000000-0000-4000-8001-000000000010",
  "d0000000-0000-4000-8001-000000000011",
  "d0000000-0000-4000-8001-000000000012",
];
const DEMO_DRIVER_IDS = [
  "d0000000-0000-4000-8002-000000000001",
  "d0000000-0000-4000-8002-000000000002",
  "d0000000-0000-4000-8002-000000000003",
  "d0000000-0000-4000-8002-000000000004",
];
const DEMO_ITINERARY_IDS = [
  "d0000000-0000-4000-8004-000000000001",
  "d0000000-0000-4000-8004-000000000002",
  "d0000000-0000-4000-8004-000000000003",
  "d0000000-0000-4000-8004-000000000004",
  "d0000000-0000-4000-8004-000000000005",
  "d0000000-0000-4000-8004-000000000006",
  "d0000000-0000-4000-8004-000000000007",
  "d0000000-0000-4000-8004-000000000008",
  "d0000000-0000-4000-8004-000000000009",
  "d0000000-0000-4000-8004-000000000010",
];
const DEMO_TRIP_IDS = [
  "d0000000-0000-4000-8003-000000000001",
  "d0000000-0000-4000-8003-000000000002",
  "d0000000-0000-4000-8003-000000000003",
  "d0000000-0000-4000-8003-000000000004",
  "d0000000-0000-4000-8003-000000000005",
  "d0000000-0000-4000-8003-000000000006",
  "d0000000-0000-4000-8003-000000000007",
  "d0000000-0000-4000-8003-000000000008",
  "d0000000-0000-4000-8003-000000000009",
  "d0000000-0000-4000-8003-000000000010",
];

function uuid() {
  return crypto.randomUUID();
}

export async function POST() {
  const supabase = createAdminClient() as any;

  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", DEMO_ORG_ID)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, message: "Demo org already seeded — skipping." });
  }

  const [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12] = DEMO_CLIENT_IDS;
  const [d1, d2, d3, d4] = DEMO_DRIVER_IDS;
  const [i1, i2, i3, i4, i5, i6, i7, i8, i9, i10] = DEMO_ITINERARY_IDS;
  const [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10] = DEMO_TRIP_IDS;

  await supabase.from("organizations").insert({
    id: DEMO_ORG_ID,
    name: "GoBuddy Adventures (Demo)",
    slug: "gobuddy-demo",
    subscription_tier: "premium",
    created_at: "2025-12-01T00:00:00Z",
  });

  await supabase.from("profiles").insert([
    { id: DEMO_ADMIN_ID, full_name: "Avinash Kapoor", email: "avinash@gobuddy-demo.in", role: "admin", organization_id: DEMO_ORG_ID, created_at: "2025-12-01T00:00:00Z" },
    { id: c1,  full_name: "Priya Sharma",   email: "priya.sharma@gmail.com",     phone: "+919876543210", role: "client", organization_id: DEMO_ORG_ID, lifecycle_stage: "active",            created_at: "2025-12-15T10:00:00Z" },
    { id: c2,  full_name: "Rajesh Gupta",   email: "rajesh.gupta@yahoo.com",     phone: "+919876543211", role: "client", organization_id: DEMO_ORG_ID, lifecycle_stage: "active",            created_at: "2025-12-20T14:00:00Z" },
    { id: c3,  full_name: "Ananya Patel",   email: "ananya.patel@outlook.com",   phone: "+919876543212", role: "client", organization_id: DEMO_ORG_ID, lifecycle_stage: "review",            created_at: "2026-01-05T09:00:00Z" },
    { id: c4,  full_name: "Vikram Singh",   email: "vikram.singh@hotmail.com",   phone: "+919876543213", role: "client", organization_id: DEMO_ORG_ID, lifecycle_stage: "past",              created_at: "2026-01-10T11:00:00Z" },
    { id: c5,  full_name: "Deepika Nair",   email: "deepika.nair@gmail.com",     phone: "+919876543214", role: "client", organization_id: DEMO_ORG_ID, lifecycle_stage: "payment_confirmed", created_at: "2026-01-20T16:00:00Z" },
    { id: c6,  full_name: "Amit Mehta",     email: "amit.mehta@proton.me",       phone: "+919876543215", role: "client", organization_id: DEMO_ORG_ID, lifecycle_stage: "payment_pending",   created_at: "2026-02-01T08:00:00Z" },
    { id: c7,  full_name: "Kavita Joshi",   email: "kavita.joshi@gmail.com",     phone: "+919876543216", role: "client", organization_id: DEMO_ORG_ID, lifecycle_stage: "proposal",          created_at: "2026-02-10T13:00:00Z" },
    { id: c8,  full_name: "Suresh Reddy",   email: "suresh.reddy@yahoo.com",     phone: "+919876543217", role: "client", organization_id: DEMO_ORG_ID, lifecycle_stage: "proposal",          created_at: "2026-02-15T10:00:00Z" },
    { id: c9,  full_name: "Neha Kapoor",    email: "neha.kapoor@gmail.com",      phone: "+919876543218", role: "client", organization_id: DEMO_ORG_ID, lifecycle_stage: "prospect",          created_at: "2026-02-20T15:00:00Z" },
    { id: c10, full_name: "Arjun Malhotra", email: "arjun.malhotra@gmail.com",   phone: "+919876543219", role: "client", organization_id: DEMO_ORG_ID, lifecycle_stage: "prospect",          created_at: "2026-02-25T12:00:00Z" },
    { id: c11, full_name: "Sunita Iyer",    email: "sunita.iyer@rediffmail.com", phone: "+919876543220", role: "client", organization_id: DEMO_ORG_ID, lifecycle_stage: "lead",              created_at: "2026-03-01T09:00:00Z" },
    { id: c12, full_name: "Ravi Krishnan",  email: "ravi.krishnan@gmail.com",    phone: "+919876543221", role: "client", organization_id: DEMO_ORG_ID, lifecycle_stage: "lead",              created_at: "2026-03-03T17:00:00Z" },
    { id: d1,  full_name: "Raju Singh",     email: "raju.driver@gobuddy-demo.in",    phone: "+919800000001", role: "driver", organization_id: DEMO_ORG_ID, created_at: "2025-12-10T00:00:00Z" },
    { id: d2,  full_name: "Suresh Kumar",   email: "suresh.driver@gobuddy-demo.in",  phone: "+919800000002", role: "driver", organization_id: DEMO_ORG_ID, created_at: "2025-12-10T00:00:00Z" },
    { id: d3,  full_name: "Mohan Yadav",    email: "mohan.driver@gobuddy-demo.in",   phone: "+919800000003", role: "driver", organization_id: DEMO_ORG_ID, created_at: "2025-12-10T00:00:00Z" },
    { id: d4,  full_name: "Kiran Patil",    email: "kiran.driver@gobuddy-demo.in",   phone: "+919800000004", role: "driver", organization_id: DEMO_ORG_ID, created_at: "2025-12-10T00:00:00Z" },
  ]);

  const emptyRaw = { days: [] };
  await supabase.from("itineraries").insert([
    { id: i1,  user_id: DEMO_ADMIN_ID, trip_title: "Golden Triangle Classic",      destination: "Delhi, Agra, Jaipur",           duration_days: 7,  raw_data: emptyRaw, created_at: "2025-12-20T00:00:00Z" },
    { id: i2,  user_id: DEMO_ADMIN_ID, trip_title: "Kerala Backwaters Escape",     destination: "Kochi, Alleppey, Munnar",       duration_days: 6,  raw_data: emptyRaw, created_at: "2025-12-22T00:00:00Z" },
    { id: i3,  user_id: DEMO_ADMIN_ID, trip_title: "Goa Beach Holiday",            destination: "North Goa, South Goa",          duration_days: 5,  raw_data: emptyRaw, created_at: "2025-12-25T00:00:00Z" },
    { id: i4,  user_id: DEMO_ADMIN_ID, trip_title: "Rajasthan Royal Tour",         destination: "Jodhpur, Udaipur, Jaisalmer",   duration_days: 8,  raw_data: emptyRaw, created_at: "2025-12-28T00:00:00Z" },
    { id: i5,  user_id: DEMO_ADMIN_ID, trip_title: "Himachal Adventure",           destination: "Manali, Kasol, Kufri",          duration_days: 7,  raw_data: emptyRaw, created_at: "2026-01-02T00:00:00Z" },
    { id: i6,  user_id: DEMO_ADMIN_ID, trip_title: "Andaman Island Break",         destination: "Port Blair, Havelock Island",   duration_days: 6,  raw_data: emptyRaw, created_at: "2026-01-10T00:00:00Z" },
    { id: i7,  user_id: DEMO_ADMIN_ID, trip_title: "Varanasi Heritage Journey",    destination: "Varanasi, Sarnath",             duration_days: 4,  raw_data: emptyRaw, created_at: "2026-01-15T00:00:00Z" },
    { id: i8,  user_id: DEMO_ADMIN_ID, trip_title: "Coorg & Mysore Retreat",       destination: "Coorg, Mysore",                 duration_days: 5,  raw_data: emptyRaw, created_at: "2026-01-20T00:00:00Z" },
    { id: i9,  user_id: DEMO_ADMIN_ID, trip_title: "Leh Ladakh Bike Expedition",   destination: "Leh, Nubra Valley, Pangong",    duration_days: 9,  raw_data: emptyRaw, created_at: "2026-02-01T00:00:00Z" },
    { id: i10, user_id: DEMO_ADMIN_ID, trip_title: "Kashmir Houseboat Experience", destination: "Srinagar, Gulmarg, Pahalgam",   duration_days: 7,  raw_data: emptyRaw, created_at: "2026-02-10T00:00:00Z" },
  ]);

  await supabase.from("trips").insert([
    { id: t1,  organization_id: DEMO_ORG_ID, client_id: c1, itinerary_id: i1,  name: "Golden Triangle Classic",      destination: "Delhi, Agra, Jaipur",         start_date: "2026-01-05", end_date: "2026-01-12", status: "completed",   pax_count: 4, notes: "Classic heritage circuit for Sharma family",         created_at: "2025-12-20T00:00:00Z" },
    { id: t2,  organization_id: DEMO_ORG_ID, client_id: c2, itinerary_id: i2,  name: "Kerala Backwaters Escape",     destination: "Kochi, Alleppey, Munnar",     start_date: "2026-01-18", end_date: "2026-01-24", status: "completed",   pax_count: 2, notes: "Romantic backwaters + hill station getaway",         created_at: "2025-12-22T00:00:00Z" },
    { id: t3,  organization_id: DEMO_ORG_ID, client_id: c3, itinerary_id: i3,  name: "Goa Beach Holiday",            destination: "North Goa, South Goa",        start_date: "2026-02-01", end_date: "2026-02-06", status: "completed",   pax_count: 6, notes: "Corporate offsite team trip",                        created_at: "2025-12-25T00:00:00Z" },
    { id: t4,  organization_id: DEMO_ORG_ID, client_id: c4, itinerary_id: i4,  name: "Rajasthan Royal Tour",         destination: "Jodhpur, Udaipur, Jaisalmer", start_date: "2026-02-10", end_date: "2026-02-18", status: "completed",   pax_count: 8, notes: "Luxury heritage tour for NRI group",                 created_at: "2025-12-28T00:00:00Z" },
    { id: t5,  organization_id: DEMO_ORG_ID, client_id: c5, itinerary_id: i5,  name: "Himachal Adventure",           destination: "Manali, Kasol, Kufri",        start_date: "2026-02-20", end_date: "2026-02-27", status: "completed",   pax_count: 3, notes: "Snow trekking adventure group",                      created_at: "2026-01-02T00:00:00Z" },
    { id: t6,  organization_id: DEMO_ORG_ID, client_id: c1, itinerary_id: i6,  name: "Andaman Island Break",         destination: "Port Blair, Havelock Island", start_date: "2026-03-01", end_date: "2026-03-07", status: "in_progress", pax_count: 2, notes: "Honeymoon couple — scuba + island hopping",          created_at: "2026-01-10T00:00:00Z" },
    { id: t7,  organization_id: DEMO_ORG_ID, client_id: c5, itinerary_id: i7,  name: "Varanasi Heritage Journey",    destination: "Varanasi, Sarnath",           start_date: "2026-03-12", end_date: "2026-03-16", status: "confirmed",   pax_count: 5, notes: "Cultural heritage group with temple visits",          created_at: "2026-01-15T00:00:00Z" },
    { id: t8,  organization_id: DEMO_ORG_ID, client_id: c6, itinerary_id: i8,  name: "Coorg & Mysore Retreat",       destination: "Coorg, Mysore",               start_date: "2026-03-18", end_date: "2026-03-23", status: "confirmed",   pax_count: 4, notes: "Family reunion — coffee estate + palace",            created_at: "2026-01-20T00:00:00Z" },
    { id: t9,  organization_id: DEMO_ORG_ID, client_id: c7, itinerary_id: i9,  name: "Leh Ladakh Bike Expedition",   destination: "Leh, Nubra Valley, Pangong",  start_date: "2026-04-05", end_date: "2026-04-14", status: "pending",     pax_count: 6, notes: "Adventure biking group — Enfield fleet",             created_at: "2026-02-01T00:00:00Z" },
    { id: t10, organization_id: DEMO_ORG_ID, client_id: c8, itinerary_id: i10, name: "Kashmir Houseboat Experience", destination: "Srinagar, Gulmarg, Pahalgam", start_date: "2026-04-10", end_date: "2026-04-17", status: "draft",       pax_count: 4, notes: "Luxury houseboat + skiing combo — awaiting deposit",  created_at: "2026-02-10T00:00:00Z" },
  ]);

  await supabase.from("trip_service_costs").insert([
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t1, category: "hotels",    vendor_name: "Taj Hotels",               description: "Taj Mahal Hotel Delhi — 3N",       pax_count: 4, cost_amount: 42000, price_amount: 60000, commission_pct: 10, commission_amount: 4200, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t1, category: "hotels",    vendor_name: "IHCL SeleQtions",          description: "Agra hotel — 2N",                  pax_count: 4, cost_amount: 28000, price_amount: 42000, commission_pct: 10, commission_amount: 2800, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t1, category: "vehicle",   vendor_name: "Rajasthan Tours & Travels",description: "Tempo Traveller 7 days",           pax_count: 4, cost_amount: 22000, price_amount: 34000, commission_pct: 15, commission_amount: 3300, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t1, category: "flights",   vendor_name: "IndiGo Airways",           description: "BOM-DEL + JAI-BOM (4 pax)",        pax_count: 4, cost_amount: 28000, price_amount: 40000, commission_pct:  3, commission_amount:  840, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t1, category: "insurance", vendor_name: "HDFC Ergo",                description: "Domestic travel insurance 4 pax",  pax_count: 4, cost_amount:  4000, price_amount:  6000, commission_pct:  0, commission_amount:    0, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t2, category: "hotels",    vendor_name: "Treebo Hotels",            description: "Kochi boutique 2N",                pax_count: 2, cost_amount: 12000, price_amount: 18000, commission_pct: 10, commission_amount: 1200, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t2, category: "hotels",    vendor_name: "Lake Palace Resort",       description: "Alleppey houseboat 1N",            pax_count: 2, cost_amount: 15000, price_amount: 24000, commission_pct: 10, commission_amount: 1500, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t2, category: "hotels",    vendor_name: "Tea Valley Resort",        description: "Munnar hill resort 2N",            pax_count: 2, cost_amount: 14000, price_amount: 22000, commission_pct: 10, commission_amount: 1400, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t2, category: "vehicle",   vendor_name: "Kerala Driver Association",description: "Sedan 6 days",                     pax_count: 2, cost_amount:  9000, price_amount: 14000, commission_pct: 15, commission_amount: 1350, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t2, category: "flights",   vendor_name: "Air India",                description: "BOM-COK + COK-BOM (2 pax)",        pax_count: 2, cost_amount: 14000, price_amount: 20000, commission_pct:  3, commission_amount:  420, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t3, category: "hotels",    vendor_name: "OYO Business",             description: "North Goa beach resort 3N",        pax_count: 6, cost_amount: 27000, price_amount: 42000, commission_pct: 10, commission_amount: 2700, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t3, category: "hotels",    vendor_name: "Taj Exotica Goa",          description: "South Goa luxury 2N",              pax_count: 6, cost_amount: 48000, price_amount: 72000, commission_pct: 10, commission_amount: 4800, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t3, category: "vehicle",   vendor_name: "Cab India",                description: "Multi-vehicle fleet 5 days",       pax_count: 6, cost_amount: 15000, price_amount: 24000, commission_pct: 15, commission_amount: 2250, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t3, category: "flights",   vendor_name: "SpiceJet",                 description: "BOM-GOI + GOI-BOM (6 pax)",        pax_count: 6, cost_amount: 36000, price_amount: 54000, commission_pct:  3, commission_amount: 1080, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t3, category: "other",     vendor_name: "Goa Water Sports Co",      description: "Parasailing + jet ski package",    pax_count: 6, cost_amount:  9000, price_amount: 15000, commission_pct:  0, commission_amount:    0, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t4, category: "hotels",    vendor_name: "Taj Hotels",               description: "Umaid Bhawan Jodhpur 3N",          pax_count: 8, cost_amount: 96000, price_amount:144000, commission_pct: 10, commission_amount: 9600, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t4, category: "hotels",    vendor_name: "Taj Hotels",               description: "Taj Lake Palace Udaipur 3N",       pax_count: 8, cost_amount:120000, price_amount:180000, commission_pct: 10, commission_amount:12000, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t4, category: "hotels",    vendor_name: "Suryagarh Jaisalmer",      description: "Desert luxury 2N",                 pax_count: 8, cost_amount: 64000, price_amount: 96000, commission_pct: 10, commission_amount: 6400, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t4, category: "vehicle",   vendor_name: "Rajasthan Tours & Travels",description: "Luxury bus 8 days",                pax_count: 8, cost_amount: 48000, price_amount: 72000, commission_pct: 15, commission_amount: 7200, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t4, category: "flights",   vendor_name: "IndiGo Airways",           description: "BOM-JDH + JAI-BOM (8 pax)",        pax_count: 8, cost_amount: 64000, price_amount: 96000, commission_pct:  3, commission_amount: 1920, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t5, category: "hotels",    vendor_name: "Snow Valley Resorts",      description: "Manali resort 4N",                 pax_count: 3, cost_amount: 18000, price_amount: 28000, commission_pct: 10, commission_amount: 1800, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t5, category: "hotels",    vendor_name: "Kasol Riverside Camp",     description: "Riverside camping 2N",             pax_count: 3, cost_amount:  6000, price_amount: 10000, commission_pct: 10, commission_amount:  600, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t5, category: "vehicle",   vendor_name: "Himachal Cabs",            description: "SUV Innova Crysta 7 days",         pax_count: 3, cost_amount: 14000, price_amount: 22000, commission_pct: 15, commission_amount: 2100, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t5, category: "train",     vendor_name: "IRCTC Premium",            description: "Delhi-Chandigarh Shatabdi (3 pax)",pax_count: 3, cost_amount:  4500, price_amount:  6500, commission_pct:  0, commission_amount:    0, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t6, category: "hotels",    vendor_name: "Havelock Beach Resort",    description: "Port Blair 2N + Havelock 3N",      pax_count: 2, cost_amount: 22000, price_amount: 35000, commission_pct: 10, commission_amount: 2200, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t6, category: "flights",   vendor_name: "IndiGo Airways",           description: "MAA-IXZ + IXZ-MAA (2 pax)",        pax_count: 2, cost_amount: 18000, price_amount: 26000, commission_pct:  3, commission_amount:  540, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t6, category: "other",     vendor_name: "Andaman Scuba Dive",       description: "PADI scuba diving course (2 pax)", pax_count: 2, cost_amount:  8000, price_amount: 14000, commission_pct:  0, commission_amount:    0, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t7, category: "hotels",    vendor_name: "BrijRama Palace",          description: "Heritage haveli on the Ghats 3N",  pax_count: 5, cost_amount: 35000, price_amount: 55000, commission_pct: 10, commission_amount: 3500, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t7, category: "train",     vendor_name: "Rajdhani Express",         description: "DEL-BSB + BSB-DEL (5 pax)",        pax_count: 5, cost_amount:  9000, price_amount: 14000, commission_pct:  0, commission_amount:    0, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t7, category: "vehicle",   vendor_name: "UP Cabs",                  description: "Local vehicle 4 days",             pax_count: 5, cost_amount:  6000, price_amount: 10000, commission_pct: 15, commission_amount:  900, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t8, category: "hotels",    vendor_name: "Evolve Back Coorg",        description: "Coffee estate resort 3N",          pax_count: 4, cost_amount: 36000, price_amount: 54000, commission_pct: 10, commission_amount: 3600, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t8, category: "hotels",    vendor_name: "Radisson Mysore",          description: "Mysore city hotel 2N",             pax_count: 4, cost_amount: 16000, price_amount: 24000, commission_pct: 10, commission_amount: 1600, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t8, category: "vehicle",   vendor_name: "Karnataka Cabs",           description: "Innova Crysta 5 days",             pax_count: 4, cost_amount: 12000, price_amount: 18000, commission_pct: 15, commission_amount: 1800, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t8, category: "flights",   vendor_name: "Air India",                description: "BOM-MYQ + MYQ-BOM (4 pax)",        pax_count: 4, cost_amount: 20000, price_amount: 30000, commission_pct:  3, commission_amount:  600, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t9, category: "hotels",    vendor_name: "Grand Dragon Ladakh",      description: "Leh hotel 3N + Nubra camp 2N",     pax_count: 6, cost_amount: 36000, price_amount: 54000, commission_pct: 10, commission_amount: 3600, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t9, category: "flights",   vendor_name: "IndiGo Airways",           description: "DEL-IXL + IXL-DEL (6 pax)",        pax_count: 6, cost_amount: 42000, price_amount: 60000, commission_pct:  3, commission_amount: 1260, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t9, category: "vehicle",   vendor_name: "Ladakh Riders",            description: "Royal Enfield fleet 9 days",       pax_count: 6, cost_amount: 54000, price_amount: 78000, commission_pct: 15, commission_amount: 8100, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t9, category: "insurance", vendor_name: "ICICI Lombard",            description: "High-altitude adventure cover",    pax_count: 6, cost_amount:  6000, price_amount:  9000, commission_pct:  0, commission_amount:    0, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t10,category: "hotels",    vendor_name: "Butt Houseboat Group",     description: "Dal Lake houseboat 4N",            pax_count: 4, cost_amount: 28000, price_amount: 44000, commission_pct: 10, commission_amount: 2800, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t10,category: "hotels",    vendor_name: "Khyber Himalayan Resort",  description: "Gulmarg ski resort 2N",            pax_count: 4, cost_amount: 40000, price_amount: 60000, commission_pct: 10, commission_amount: 4000, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t10,category: "flights",   vendor_name: "Air India",                description: "DEL-SXR + SXR-DEL (4 pax)",        pax_count: 4, cost_amount: 24000, price_amount: 36000, commission_pct:  3, commission_amount:  720, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, trip_id: t10,category: "vehicle",   vendor_name: "Kashmir Valley Cabs",      description: "Innova Crysta 7 days",             pax_count: 4, cost_amount: 14000, price_amount: 22000, commission_pct: 15, commission_amount: 2100, currency: "INR" },
  ]);

  await supabase.from("monthly_overhead_expenses").insert([
    { id: uuid(), organization_id: DEMO_ORG_ID, month_start: "2026-01-01", category: "wages",     description: "Staff salaries (3 employees)",      amount: 120000, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, month_start: "2026-01-01", category: "rent",      description: "Office rent — Andheri West",         amount:  35000, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, month_start: "2026-01-01", category: "marketing", description: "Google Ads + social media",           amount:  18000, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, month_start: "2026-01-01", category: "ca_fees",   description: "CA retainer — tax filing",            amount:  12000, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, month_start: "2026-01-01", category: "other",     description: "Internet + software subscriptions",   amount:   8000, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, month_start: "2026-02-01", category: "wages",     description: "Staff salaries (3 employees)",        amount: 120000, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, month_start: "2026-02-01", category: "rent",      description: "Office rent — Andheri West",          amount:  35000, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, month_start: "2026-02-01", category: "marketing", description: "Google Ads + Instagram boost",         amount:  22000, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, month_start: "2026-02-01", category: "ca_fees",   description: "CA retainer + GST filing",            amount:  15000, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, month_start: "2026-02-01", category: "other",     description: "Internet + SaaS tools",               amount:   8500, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, month_start: "2026-03-01", category: "wages",     description: "Staff salaries (3 employees)",        amount: 125000, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, month_start: "2026-03-01", category: "rent",      description: "Office rent — Andheri West",          amount:  35000, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, month_start: "2026-03-01", category: "marketing", description: "Peak season campaign boost",           amount:  28000, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, month_start: "2026-03-01", category: "ca_fees",   description: "CA retainer + annual filing prep",    amount:  18000, currency: "INR" },
    { id: uuid(), organization_id: DEMO_ORG_ID, month_start: "2026-03-01", category: "other",     description: "Internet + new CRM subscription",     amount:  10000, currency: "INR" },
  ]);

  await supabase.from("external_drivers").insert([
    { id: uuid(), organization_id: DEMO_ORG_ID, name: "Raju Singh",   phone: "+919800000001", vehicle_type: "Innova Crysta",   vehicle_number: "MH-02-AB-1234", created_at: "2025-12-10T00:00:00Z" },
    { id: uuid(), organization_id: DEMO_ORG_ID, name: "Suresh Kumar", phone: "+919800000002", vehicle_type: "Tempo Traveller", vehicle_number: "MH-04-CD-5678", created_at: "2025-12-10T00:00:00Z" },
    { id: uuid(), organization_id: DEMO_ORG_ID, name: "Mohan Yadav",  phone: "+919800000003", vehicle_type: "Innova Crysta",   vehicle_number: "MH-01-EF-9012", created_at: "2025-12-10T00:00:00Z" },
    { id: uuid(), organization_id: DEMO_ORG_ID, name: "Kiran Patil",  phone: "+919800000004", vehicle_type: "Ertiga",          vehicle_number: "MH-03-GH-3456", created_at: "2025-12-10T00:00:00Z" },
  ]);

  await supabase.from("workflow_stage_events").insert([
    { id: uuid(), profile_id: c11, organization_id: DEMO_ORG_ID, from_stage: "",                 to_stage: "lead",              changed_by: DEMO_ADMIN_ID, created_at: "2026-03-01T09:00:00Z" },
    { id: uuid(), profile_id: c12, organization_id: DEMO_ORG_ID, from_stage: "",                 to_stage: "lead",              changed_by: DEMO_ADMIN_ID, created_at: "2026-03-03T17:00:00Z" },
    { id: uuid(), profile_id: c9,  organization_id: DEMO_ORG_ID, from_stage: "lead",             to_stage: "prospect",          changed_by: DEMO_ADMIN_ID, created_at: "2026-02-22T15:00:00Z" },
    { id: uuid(), profile_id: c10, organization_id: DEMO_ORG_ID, from_stage: "lead",             to_stage: "prospect",          changed_by: DEMO_ADMIN_ID, created_at: "2026-02-27T10:00:00Z" },
    { id: uuid(), profile_id: c7,  organization_id: DEMO_ORG_ID, from_stage: "prospect",         to_stage: "proposal",          changed_by: DEMO_ADMIN_ID, created_at: "2026-02-12T14:00:00Z" },
    { id: uuid(), profile_id: c8,  organization_id: DEMO_ORG_ID, from_stage: "prospect",         to_stage: "proposal",          changed_by: DEMO_ADMIN_ID, created_at: "2026-02-18T11:00:00Z" },
    { id: uuid(), profile_id: c6,  organization_id: DEMO_ORG_ID, from_stage: "proposal",         to_stage: "payment_pending",   changed_by: DEMO_ADMIN_ID, created_at: "2026-02-05T16:00:00Z" },
    { id: uuid(), profile_id: c5,  organization_id: DEMO_ORG_ID, from_stage: "payment_pending",  to_stage: "payment_confirmed", changed_by: DEMO_ADMIN_ID, created_at: "2026-01-22T09:00:00Z" },
    { id: uuid(), profile_id: c1,  organization_id: DEMO_ORG_ID, from_stage: "payment_confirmed",to_stage: "active",            changed_by: DEMO_ADMIN_ID, created_at: "2026-01-05T07:00:00Z" },
    { id: uuid(), profile_id: c2,  organization_id: DEMO_ORG_ID, from_stage: "payment_confirmed",to_stage: "active",            changed_by: DEMO_ADMIN_ID, created_at: "2026-01-18T06:00:00Z" },
    { id: uuid(), profile_id: c3,  organization_id: DEMO_ORG_ID, from_stage: "active",           to_stage: "review",            changed_by: DEMO_ADMIN_ID, created_at: "2026-02-07T10:00:00Z" },
    { id: uuid(), profile_id: c4,  organization_id: DEMO_ORG_ID, from_stage: "review",           to_stage: "past",              changed_by: DEMO_ADMIN_ID, created_at: "2026-02-20T14:00:00Z" },
  ]);

  return NextResponse.json({ ok: true, message: "Demo organization seeded successfully with ~150 records." });
}
