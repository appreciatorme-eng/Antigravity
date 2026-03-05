-- Demo Organization seed: Creates a standalone "GoBuddy Adventures (Demo)" org.
-- Idempotent: skips all inserts if the demo org already exists.
-- Fixed UUID so NEXT_PUBLIC_DEMO_ORG_ID can reference it deterministically.
-- All UUIDs use only valid hex characters (0-9, a-f).

DO $$
DECLARE
  v_demo_org uuid := 'd0000000-0000-4000-8000-000000000001';
  -- Admin profile
  v_admin    uuid := 'd0000000-0000-4000-8000-000000000002';
  -- Client profiles
  v_c1  uuid := 'd0000000-0000-4000-8001-000000000001';
  v_c2  uuid := 'd0000000-0000-4000-8001-000000000002';
  v_c3  uuid := 'd0000000-0000-4000-8001-000000000003';
  v_c4  uuid := 'd0000000-0000-4000-8001-000000000004';
  v_c5  uuid := 'd0000000-0000-4000-8001-000000000005';
  v_c6  uuid := 'd0000000-0000-4000-8001-000000000006';
  v_c7  uuid := 'd0000000-0000-4000-8001-000000000007';
  v_c8  uuid := 'd0000000-0000-4000-8001-000000000008';
  v_c9  uuid := 'd0000000-0000-4000-8001-000000000009';
  v_c10 uuid := 'd0000000-0000-4000-8001-000000000010';
  v_c11 uuid := 'd0000000-0000-4000-8001-000000000011';
  v_c12 uuid := 'd0000000-0000-4000-8001-000000000012';
  -- Driver profiles
  v_d1  uuid := 'd0000000-0000-4000-8002-000000000001';
  v_d2  uuid := 'd0000000-0000-4000-8002-000000000002';
  v_d3  uuid := 'd0000000-0000-4000-8002-000000000003';
  v_d4  uuid := 'd0000000-0000-4000-8002-000000000004';
  -- Trip IDs
  v_t1  uuid := 'd0000000-0000-4000-8003-000000000001';
  v_t2  uuid := 'd0000000-0000-4000-8003-000000000002';
  v_t3  uuid := 'd0000000-0000-4000-8003-000000000003';
  v_t4  uuid := 'd0000000-0000-4000-8003-000000000004';
  v_t5  uuid := 'd0000000-0000-4000-8003-000000000005';
  v_t6  uuid := 'd0000000-0000-4000-8003-000000000006';
  v_t7  uuid := 'd0000000-0000-4000-8003-000000000007';
  v_t8  uuid := 'd0000000-0000-4000-8003-000000000008';
  v_t9  uuid := 'd0000000-0000-4000-8003-000000000009';
  v_t10 uuid := 'd0000000-0000-4000-8003-000000000010';
  -- Itinerary IDs
  v_i1  uuid := 'd0000000-0000-4000-8004-000000000001';
  v_i2  uuid := 'd0000000-0000-4000-8004-000000000002';
  v_i3  uuid := 'd0000000-0000-4000-8004-000000000003';
  v_i4  uuid := 'd0000000-0000-4000-8004-000000000004';
  v_i5  uuid := 'd0000000-0000-4000-8004-000000000005';
  v_i6  uuid := 'd0000000-0000-4000-8004-000000000006';
  v_i7  uuid := 'd0000000-0000-4000-8004-000000000007';
  v_i8  uuid := 'd0000000-0000-4000-8004-000000000008';
  v_i9  uuid := 'd0000000-0000-4000-8004-000000000009';
  v_i10 uuid := 'd0000000-0000-4000-8004-000000000010';
