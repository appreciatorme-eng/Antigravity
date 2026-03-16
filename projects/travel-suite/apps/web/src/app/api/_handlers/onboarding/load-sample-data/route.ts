import { NextResponse } from 'next/server';
import { apiError } from "@/lib/api/response";
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { safeErrorMessage } from '@/lib/security/safe-error';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { randomUUID } from 'crypto';

const supabaseAdmin = createAdminClient();

async function getAuthenticatedUser() {
  const serverClient = await createServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  return { user };
}

async function getUserProfile(userId: string) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, organization_id, role')
    .eq('id', userId)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error('Profile not found');
  }

  return profile;
}

async function checkSampleDataExists(organizationId: string): Promise<boolean> {
  const { data: existingTrips, error } = await supabaseAdmin
    .from('trips')
    .select('id')
    .eq('organization_id', organizationId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error('Failed to check existing data');
  }

  return Boolean(existingTrips);
}

async function loadSampleData(organizationId: string) {
  // Trip IDs
  const tripIds = Array.from({ length: 10 }, () => randomUUID());
  const [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10] = tripIds;

  // External Drivers (no auth.users FK — headless)
  const { error: driversError } = await supabaseAdmin.from('external_drivers').insert([
    {
      id: randomUUID(),
      organization_id: organizationId,
      full_name: 'Raju Singh',
      phone: '+919800000001',
      vehicle_type: 'suv',
      vehicle_plate: 'MH-02-AB-1234',
      is_active: true,
      vehicle_capacity: 7,
      languages: ['Hindi', 'English'],
      notes: '',
      created_at: '2025-12-10T00:00:00Z',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      full_name: 'Suresh Kumar',
      phone: '+919800000002',
      vehicle_type: 'minibus',
      vehicle_plate: 'MH-04-CD-5678',
      is_active: true,
      vehicle_capacity: 12,
      languages: ['Hindi'],
      notes: '',
      created_at: '2025-12-10T00:00:00Z',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      full_name: 'Mohan Yadav',
      phone: '+919800000003',
      vehicle_type: 'suv',
      vehicle_plate: 'MH-01-EF-9012',
      is_active: true,
      vehicle_capacity: 7,
      languages: ['Hindi', 'Marathi'],
      notes: '',
      created_at: '2025-12-10T00:00:00Z',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      full_name: 'Kiran Patil',
      phone: '+919800000004',
      vehicle_type: 'sedan',
      vehicle_plate: 'MH-03-GH-3456',
      is_active: true,
      vehicle_capacity: 5,
      languages: ['Hindi', 'Kannada'],
      notes: '',
      created_at: '2025-12-10T00:00:00Z',
    },
  ]);

  if (driversError) {
    throw new Error(`Failed to insert drivers: ${driversError.message}`);
  }

  // Trips (no client_id / itinerary_id — both have auth FK)
  const { error: tripsError } = await supabaseAdmin.from('trips').insert([
    {
      id: t1,
      organization_id: organizationId,
      name: 'Golden Triangle Classic',
      destination: 'Delhi, Agra, Jaipur',
      start_date: '2026-01-05',
      end_date: '2026-01-12',
      status: 'in_progress',
      pax_count: 4,
      created_at: '2025-12-20T00:00:00Z',
    },
    {
      id: t2,
      organization_id: organizationId,
      name: 'Kerala Backwaters Escape',
      destination: 'Kochi, Alleppey, Munnar',
      start_date: '2026-01-18',
      end_date: '2026-01-24',
      status: 'in_progress',
      pax_count: 2,
      created_at: '2025-12-22T00:00:00Z',
    },
    {
      id: t3,
      organization_id: organizationId,
      name: 'Goa Beach Holiday',
      destination: 'North Goa, South Goa',
      start_date: '2026-02-01',
      end_date: '2026-02-06',
      status: 'in_progress',
      pax_count: 6,
      created_at: '2025-12-25T00:00:00Z',
    },
    {
      id: t4,
      organization_id: organizationId,
      name: 'Rajasthan Royal Tour',
      destination: 'Jodhpur, Udaipur, Jaisalmer',
      start_date: '2026-02-10',
      end_date: '2026-02-18',
      status: 'in_progress',
      pax_count: 8,
      created_at: '2025-12-28T00:00:00Z',
    },
    {
      id: t5,
      organization_id: organizationId,
      name: 'Himachal Adventure',
      destination: 'Manali, Kasol, Kufri',
      start_date: '2026-02-20',
      end_date: '2026-02-27',
      status: 'in_progress',
      pax_count: 3,
      created_at: '2026-01-02T00:00:00Z',
    },
    {
      id: t6,
      organization_id: organizationId,
      name: 'Andaman Island Break',
      destination: 'Port Blair, Havelock Island',
      start_date: '2026-03-01',
      end_date: '2026-03-07',
      status: 'in_progress',
      pax_count: 2,
      created_at: '2026-01-10T00:00:00Z',
    },
    {
      id: t7,
      organization_id: organizationId,
      name: 'Varanasi Heritage Journey',
      destination: 'Varanasi, Sarnath',
      start_date: '2026-03-12',
      end_date: '2026-03-16',
      status: 'pending',
      pax_count: 5,
      created_at: '2026-01-15T00:00:00Z',
    },
    {
      id: t8,
      organization_id: organizationId,
      name: 'Coorg & Mysore Retreat',
      destination: 'Coorg, Mysore',
      start_date: '2026-03-18',
      end_date: '2026-03-23',
      status: 'pending',
      pax_count: 4,
      created_at: '2026-01-20T00:00:00Z',
    },
    {
      id: t9,
      organization_id: organizationId,
      name: 'Leh Ladakh Bike Expedition',
      destination: 'Leh, Nubra Valley, Pangong',
      start_date: '2026-04-05',
      end_date: '2026-04-14',
      status: 'pending',
      pax_count: 6,
      created_at: '2026-02-01T00:00:00Z',
    },
    {
      id: t10,
      organization_id: organizationId,
      name: 'Kashmir Houseboat Experience',
      destination: 'Srinagar, Gulmarg, Pahalgam',
      start_date: '2026-04-10',
      end_date: '2026-04-17',
      status: 'pending',
      pax_count: 4,
      created_at: '2026-02-10T00:00:00Z',
    },
  ]);

  if (tripsError) {
    throw new Error(`Failed to insert trips: ${tripsError.message}`);
  }

  // Trip Service Costs
  const { error: costsError } = await supabaseAdmin.from('trip_service_costs').insert([
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t1,
      category: 'hotels',
      vendor_name: 'Taj Hotels',
      description: 'Taj Mahal Hotel Delhi — 3N',
      pax_count: 4,
      cost_amount: 42000,
      price_amount: 60000,
      commission_pct: 10,
      commission_amount: 4200,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t1,
      category: 'hotels',
      vendor_name: 'IHCL SeleQtions',
      description: 'Agra hotel — 2N',
      pax_count: 4,
      cost_amount: 28000,
      price_amount: 42000,
      commission_pct: 10,
      commission_amount: 2800,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t1,
      category: 'vehicle',
      vendor_name: 'Rajasthan Tours & Travels',
      description: 'Tempo Traveller 7 days',
      pax_count: 4,
      cost_amount: 22000,
      price_amount: 34000,
      commission_pct: 15,
      commission_amount: 3300,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t1,
      category: 'flights',
      vendor_name: 'IndiGo Airways',
      description: 'BOM-DEL + JAI-BOM (4 pax)',
      pax_count: 4,
      cost_amount: 28000,
      price_amount: 40000,
      commission_pct: 3,
      commission_amount: 840,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t2,
      category: 'hotels',
      vendor_name: 'Treebo Hotels',
      description: 'Kochi boutique 2N',
      pax_count: 2,
      cost_amount: 12000,
      price_amount: 18000,
      commission_pct: 10,
      commission_amount: 1200,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t2,
      category: 'hotels',
      vendor_name: 'Lake Palace Resort',
      description: 'Alleppey houseboat 1N',
      pax_count: 2,
      cost_amount: 15000,
      price_amount: 24000,
      commission_pct: 10,
      commission_amount: 1500,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t2,
      category: 'vehicle',
      vendor_name: 'Kerala Driver Association',
      description: 'Sedan 6 days',
      pax_count: 2,
      cost_amount: 9000,
      price_amount: 14000,
      commission_pct: 15,
      commission_amount: 1350,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t2,
      category: 'flights',
      vendor_name: 'Air India',
      description: 'BOM-COK + COK-BOM (2 pax)',
      pax_count: 2,
      cost_amount: 14000,
      price_amount: 20000,
      commission_pct: 3,
      commission_amount: 420,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t3,
      category: 'hotels',
      vendor_name: 'Taj Exotica Goa',
      description: 'South Goa luxury 2N',
      pax_count: 6,
      cost_amount: 48000,
      price_amount: 72000,
      commission_pct: 10,
      commission_amount: 4800,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t3,
      category: 'vehicle',
      vendor_name: 'Cab India',
      description: 'Multi-vehicle fleet 5 days',
      pax_count: 6,
      cost_amount: 15000,
      price_amount: 24000,
      commission_pct: 15,
      commission_amount: 2250,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t3,
      category: 'flights',
      vendor_name: 'SpiceJet',
      description: 'BOM-GOI + GOI-BOM (6 pax)',
      pax_count: 6,
      cost_amount: 36000,
      price_amount: 54000,
      commission_pct: 3,
      commission_amount: 1080,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t4,
      category: 'hotels',
      vendor_name: 'Taj Hotels',
      description: 'Umaid Bhawan Jodhpur 3N',
      pax_count: 8,
      cost_amount: 96000,
      price_amount: 144000,
      commission_pct: 10,
      commission_amount: 9600,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t4,
      category: 'hotels',
      vendor_name: 'Taj Lake Palace Udaipur',
      description: 'Taj Lake Palace 3N',
      pax_count: 8,
      cost_amount: 120000,
      price_amount: 180000,
      commission_pct: 10,
      commission_amount: 12000,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t4,
      category: 'vehicle',
      vendor_name: 'Rajasthan Tours & Travels',
      description: 'Luxury bus 8 days',
      pax_count: 8,
      cost_amount: 48000,
      price_amount: 72000,
      commission_pct: 15,
      commission_amount: 7200,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t4,
      category: 'flights',
      vendor_name: 'IndiGo Airways',
      description: 'BOM-JDH + JAI-BOM (8 pax)',
      pax_count: 8,
      cost_amount: 64000,
      price_amount: 96000,
      commission_pct: 3,
      commission_amount: 1920,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t5,
      category: 'hotels',
      vendor_name: 'Snow Valley Resorts',
      description: 'Manali resort 4N',
      pax_count: 3,
      cost_amount: 18000,
      price_amount: 28000,
      commission_pct: 10,
      commission_amount: 1800,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t5,
      category: 'vehicle',
      vendor_name: 'Himachal Cabs',
      description: 'SUV Innova Crysta 7 days',
      pax_count: 3,
      cost_amount: 14000,
      price_amount: 22000,
      commission_pct: 15,
      commission_amount: 2100,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t6,
      category: 'hotels',
      vendor_name: 'Havelock Beach Resort',
      description: 'Port Blair 2N + Havelock 3N',
      pax_count: 2,
      cost_amount: 22000,
      price_amount: 35000,
      commission_pct: 10,
      commission_amount: 2200,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t6,
      category: 'flights',
      vendor_name: 'IndiGo Airways',
      description: 'MAA-IXZ + IXZ-MAA (2 pax)',
      pax_count: 2,
      cost_amount: 18000,
      price_amount: 26000,
      commission_pct: 3,
      commission_amount: 540,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t7,
      category: 'hotels',
      vendor_name: 'BrijRama Palace',
      description: 'Heritage haveli on the Ghats 3N',
      pax_count: 5,
      cost_amount: 35000,
      price_amount: 55000,
      commission_pct: 10,
      commission_amount: 3500,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t7,
      category: 'train',
      vendor_name: 'Rajdhani Express',
      description: 'DEL-BSB + BSB-DEL (5 pax)',
      pax_count: 5,
      cost_amount: 9000,
      price_amount: 14000,
      commission_pct: 0,
      commission_amount: 0,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t8,
      category: 'hotels',
      vendor_name: 'Evolve Back Coorg',
      description: 'Coffee estate resort 3N',
      pax_count: 4,
      cost_amount: 36000,
      price_amount: 54000,
      commission_pct: 10,
      commission_amount: 3600,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t8,
      category: 'flights',
      vendor_name: 'Air India',
      description: 'BOM-MYQ + MYQ-BOM (4 pax)',
      pax_count: 4,
      cost_amount: 20000,
      price_amount: 30000,
      commission_pct: 3,
      commission_amount: 600,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t9,
      category: 'hotels',
      vendor_name: 'Grand Dragon Ladakh',
      description: 'Leh hotel 3N + Nubra camp 2N',
      pax_count: 6,
      cost_amount: 36000,
      price_amount: 54000,
      commission_pct: 10,
      commission_amount: 3600,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t9,
      category: 'flights',
      vendor_name: 'IndiGo Airways',
      description: 'DEL-IXL + IXL-DEL (6 pax)',
      pax_count: 6,
      cost_amount: 42000,
      price_amount: 60000,
      commission_pct: 3,
      commission_amount: 1260,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t9,
      category: 'vehicle',
      vendor_name: 'Ladakh Riders',
      description: 'Royal Enfield fleet 9 days',
      pax_count: 6,
      cost_amount: 54000,
      price_amount: 78000,
      commission_pct: 15,
      commission_amount: 8100,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t10,
      category: 'hotels',
      vendor_name: 'Butt Houseboat Group',
      description: 'Dal Lake houseboat 4N',
      pax_count: 4,
      cost_amount: 28000,
      price_amount: 44000,
      commission_pct: 10,
      commission_amount: 2800,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      trip_id: t10,
      category: 'flights',
      vendor_name: 'Air India',
      description: 'DEL-SXR + SXR-DEL (4 pax)',
      pax_count: 4,
      cost_amount: 24000,
      price_amount: 36000,
      commission_pct: 3,
      commission_amount: 720,
      currency: 'INR',
    },
  ]);

  if (costsError) {
    throw new Error(`Failed to insert trip service costs: ${costsError.message}`);
  }

  // Monthly Overhead Expenses
  const { error: overheadError } = await supabaseAdmin.from('monthly_overhead_expenses').insert([
    {
      id: randomUUID(),
      organization_id: organizationId,
      month_start: '2026-01-01',
      category: 'wages',
      description: 'Staff salaries (3 employees)',
      amount: 120000,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      month_start: '2026-01-01',
      category: 'rent',
      description: 'Office rent — Andheri West',
      amount: 35000,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      month_start: '2026-01-01',
      category: 'marketing',
      description: 'Google Ads + social media',
      amount: 18000,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      month_start: '2026-01-01',
      category: 'other',
      description: 'Internet + software subs',
      amount: 8000,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      month_start: '2026-02-01',
      category: 'wages',
      description: 'Staff salaries (3 employees)',
      amount: 120000,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      month_start: '2026-02-01',
      category: 'rent',
      description: 'Office rent — Andheri West',
      amount: 35000,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      month_start: '2026-02-01',
      category: 'marketing',
      description: 'Google Ads + Instagram boost',
      amount: 22000,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      month_start: '2026-02-01',
      category: 'other',
      description: 'Internet + SaaS tools',
      amount: 8500,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      month_start: '2026-03-01',
      category: 'wages',
      description: 'Staff salaries (3 employees)',
      amount: 125000,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      month_start: '2026-03-01',
      category: 'rent',
      description: 'Office rent — Andheri West',
      amount: 35000,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      month_start: '2026-03-01',
      category: 'marketing',
      description: 'Peak season campaign boost',
      amount: 28000,
      currency: 'INR',
    },
    {
      id: randomUUID(),
      organization_id: organizationId,
      month_start: '2026-03-01',
      category: 'other',
      description: 'Internet + new CRM sub',
      amount: 10000,
      currency: 'INR',
    },
  ]);

  if (overheadError) {
    throw new Error(`Failed to insert overhead expenses: ${overheadError.message}`);
  }
}

export async function POST() {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    if (!user) {
      return apiError('Unauthorized', 401);
    }

    const rateLimitResult = await enforceRateLimit({
      identifier: user.id,
      limit: 10,
      windowMs: 60 * 1000,
      prefix: 'onboarding:load-sample-data',
    });

    if (!rateLimitResult.success) {
      return apiError('Too many requests', 429);
    }

    const profile = await getUserProfile(user.id);

    if (!profile.organization_id) {
      return apiError('No organization found. Please complete onboarding first.', 400);
    }

    const hasExistingData = await checkSampleDataExists(profile.organization_id);

    if (hasExistingData) {
      return apiError('Sample data already exists for this organization', 409);
    }

    await loadSampleData(profile.organization_id);

    return NextResponse.json({
      success: true,
      message: 'Sample data loaded successfully',
      data: {
        trips_created: 10,
        drivers_created: 4,
        trip_costs_created: 28,
        overhead_expenses_created: 12,
      },
    });
  } catch (error) {
    const safe = safeErrorMessage(error);
    return apiError(safe, 500);
  }
}
