-- Demo seed: 8 Indian tours, ~40 cost entries, 3 months overhead.
-- Idempotent: skips insert if demo trips already exist for this org.

DO $$
DECLARE
  v_org_id   uuid;
  v_t1       uuid := gen_random_uuid();
  v_t2       uuid := gen_random_uuid();
  v_t3       uuid := gen_random_uuid();
  v_t4       uuid := gen_random_uuid();
  v_t5       uuid := gen_random_uuid();
  v_t6       uuid := gen_random_uuid();
  v_t7       uuid := gen_random_uuid();
  v_t8       uuid := gen_random_uuid();
BEGIN
  SELECT id INTO v_org_id FROM public.organizations ORDER BY created_at LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE NOTICE 'No organization found — skipping pricing seed.';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.trips
    WHERE organization_id = v_org_id
      AND name IN ('Golden Triangle Classic', 'Kerala Backwaters Escape')
  ) THEN
    RAISE NOTICE 'Pricing demo data already seeded — skipping.';
    RETURN;
  END IF;

  -- ---------------------------------------------------------------
  -- TRIPS
  -- ---------------------------------------------------------------
  INSERT INTO public.trips (id, organization_id, name, destination, start_date, end_date, status, pax_count, notes)
  VALUES
    (v_t1, v_org_id, 'Golden Triangle Classic',  'Delhi · Agra · Jaipur',       '2026-01-05', '2026-01-12', 'completed',    4, 'Classic heritage circuit for Sharma family'),
    (v_t2, v_org_id, 'Kerala Backwaters Escape',  'Kochi · Alleppey · Munnar',   '2026-01-18', '2026-01-24', 'completed',    2, 'Romantic backwaters + hill station getaway'),
    (v_t3, v_org_id, 'Goa Beach Holiday',         'North Goa · South Goa',       '2026-02-01', '2026-02-06', 'completed',    6, 'Corporate offsite team trip'),
    (v_t4, v_org_id, 'Rajasthan Royal Tour',      'Jodhpur · Udaipur · Jaisalmer','2026-02-10', '2026-02-18', 'completed',   8, 'Luxury heritage tour for NRI group'),
    (v_t5, v_org_id, 'Himachal Adventure',        'Manali · Kasol · Kufri',      '2026-02-20', '2026-02-27', 'completed',    3, 'Snow trekking adventure group'),
    (v_t6, v_org_id, 'Andaman Island Break',      'Port Blair · Havelock Island', '2026-03-01', '2026-03-07', 'in_progress',  2, 'Honeymoon couple — scuba + island hopping'),
    (v_t7, v_org_id, 'Varanasi Heritage Journey', 'Varanasi · Sarnath',          '2026-03-12', '2026-03-16', 'confirmed',    5, 'Cultural heritage group'),
    (v_t8, v_org_id, 'Coorg & Mysore Retreat',    'Coorg · Mysore',              '2026-03-18', '2026-03-23', 'confirmed',    4, 'Family reunion — coffee estate + palace');

  -- ---------------------------------------------------------------
  -- TRIP SERVICE COSTS
  -- Format: (id, org, trip, category, vendor, description, pax, cost, price, currency)
  -- ---------------------------------------------------------------

  -- TRIP 1 — Golden Triangle (4 pax, Jan)
  INSERT INTO public.trip_service_costs
    (id, organization_id, trip_id, category, vendor_name, description, pax_count, cost_amount, price_amount, currency)
  VALUES
    (gen_random_uuid(), v_org_id, v_t1, 'hotels',    'Taj Hotels',              'Taj Mahal Hotel Delhi — 3 nights',       4, 42000, 60000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t1, 'hotels',    'IHCL SeleQtions',         'Agra hotel — 2 nights',                  4, 28000, 42000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t1, 'hotels',    'Taj Hotels',              'Rambagh Palace Jaipur — 2 nights',       4, 52000, 72000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t1, 'vehicle',   'Rajasthan Tours & Travels','Tempo Traveller — 7 days',              4, 22000, 34000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t1, 'flights',   'IndiGo Airways',          'BOM→DEL + JAI→BOM (4 pax)',              4, 28000, 40000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t1, 'insurance', 'HDFC Ergo',               'Domestic travel insurance — 4 pax',      4,  4000,  6000, 'INR');

  -- TRIP 2 — Kerala Backwaters (2 pax, Jan)
  INSERT INTO public.trip_service_costs
    (id, organization_id, trip_id, category, vendor_name, description, pax_count, cost_amount, price_amount, currency)
  VALUES
    (gen_random_uuid(), v_org_id, v_t2, 'hotels',    'Kerala Houseboats',       'Luxury houseboat — 2 nights Alleppey',   2, 18000, 28000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t2, 'hotels',    'Tea County Resort',       'Munnar hill resort — 2 nights',          2, 12000, 20000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t2, 'vehicle',   'Kerala Driver Association','AC Innova + driver — 6 days',           2,  9000, 15000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t2, 'flights',   'Air India',               'BOM→COK + COK→BOM (2 pax)',              2, 14000, 22000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t2, 'insurance', 'Bajaj Allianz',           'Travel insurance — 2 pax',               2,  1800,  3000, 'INR');

  -- TRIP 3 — Goa Beach (6 pax, Feb)
  INSERT INTO public.trip_service_costs
    (id, organization_id, trip_id, category, vendor_name, description, pax_count, cost_amount, price_amount, currency)
  VALUES
    (gen_random_uuid(), v_org_id, v_t3, 'hotels',  'OYO Business',             'North Goa beach resort — 5 nights',      6, 42000, 64000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t3, 'vehicle', 'Goa Tours & Travels',      'Mini bus + driver — 5 days',             6, 14000, 24000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t3, 'flights', 'SpiceJet',                 'BOM→GOI + GOI→BOM (6 pax)',              6, 36000, 52000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t3, 'other',   'Watersports Goa',          'Watersports package — parasailing + jet ski', 6, 18000, 30000, 'INR');

  -- TRIP 4 — Rajasthan Royal (8 pax, Feb)
  INSERT INTO public.trip_service_costs
    (id, organization_id, trip_id, category, vendor_name, description, pax_count, cost_amount, price_amount, currency)
  VALUES
    (gen_random_uuid(), v_org_id, v_t4, 'hotels',  'Treebo Hotels',            'Jodhpur heritage hotel — 3 nights',      8, 56000, 84000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t4, 'hotels',  'Heritage Hotels India',    'Udaipur lake palace — 3 nights',         8, 72000,108000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t4, 'hotels',  'Suryagarh Jaisalmer',      'Desert camp Jaisalmer — 2 nights',       8, 64000, 96000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t4, 'vehicle', 'Rajasthan Tours & Travels','2× Innova Crysta + driver — 8 days',     8, 38000, 58000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t4, 'flights', 'Air India',                'DEL→JDH + JDH→BOM (8 pax)',              8, 64000, 92000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t4, 'other',   'Rajasthan Culturals',      'Ghoomar dance + camel safari',           8, 24000, 36000, 'INR');

  -- TRIP 5 — Himachal Adventure (3 pax, Feb)
  INSERT INTO public.trip_service_costs
    (id, organization_id, trip_id, category, vendor_name, description, pax_count, cost_amount, price_amount, currency)
  VALUES
    (gen_random_uuid(), v_org_id, v_t5, 'hotels',    'Himalayan Retreat',       'Manali snow resort — 4 nights',          3, 21000, 33000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t5, 'hotels',    'Kasol Camps',             'Camp stay Kasol — 2 nights',             3,  9000, 15000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t5, 'vehicle',   'Himachal Travels',        'Innova — 7 days Manali circuit',         3, 17000, 27000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t5, 'flights',   'IndiGo Airways',          'BOM→DEL + DEL→BOM (3 pax)',              3, 18000, 27000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t5, 'insurance', 'HDFC Ergo',               'Adventure sports insurance — 3 pax',     3,  4500,  7500, 'INR'),
    (gen_random_uuid(), v_org_id, v_t5, 'other',     'Manali Snow Activities',  'Skiing + snow scooter package',          3, 12000, 20000, 'INR');

  -- TRIP 6 — Andaman (2 pax, Mar)
  INSERT INTO public.trip_service_costs
    (id, organization_id, trip_id, category, vendor_name, description, pax_count, cost_amount, price_amount, currency)
  VALUES
    (gen_random_uuid(), v_org_id, v_t6, 'flights',   'Air India',               'BLR→IXZ + IXZ→BLR (2 pax)',             2, 22000, 34000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t6, 'hotels',    'Symphony Palms',          'Havelock beach resort — 5 nights',       2, 35000, 56000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t6, 'vehicle',   'Andaman Divers',          'Speedboat Port Blair–Havelock (return)', 2,  7000, 12000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t6, 'insurance', 'Bajaj Allianz',           'Travel + dive insurance — 2 pax',        2,  3200,  5500, 'INR'),
    (gen_random_uuid(), v_org_id, v_t6, 'other',     'Andaman Divers',          'Scuba diving package — 2 dives each',    2, 14000, 24000, 'INR');

  -- TRIP 7 — Varanasi Heritage (5 pax, Mar)
  INSERT INTO public.trip_service_costs
    (id, organization_id, trip_id, category, vendor_name, description, pax_count, cost_amount, price_amount, currency)
  VALUES
    (gen_random_uuid(), v_org_id, v_t7, 'hotels', 'Brijrama Palace',           'Ganges-view hotel Varanasi — 3 nights',  5, 37500, 57500, 'INR'),
    (gen_random_uuid(), v_org_id, v_t7, 'vehicle','Kashi Travels',             'Auto + car — 4 days local sightseeing',  5,  9000, 16000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t7, 'train',  'IRCTC Premium',             'BOM→BSB Rajdhani (5 pax, 2AC)',          5, 22500, 35000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t7, 'train',  'IRCTC Premium',             'BSB→BOM return (5 pax, 2AC)',            5, 22500, 35000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t7, 'other',  'Varanasi Culturals',        'Ganga Aarti boat + evening puja',        5,  7500, 14000, 'INR');

  -- TRIP 8 — Coorg & Mysore (4 pax, Mar)
  INSERT INTO public.trip_service_costs
    (id, organization_id, trip_id, category, vendor_name, description, pax_count, cost_amount, price_amount, currency)
  VALUES
    (gen_random_uuid(), v_org_id, v_t8, 'hotels',  'Coorg Estates',            'Coffee estate homestay — 3 nights',      4, 24000, 38000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t8, 'hotels',  'Radisson Blu Mysore',      'Mysore city hotel — 2 nights',           4, 20000, 32000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t8, 'vehicle', 'South India Cabs',         'Innova — BLR→Coorg→Mysore→BLR',         4, 16000, 26000, 'INR'),
    (gen_random_uuid(), v_org_id, v_t8, 'other',   'Mysore Tourism',           'Palace entry + elephant ride',           4,  5000,  9000, 'INR');

  -- ---------------------------------------------------------------
  -- MONTHLY OVERHEAD EXPENSES
  -- ---------------------------------------------------------------

  -- January 2026
  INSERT INTO public.monthly_overhead_expenses
    (id, organization_id, month_start, category, description, amount, currency)
  VALUES
    (gen_random_uuid(), v_org_id, '2026-01-01', 'Wages',     'Staff salaries — 3 team members',       85000, 'INR'),
    (gen_random_uuid(), v_org_id, '2026-01-01', 'Rent',      'Office rent — Andheri West',             25000, 'INR'),
    (gen_random_uuid(), v_org_id, '2026-01-01', 'CA Fees',   'CA quarterly filing & GST compliance',   12000, 'INR'),
    (gen_random_uuid(), v_org_id, '2026-01-01', 'Marketing', 'Google Ads + Instagram Promotions',      18000, 'INR'),
    (gen_random_uuid(), v_org_id, '2026-01-01', 'GST',       'GST payable January',                    14000, 'INR'),
    (gen_random_uuid(), v_org_id, '2026-01-01', 'TCS',       'TCS collected on bookings',               5500, 'INR');

  -- February 2026
  INSERT INTO public.monthly_overhead_expenses
    (id, organization_id, month_start, category, description, amount, currency)
  VALUES
    (gen_random_uuid(), v_org_id, '2026-02-01', 'Wages',       'Staff salaries — 3 team members',     85000, 'INR'),
    (gen_random_uuid(), v_org_id, '2026-02-01', 'Rent',        'Office rent — Andheri West',           25000, 'INR'),
    (gen_random_uuid(), v_org_id, '2026-02-01', 'Marketing',   'Meta Ads + travel fair stall',         26000, 'INR'),
    (gen_random_uuid(), v_org_id, '2026-02-01', 'GST',         'GST payable February',                 22000, 'INR'),
    (gen_random_uuid(), v_org_id, '2026-02-01', 'Miscellaneous','Software subscriptions',               8000, 'INR');

  -- March 2026
  INSERT INTO public.monthly_overhead_expenses
    (id, organization_id, month_start, category, description, amount, currency)
  VALUES
    (gen_random_uuid(), v_org_id, '2026-03-01', 'Wages',     'Staff salaries — 3 team members',       85000, 'INR'),
    (gen_random_uuid(), v_org_id, '2026-03-01', 'Rent',      'Office rent — Andheri West',             25000, 'INR'),
    (gen_random_uuid(), v_org_id, '2026-03-01', 'Marketing', 'Summer campaign — Google + Instagram',   22000, 'INR'),
    (gen_random_uuid(), v_org_id, '2026-03-01', 'GST',       'GST payable March',                      18000, 'INR'),
    (gen_random_uuid(), v_org_id, '2026-03-01', 'TCS',       'TCS collected on bookings',               8000, 'INR');

  RAISE NOTICE 'Pricing demo data seeded successfully for org %', v_org_id;
END $$;