BEGIN
  -- Skip if demo org already seeded
  IF EXISTS (SELECT 1 FROM public.organizations WHERE id = v_demo_org) THEN
    RAISE NOTICE 'Demo organization already exists — skipping.';
    RETURN;
  END IF;

  -- ====================================================================
  -- 1. ORGANIZATION
  -- ====================================================================
  INSERT INTO public.organizations (id, name, slug, subscription_tier, created_at)
  VALUES (v_demo_org, 'GoBuddy Adventures (Demo)', 'gobuddy-demo', 'premium', '2025-12-01T00:00:00Z');

  -- ====================================================================
  -- 2. PROFILES — Admin
  -- ====================================================================
  INSERT INTO public.profiles (id, full_name, email, role, organization_id, lifecycle_stage, created_at)
  VALUES (v_admin, 'Avinash Kapoor', 'avinash@gobuddy-demo.in', 'admin', v_demo_org, NULL, '2025-12-01T00:00:00Z');

  -- ====================================================================
  -- 3. PROFILES — Clients (12 clients at various lifecycle stages)
  -- ====================================================================
  INSERT INTO public.profiles (id, full_name, email, phone, role, organization_id, lifecycle_stage, created_at)
  VALUES
    (v_c1,  'Priya Sharma',      'priya.sharma@gmail.com',     '+919876543210', 'client', v_demo_org, 'active',           '2025-12-15T10:00:00Z'),
    (v_c2,  'Rajesh Gupta',      'rajesh.gupta@yahoo.com',     '+919876543211', 'client', v_demo_org, 'active',           '2025-12-20T14:00:00Z'),
    (v_c3,  'Ananya Patel',      'ananya.patel@outlook.com',   '+919876543212', 'client', v_demo_org, 'review',           '2026-01-05T09:00:00Z'),
    (v_c4,  'Vikram Singh',      'vikram.singh@hotmail.com',   '+919876543213', 'client', v_demo_org, 'past',             '2026-01-10T11:00:00Z'),
    (v_c5,  'Deepika Nair',      'deepika.nair@gmail.com',     '+919876543214', 'client', v_demo_org, 'payment_confirmed','2026-01-20T16:00:00Z'),
    (v_c6,  'Amit Mehta',        'amit.mehta@proton.me',       '+919876543215', 'client', v_demo_org, 'payment_pending',  '2026-02-01T08:00:00Z'),
    (v_c7,  'Kavita Joshi',      'kavita.joshi@gmail.com',     '+919876543216', 'client', v_demo_org, 'proposal',         '2026-02-10T13:00:00Z'),
    (v_c8,  'Suresh Reddy',      'suresh.reddy@yahoo.com',     '+919876543217', 'client', v_demo_org, 'proposal',         '2026-02-15T10:00:00Z'),
    (v_c9,  'Neha Kapoor',       'neha.kapoor@gmail.com',      '+919876543218', 'client', v_demo_org, 'prospect',         '2026-02-20T15:00:00Z'),
    (v_c10, 'Arjun Malhotra',    'arjun.malhotra@gmail.com',   '+919876543219', 'client', v_demo_org, 'prospect',         '2026-02-25T12:00:00Z'),
    (v_c11, 'Sunita Iyer',       'sunita.iyer@rediffmail.com', '+919876543220', 'client', v_demo_org, 'lead',             '2026-03-01T09:00:00Z'),
    (v_c12, 'Ravi Krishnan',     'ravi.krishnan@gmail.com',    '+919876543221', 'client', v_demo_org, 'lead',             '2026-03-03T17:00:00Z');

  -- ====================================================================
  -- 4. PROFILES — Drivers
  -- ====================================================================
  INSERT INTO public.profiles (id, full_name, email, phone, role, organization_id, created_at)
  VALUES
    (v_d1, 'Raju Singh',    'raju.driver@gobuddy-demo.in',    '+919800000001', 'driver', v_demo_org, '2025-12-10T00:00:00Z'),
    (v_d2, 'Suresh Kumar',  'suresh.driver@gobuddy-demo.in',  '+919800000002', 'driver', v_demo_org, '2025-12-10T00:00:00Z'),
    (v_d3, 'Mohan Yadav',   'mohan.driver@gobuddy-demo.in',   '+919800000003', 'driver', v_demo_org, '2025-12-10T00:00:00Z'),
    (v_d4, 'Kiran Patil',   'kiran.driver@gobuddy-demo.in',   '+919800000004', 'driver', v_demo_org, '2025-12-10T00:00:00Z');

  -- ====================================================================
  -- 5. ITINERARIES (10 — linked to trips below)
  -- ====================================================================
  INSERT INTO public.itineraries (id, user_id, trip_title, destination, duration_days, created_at)
  VALUES
    (v_i1,  v_admin, 'Golden Triangle Classic',       'Delhi, Agra, Jaipur',            7,  '2025-12-20T00:00:00Z'),
    (v_i2,  v_admin, 'Kerala Backwaters Escape',      'Kochi, Alleppey, Munnar',        6,  '2025-12-22T00:00:00Z'),
    (v_i3,  v_admin, 'Goa Beach Holiday',             'North Goa, South Goa',           5,  '2025-12-25T00:00:00Z'),
    (v_i4,  v_admin, 'Rajasthan Royal Tour',          'Jodhpur, Udaipur, Jaisalmer',    8,  '2025-12-28T00:00:00Z'),
    (v_i5,  v_admin, 'Himachal Adventure',            'Manali, Kasol, Kufri',           7,  '2026-01-02T00:00:00Z'),
    (v_i6,  v_admin, 'Andaman Island Break',          'Port Blair, Havelock Island',    6,  '2026-01-10T00:00:00Z'),
    (v_i7,  v_admin, 'Varanasi Heritage Journey',     'Varanasi, Sarnath',              4,  '2026-01-15T00:00:00Z'),
    (v_i8,  v_admin, 'Coorg & Mysore Retreat',        'Coorg, Mysore',                  5,  '2026-01-20T00:00:00Z'),
    (v_i9,  v_admin, 'Leh Ladakh Bike Expedition',    'Leh, Nubra Valley, Pangong',     9,  '2026-02-01T00:00:00Z'),
    (v_i10, v_admin, 'Kashmir Houseboat Experience',  'Srinagar, Gulmarg, Pahalgam',    7,  '2026-02-10T00:00:00Z');

  -- ====================================================================
  -- 6. TRIPS (10 — various statuses spanning Jan–Apr 2026)
  -- ====================================================================
  INSERT INTO public.trips (id, organization_id, client_id, itinerary_id, name, destination, start_date, end_date, status, pax_count, notes, created_at)
  VALUES
    -- 5 completed (Jan–Feb)
    (v_t1,  v_demo_org, v_c1, v_i1,  'Golden Triangle Classic',     'Delhi, Agra, Jaipur',         '2026-01-05','2026-01-12','completed',   4, 'Classic heritage circuit for Sharma family',         '2025-12-20T00:00:00Z'),
    (v_t2,  v_demo_org, v_c2, v_i2,  'Kerala Backwaters Escape',    'Kochi, Alleppey, Munnar',     '2026-01-18','2026-01-24','completed',   2, 'Romantic backwaters + hill station getaway',         '2025-12-22T00:00:00Z'),
    (v_t3,  v_demo_org, v_c3, v_i3,  'Goa Beach Holiday',           'North Goa, South Goa',        '2026-02-01','2026-02-06','completed',   6, 'Corporate offsite team trip',                        '2025-12-25T00:00:00Z'),
    (v_t4,  v_demo_org, v_c4, v_i4,  'Rajasthan Royal Tour',        'Jodhpur, Udaipur, Jaisalmer', '2026-02-10','2026-02-18','completed',   8, 'Luxury heritage tour for NRI group',                 '2025-12-28T00:00:00Z'),
    (v_t5,  v_demo_org, v_c5, v_i5,  'Himachal Adventure',          'Manali, Kasol, Kufri',        '2026-02-20','2026-02-27','completed',   3, 'Snow trekking adventure group',                      '2026-01-02T00:00:00Z'),
    -- 2 in-progress (Mar)
    (v_t6,  v_demo_org, v_c1, v_i6,  'Andaman Island Break',        'Port Blair, Havelock Island', '2026-03-01','2026-03-07','in_progress', 2, 'Honeymoon couple — scuba + island hopping',          '2026-01-10T00:00:00Z'),
    (v_t7,  v_demo_org, v_c5, v_i7,  'Varanasi Heritage Journey',   'Varanasi, Sarnath',           '2026-03-12','2026-03-16','confirmed',   5, 'Cultural heritage group with temple visits',          '2026-01-15T00:00:00Z'),
    -- 3 upcoming (Mar–Apr)
    (v_t8,  v_demo_org, v_c6, v_i8,  'Coorg & Mysore Retreat',      'Coorg, Mysore',               '2026-03-18','2026-03-23','confirmed',   4, 'Family reunion — coffee estate + palace',            '2026-01-20T00:00:00Z'),
    (v_t9,  v_demo_org, v_c7, v_i9,  'Leh Ladakh Bike Expedition',  'Leh, Nubra Valley, Pangong',  '2026-04-05','2026-04-14','pending',     6, 'Adventure biking group — Enfield fleet',             '2026-02-01T00:00:00Z'),
    (v_t10, v_demo_org, v_c8, v_i10, 'Kashmir Houseboat Experience','Srinagar, Gulmarg, Pahalgam', '2026-04-10','2026-04-17','draft',       4, 'Luxury houseboat + skiing combo — awaiting deposit', '2026-02-10T00:00:00Z');

  -- ====================================================================
  -- 7. TRIP SERVICE COSTS (~45 line items across 10 trips)
  -- ====================================================================

  -- TRIP 1 — Golden Triangle (4 pax, completed, Jan)
  INSERT INTO public.trip_service_costs
    (id, organization_id, trip_id, category, vendor_name, description, pax_count, cost_amount, price_amount, commission_pct, commission_amount, currency)
  VALUES
    (gen_random_uuid(), v_demo_org, v_t1, 'hotels',    'Taj Hotels',               'Taj Mahal Hotel Delhi — 3N',       4, 42000, 60000, 10, 4200, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t1, 'hotels',    'IHCL SeleQtions',          'Agra hotel — 2N',                  4, 28000, 42000, 10, 2800, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t1, 'vehicle',   'Rajasthan Tours & Travels','Tempo Traveller 7 days',           4, 22000, 34000, 15, 3300, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t1, 'flights',   'IndiGo Airways',           'BOM-DEL + JAI-BOM (4 pax)',        4, 28000, 40000,  3,  840, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t1, 'insurance', 'HDFC Ergo',                'Domestic travel insurance 4 pax',  4,  4000,  6000,  0,    0, 'INR'),

  -- TRIP 2 — Kerala Backwaters (2 pax, completed, Jan)
    (gen_random_uuid(), v_demo_org, v_t2, 'hotels',    'Treebo Hotels',            'Kochi boutique 2N',                2, 12000, 18000, 10, 1200, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t2, 'hotels',    'Lake Palace Resort',       'Alleppey houseboat 1N',            2, 15000, 24000, 10, 1500, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t2, 'hotels',    'Tea Valley Resort',        'Munnar hill resort 2N',            2, 14000, 22000, 10, 1400, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t2, 'vehicle',   'Kerala Driver Association','Sedan 6 days',                     2,  9000, 14000, 15, 1350, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t2, 'flights',   'Air India',                'BOM-COK + COK-BOM (2 pax)',        2, 14000, 20000,  3,  420, 'INR'),

  -- TRIP 3 — Goa Beach (6 pax, completed, Feb)
    (gen_random_uuid(), v_demo_org, v_t3, 'hotels',    'OYO Business',             'North Goa beach resort 3N',        6, 27000, 42000, 10, 2700, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t3, 'hotels',    'Taj Exotica Goa',          'South Goa luxury 2N',              6, 48000, 72000, 10, 4800, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t3, 'vehicle',   'Cab India',                'Multi-vehicle fleet 5 days',       6, 15000, 24000, 15, 2250, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t3, 'flights',   'SpiceJet',                 'BOM-GOI + GOI-BOM (6 pax)',        6, 36000, 54000,  3, 1080, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t3, 'other',     'Goa Water Sports Co',      'Parasailing + jet ski package',    6,  9000, 15000,  0,    0, 'INR'),

  -- TRIP 4 — Rajasthan Royal (8 pax, completed, Feb)
    (gen_random_uuid(), v_demo_org, v_t4, 'hotels',    'Taj Hotels',               'Umaid Bhawan Jodhpur 3N',          8, 96000,144000, 10, 9600, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t4, 'hotels',    'Taj Hotels',               'Taj Lake Palace Udaipur 3N',       8,120000,180000, 10,12000, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t4, 'hotels',    'Suryagarh Jaisalmer',      'Desert luxury 2N',                 8, 64000, 96000, 10, 6400, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t4, 'vehicle',   'Rajasthan Tours & Travels','Luxury bus 8 days',                8, 48000, 72000, 15, 7200, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t4, 'flights',   'IndiGo Airways',           'BOM-JDH + JAI-BOM (8 pax)',        8, 64000, 96000,  3, 1920, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t4, 'other',     'Rajasthan Heritage Walk',  'Guided heritage walks 4 cities',   8, 12000, 20000,  0,    0, 'INR'),

  -- TRIP 5 — Himachal Adventure (3 pax, completed, Feb)
    (gen_random_uuid(), v_demo_org, v_t5, 'hotels',    'Snow Valley Resorts',      'Manali resort 4N',                 3, 18000, 28000, 10, 1800, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t5, 'hotels',    'Kasol Riverside Camp',     'Riverside camping 2N',             3,  6000, 10000, 10,  600, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t5, 'vehicle',   'Himachal Cabs',            'SUV Innova Crysta 7 days',         3, 14000, 22000, 15, 2100, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t5, 'train',     'IRCTC Premium',            'Delhi-Chandigarh Shatabdi (3 pax)',3,  4500,  6500,  0,    0, 'INR'),

  -- TRIP 6 — Andaman Island (2 pax, in_progress, Mar)
    (gen_random_uuid(), v_demo_org, v_t6, 'hotels',    'Havelock Beach Resort',    'Port Blair 2N + Havelock 3N',      2, 22000, 35000, 10, 2200, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t6, 'flights',   'IndiGo Airways',           'MAA-IXZ + IXZ-MAA (2 pax)',        2, 18000, 26000,  3,  540, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t6, 'other',     'Andaman Scuba Dive',       'PADI scuba diving course (2 pax)', 2,  8000, 14000,  0,    0, 'INR'),

  -- TRIP 7 — Varanasi Heritage (5 pax, confirmed, Mar)
    (gen_random_uuid(), v_demo_org, v_t7, 'hotels',    'BrijRama Palace',          'Heritage haveli on the Ghats 3N',  5, 35000, 55000, 10, 3500, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t7, 'train',     'Rajdhani Express',         'DEL-BSB + BSB-DEL (5 pax)',        5,  9000, 14000,  0,    0, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t7, 'vehicle',   'UP Cabs',                  'Local vehicle 4 days',             5,  6000, 10000, 15,  900, 'INR'),

  -- TRIP 8 — Coorg & Mysore (4 pax, confirmed, Mar)
    (gen_random_uuid(), v_demo_org, v_t8, 'hotels',    'Evolve Back Coorg',        'Coffee estate resort 3N',          4, 36000, 54000, 10, 3600, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t8, 'hotels',    'Radisson Mysore',          'Mysore city hotel 2N',             4, 16000, 24000, 10, 1600, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t8, 'vehicle',   'Karnataka Cabs',           'Innova Crysta 5 days',             4, 12000, 18000, 15, 1800, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t8, 'flights',   'Air India',                'BOM-MYQ + MYQ-BOM (4 pax)',        4, 20000, 30000,  3,  600, 'INR'),

  -- TRIP 9 — Leh Ladakh (6 pax, pending, Apr)
    (gen_random_uuid(), v_demo_org, v_t9, 'hotels',    'Grand Dragon Ladakh',      'Leh hotel 3N + Nubra camp 2N',     6, 36000, 54000, 10, 3600, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t9, 'flights',   'IndiGo Airways',           'DEL-IXL + IXL-DEL (6 pax)',        6, 42000, 60000,  3, 1260, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t9, 'vehicle',   'Ladakh Riders',            'Royal Enfield fleet 9 days',       6, 54000, 78000, 15, 8100, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t9, 'insurance', 'ICICI Lombard',            'High-altitude adventure cover',    6,  6000,  9000,  0,    0, 'INR'),

  -- TRIP 10 — Kashmir Houseboat (4 pax, draft, Apr)
    (gen_random_uuid(), v_demo_org, v_t10, 'hotels',   'Butt Houseboat Group',     'Dal Lake houseboat 4N',            4, 28000, 44000, 10, 2800, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t10, 'hotels',   'Khyber Himalayan Resort',  'Gulmarg ski resort 2N',            4, 40000, 60000, 10, 4000, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t10, 'flights',  'Air India',                'DEL-SXR + SXR-DEL (4 pax)',        4, 24000, 36000,  3,  720, 'INR'),
    (gen_random_uuid(), v_demo_org, v_t10, 'vehicle',  'Kashmir Valley Cabs',      'Innova Crysta 7 days',             4, 14000, 22000, 15, 2100, 'INR');

  -- ====================================================================
  -- 8. MONTHLY OVERHEAD EXPENSES (Jan–Mar 2026, 5 categories each)
  -- ====================================================================
  INSERT INTO public.monthly_overhead_expenses
    (id, organization_id, month_start, category, description, amount, currency)
  VALUES
    -- January
    (gen_random_uuid(), v_demo_org, '2026-01-01', 'wages',     'Staff salaries (3 employees)',      120000, 'INR'),
    (gen_random_uuid(), v_demo_org, '2026-01-01', 'rent',      'Office rent — Andheri West',         35000, 'INR'),
    (gen_random_uuid(), v_demo_org, '2026-01-01', 'marketing', 'Google Ads + social media',          18000, 'INR'),
    (gen_random_uuid(), v_demo_org, '2026-01-01', 'ca_fees',   'CA retainer — tax filing',           12000, 'INR'),
    (gen_random_uuid(), v_demo_org, '2026-01-01', 'other',     'Internet + software subscriptions',   8000, 'INR'),
    -- February
    (gen_random_uuid(), v_demo_org, '2026-02-01', 'wages',     'Staff salaries (3 employees)',      120000, 'INR'),
    (gen_random_uuid(), v_demo_org, '2026-02-01', 'rent',      'Office rent — Andheri West',         35000, 'INR'),
    (gen_random_uuid(), v_demo_org, '2026-02-01', 'marketing', 'Google Ads + Instagram boost',       22000, 'INR'),
    (gen_random_uuid(), v_demo_org, '2026-02-01', 'ca_fees',   'CA retainer + GST filing',           15000, 'INR'),
    (gen_random_uuid(), v_demo_org, '2026-02-01', 'other',     'Internet + SaaS tools',               8500, 'INR'),
    -- March
    (gen_random_uuid(), v_demo_org, '2026-03-01', 'wages',     'Staff salaries (3 employees)',      125000, 'INR'),
    (gen_random_uuid(), v_demo_org, '2026-03-01', 'rent',      'Office rent — Andheri West',         35000, 'INR'),
    (gen_random_uuid(), v_demo_org, '2026-03-01', 'marketing', 'Peak season campaign boost',         28000, 'INR'),
    (gen_random_uuid(), v_demo_org, '2026-03-01', 'ca_fees',   'CA retainer + annual filing prep',   18000, 'INR'),
    (gen_random_uuid(), v_demo_org, '2026-03-01', 'other',     'Internet + new CRM subscription',    10000, 'INR');

  -- ====================================================================
  -- 9. EXTERNAL DRIVERS (4 drivers with vehicle details)
  -- ====================================================================
  INSERT INTO public.external_drivers
    (id, organization_id, name, phone, vehicle_type, vehicle_number, created_at)
  VALUES
    (gen_random_uuid(), v_demo_org, 'Raju Singh',    '+919800000001', 'Innova Crysta',   'MH-02-AB-1234', '2025-12-10T00:00:00Z'),
    (gen_random_uuid(), v_demo_org, 'Suresh Kumar',  '+919800000002', 'Tempo Traveller', 'MH-04-CD-5678', '2025-12-10T00:00:00Z'),
    (gen_random_uuid(), v_demo_org, 'Mohan Yadav',   '+919800000003', 'Innova Crysta',   'MH-01-EF-9012', '2025-12-10T00:00:00Z'),
    (gen_random_uuid(), v_demo_org, 'Kiran Patil',   '+919800000004', 'Ertiga',          'MH-03-GH-3456', '2025-12-10T00:00:00Z');

  -- ====================================================================
  -- 10. NOTIFICATION LOGS (15 demo notifications)
  -- ====================================================================
  INSERT INTO public.notification_logs
    (id, notification_type, recipient_id, recipient_type, title, body, status, sent_at)
  VALUES
    (gen_random_uuid(), 'trip_confirmation', v_c1,  'client', 'Trip Confirmed!',          'Your Golden Triangle Classic trip is confirmed for Jan 5-12.',         'delivered', '2026-01-02T10:00:00Z'),
    (gen_random_uuid(), 'payment_reminder',  v_c2,  'client', 'Payment Reminder',         'Balance of Rs 48,000 due for Kerala Backwaters Escape.',              'delivered', '2026-01-10T09:00:00Z'),
    (gen_random_uuid(), 'trip_started',      v_c1,  'client', 'Your Trip Has Started!',   'Welcome to Delhi! Your driver Raju will meet you at the airport.',    'delivered', '2026-01-05T07:00:00Z'),
    (gen_random_uuid(), 'trip_completed',    v_c1,  'client', 'Trip Completed',           'Thank you for traveling with us! Please leave a review.',             'delivered', '2026-01-12T18:00:00Z'),
    (gen_random_uuid(), 'review_request',    v_c3,  'client', 'How was your trip?',       'We would love your feedback on the Goa Beach Holiday!',              'delivered', '2026-02-07T10:00:00Z'),
    (gen_random_uuid(), 'invoice_sent',      v_c4,  'client', 'Invoice Sent',             'Your invoice for Rajasthan Royal Tour has been emailed.',             'delivered', '2026-02-20T14:00:00Z'),
    (gen_random_uuid(), 'trip_confirmation', v_c5,  'client', 'Trip Confirmed!',          'Varanasi Heritage Journey confirmed for Mar 12-16.',                 'delivered', '2026-02-25T11:00:00Z'),
    (gen_random_uuid(), 'payment_reminder',  v_c6,  'client', 'Payment Reminder',         'Deposit of Rs 25,000 due for Coorg & Mysore Retreat.',               'sent',      '2026-03-01T09:00:00Z'),
    (gen_random_uuid(), 'proposal_sent',     v_c7,  'client', 'Your Proposal is Ready',   'Leh Ladakh Bike Expedition proposal — 3 package options enclosed.',  'delivered', '2026-02-15T16:00:00Z'),
    (gen_random_uuid(), 'proposal_sent',     v_c8,  'client', 'Your Proposal is Ready',   'Kashmir Houseboat Experience — luxury package enclosed.',             'delivered', '2026-02-20T12:00:00Z'),
    (gen_random_uuid(), 'whatsapp_message',  v_c9,  'client', 'WhatsApp: New Inquiry',    'Hi, I am interested in a Bali trip for 4 people in May.',            'delivered', '2026-02-22T14:30:00Z'),
    (gen_random_uuid(), 'whatsapp_message',  v_c10, 'client', 'WhatsApp: Budget Check',   'What would be the budget for Maldives 5N for honeymoon?',            'delivered', '2026-02-26T16:00:00Z'),
    (gen_random_uuid(), 'email_inquiry',     v_c11, 'client', 'Website Inquiry',          'New lead from website — interested in group tour to Rajasthan.',      'pending',   '2026-03-01T09:00:00Z'),
    (gen_random_uuid(), 'email_inquiry',     v_c12, 'client', 'Website Inquiry',          'New lead — corporate offsite for 15 pax in Goa.',                    'pending',   '2026-03-03T17:00:00Z'),
    (gen_random_uuid(), 'driver_assignment', v_d1,  'driver', 'New Assignment',           'You have been assigned to Andaman Island Break (Mar 1-7).',          'delivered', '2026-02-28T10:00:00Z');

  -- ====================================================================
  -- 11. WORKFLOW STAGE EVENTS (client lifecycle transitions)
  -- ====================================================================
  INSERT INTO public.workflow_stage_events
    (id, profile_id, organization_id, from_stage, to_stage, changed_by, created_at)
  VALUES
    (gen_random_uuid(), v_c11, v_demo_org, NULL,               'lead',             v_admin, '2026-03-01T09:00:00Z'),
    (gen_random_uuid(), v_c12, v_demo_org, NULL,               'lead',             v_admin, '2026-03-03T17:00:00Z'),
    (gen_random_uuid(), v_c9,  v_demo_org, 'lead',             'prospect',         v_admin, '2026-02-22T15:00:00Z'),
    (gen_random_uuid(), v_c10, v_demo_org, 'lead',             'prospect',         v_admin, '2026-02-27T10:00:00Z'),
    (gen_random_uuid(), v_c7,  v_demo_org, 'prospect',         'proposal',         v_admin, '2026-02-12T14:00:00Z'),
    (gen_random_uuid(), v_c8,  v_demo_org, 'prospect',         'proposal',         v_admin, '2026-02-18T11:00:00Z'),
    (gen_random_uuid(), v_c6,  v_demo_org, 'proposal',         'payment_pending',  v_admin, '2026-02-05T16:00:00Z'),
    (gen_random_uuid(), v_c5,  v_demo_org, 'payment_pending',  'payment_confirmed',v_admin, '2026-01-22T09:00:00Z'),
    (gen_random_uuid(), v_c1,  v_demo_org, 'payment_confirmed','active',           v_admin, '2026-01-05T07:00:00Z'),
    (gen_random_uuid(), v_c2,  v_demo_org, 'payment_confirmed','active',           v_admin, '2026-01-18T06:00:00Z'),
    (gen_random_uuid(), v_c3,  v_demo_org, 'active',           'review',           v_admin, '2026-02-07T10:00:00Z'),
    (gen_random_uuid(), v_c4,  v_demo_org, 'review',           'past',             v_admin, '2026-02-20T14:00:00Z');

  RAISE NOTICE 'Demo organization seeded successfully with ~150 records.';
END $$;
