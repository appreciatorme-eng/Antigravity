import type { Database } from "@/lib/database.types";

type AdminClient = ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>;

type ProposalDayRow = Database["public"]["Tables"]["proposal_days"]["Row"];
type ProposalActivityRow = Database["public"]["Tables"]["proposal_activities"]["Row"];

type RawActivity = {
  time?: string;
  title?: string;
  description?: string;
  location?: string;
  image?: string;
  imageUrl?: string;
  cost?: string;
};

type RawDay = {
  day_number?: number;
  day?: number;
  theme?: string;
  title?: string;
  summary?: string;
  description?: string;
  activities?: RawActivity[];
  accommodation?: RawAccommodation;
};

type RawAccommodation = {
  day_number?: number;
  hotel_name?: string;
  address?: string;
  check_in_time?: string;
  contact_phone?: string;
  room_type?: string;
  star_rating?: number;
  price_per_night?: number;
  amenities?: string[];
  is_fallback?: boolean;
};

type TripRawData = {
  trip_title?: string;
  destination?: string;
  duration_days?: number;
  summary?: string;
  days?: RawDay[];
  accommodations?: RawAccommodation[];
  logistics?: {
    hotels?: Array<RawAccommodation & {
      day_number?: number;
      name?: string;
      check_in?: string;
    }>;
  };
  pricing?: {
    total_cost?: number;
  };
};

type ActiveAddOn = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  price: number | null;
};

function parseCostToNumber(cost: string | undefined): number {
  if (!cost) return 0;
  const cleaned = cost.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : num;
}

function normalizeAccommodation(raw: RawAccommodation | null | undefined, fallbackDayNumber: number): RawAccommodation | null {
  if (!raw || typeof raw !== "object") return null;

  const hotelName = String(raw.hotel_name || "").trim();
  if (!hotelName) return null;

  return {
    day_number: Number(raw.day_number || fallbackDayNumber),
    hotel_name: hotelName,
    address: typeof raw.address === "string" ? raw.address.trim() : "",
    check_in_time: typeof raw.check_in_time === "string" ? raw.check_in_time.trim() : "",
    contact_phone: typeof raw.contact_phone === "string" ? raw.contact_phone.trim() : "",
    room_type: typeof raw.room_type === "string" ? raw.room_type.trim() : "",
    star_rating: typeof raw.star_rating === "number" ? raw.star_rating : undefined,
    price_per_night: typeof raw.price_per_night === "number" ? raw.price_per_night : undefined,
    amenities: Array.isArray(raw.amenities)
      ? raw.amenities.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [],
    is_fallback: raw.is_fallback === true,
  };
}

function buildAccommodationMap(record: TripRawData) {
  const byDay = new Map<number, RawAccommodation>();

  const topLevel = Array.isArray(record.accommodations) ? record.accommodations : [];
  for (const accommodation of topLevel) {
    const normalized = normalizeAccommodation(accommodation, Number(accommodation?.day_number || 1));
    if (!normalized?.day_number) continue;
    byDay.set(normalized.day_number, normalized);
  }

  const days = Array.isArray(record.days) ? record.days : [];
  days.forEach((day, index) => {
    const fallbackDayNumber = Number(day.day_number || day.day || index + 1);
    const normalized = normalizeAccommodation(day.accommodation, fallbackDayNumber);
    if (!normalized?.day_number) return;
    byDay.set(normalized.day_number, normalized);
  });

  const hotels = Array.isArray(record.logistics?.hotels) ? record.logistics?.hotels : [];
  hotels.forEach((hotel, index) => {
    const normalized = normalizeAccommodation(
      {
        ...hotel,
        hotel_name: hotel.hotel_name || hotel.name,
        check_in_time: hotel.check_in_time || hotel.check_in,
      },
      Number(hotel.day_number || index + 1),
    );
    if (!normalized?.day_number || byDay.has(normalized.day_number)) return;
    byDay.set(normalized.day_number, normalized);
  });

  return byDay;
}

function normalizeRawData(rawData: unknown, fallbackTitle?: string, fallbackDestination?: string, fallbackDuration?: number) {
  const record = (rawData && typeof rawData === "object" ? rawData : {}) as TripRawData;
  const days = Array.isArray(record.days) ? record.days : [];
  return {
    trip_title: record.trip_title || fallbackTitle || "Untitled Trip",
    destination: record.destination || fallbackDestination || "TBD",
    duration_days: record.duration_days || fallbackDuration || Math.max(1, days.length || 1),
    summary: record.summary || "",
    days,
    accommodationsByDay: buildAccommodationMap(record),
    pricing: record.pricing,
  };
}

function normalizedDayTitle(day: RawDay, index: number) {
  return day.title || day.theme || `Day ${index + 1}`;
}

function normalizedDayDescription(day: RawDay) {
  return day.summary || day.description || null;
}

function buildActivityInsert(dayId: string, activity: RawActivity, index: number): Database["public"]["Tables"]["proposal_activities"]["Insert"] {
  return {
    proposal_day_id: dayId,
    time: activity.time || null,
    title: activity.title || `Activity ${index + 1}`,
    description: activity.description || null,
    location: activity.location || null,
    image_url: activity.image || activity.imageUrl || null,
    price: parseCostToNumber(activity.cost),
    display_order: index + 1,
    is_selected: true,
  };
}

export async function createLinkedProposalFromItinerary(params: {
  adminClient: AdminClient;
  organizationId: string;
  userId: string;
  itineraryId: string;
  clientId: string;
  tripId?: string | null;
  proposalTitle?: string;
  expirationDays?: number;
  basePrice?: number;
  selectedVehicleId?: string | null;
  selectedAddOnIds?: string[];
}) {
  const {
    adminClient,
    organizationId,
    userId,
    itineraryId,
    clientId,
    tripId = null,
    proposalTitle,
    expirationDays = 14,
    basePrice,
    selectedVehicleId = null,
    selectedAddOnIds = [],
  } = params;

  if (tripId) {
    const { data: existingProposal } = await adminClient
      .from("proposals")
      .select("id, client_selected_price")
      .eq("trip_id", tripId)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingProposal?.id) {
      return {
        proposalId: existingProposal.id,
        amount: Number(existingProposal.client_selected_price || 0),
        reused: true,
      };
    }
  }

  const { data: itinerary, error: itineraryError } = await adminClient
    .from("itineraries")
    .select("id, trip_title, destination, duration_days, raw_data")
    .eq("id", itineraryId)
    .maybeSingle();

  if (itineraryError || !itinerary) {
    throw new Error("Itinerary not found");
  }

  const normalized = normalizeRawData(
    itinerary.raw_data,
    itinerary.trip_title || undefined,
    itinerary.destination || undefined,
    itinerary.duration_days || undefined,
  );

  const { error: clientUpsertError } = await adminClient
    .from("clients")
    .upsert(
      {
        id: clientId,
        organization_id: organizationId,
        user_id: clientId,
      },
      { onConflict: "id" },
    );

  if (clientUpsertError) {
    throw new Error(clientUpsertError.message || "Failed to prepare client record");
  }

  const resolvedBasePrice = Number(basePrice ?? normalized.pricing?.total_cost ?? 0);

  const { data: template, error: templateError } = await adminClient
    .from("tour_templates")
    .insert({
      name: normalized.trip_title,
      destination: normalized.destination || null,
      duration_days: normalized.duration_days || null,
      base_price: resolvedBasePrice,
      organization_id: organizationId,
      created_by: userId,
      status: "active",
    })
    .select("id")
    .single();

  if (templateError || !template) {
    throw new Error(templateError?.message || "Failed to create template from itinerary");
  }

  for (let index = 0; index < normalized.days.length; index += 1) {
    const day = normalized.days[index];
    const { data: templateDay, error: dayError } = await adminClient
      .from("template_days")
      .insert({
        template_id: template.id,
        day_number: index + 1,
        title: normalizedDayTitle(day, index),
        description: normalizedDayDescription(day),
      })
      .select("id")
      .single();

    if (dayError || !templateDay) continue;

    const accommodation = normalized.accommodationsByDay.get(index + 1);
    if (accommodation?.hotel_name) {
      await adminClient.from("template_accommodations").insert({
        template_day_id: templateDay.id,
        hotel_name: accommodation.hotel_name,
        star_rating: accommodation.star_rating ?? null,
        room_type: accommodation.room_type || accommodation.address || null,
        price_per_night: Number(accommodation.price_per_night || 0),
        amenities: accommodation.amenities || [],
        image_url: null,
      });
    }

    const activities = Array.isArray(day.activities) ? day.activities : [];
    if (activities.length === 0) continue;

    await adminClient.from("template_activities").insert(
      activities.map((activity, activityIndex) => ({
        template_day_id: templateDay.id,
        time: activity.time || null,
        title: activity.title || `Activity ${activityIndex + 1}`,
        description: activity.description || null,
        location: activity.location || null,
        image_url: activity.image || activity.imageUrl || null,
        price: parseCostToNumber(activity.cost),
        display_order: activityIndex + 1,
      })),
    );
  }

  const { data: proposalId, error: cloneError } = await adminClient.rpc("clone_template_to_proposal", {
    p_template_id: template.id,
    p_client_id: clientId,
    p_created_by: userId,
  });

  if (cloneError || !proposalId) {
    throw new Error(cloneError?.message || "Failed to create proposal");
  }

  const { data: activeAddOns, error: activeAddOnsError } = await adminClient
    .from("add_ons")
    .select("id, name, description, category, image_url, price")
    .eq("organization_id", organizationId)
    .eq("is_active", true);

  if (activeAddOnsError) {
    throw new Error(activeAddOnsError.message || "Failed to load add-ons");
  }

  const addOns = ((activeAddOns || []) as ActiveAddOn[]);
  const transportAddOns = addOns.filter((addOn) => addOn.category === "Transport");
  const defaultVehicleId = selectedVehicleId || transportAddOns[0]?.id || null;
  const selectedIds = new Set<string>(selectedAddOnIds);
  if (defaultVehicleId) {
    selectedIds.add(defaultVehicleId);
  }

  const addOnRows: Array<{ addOn: ActiveAddOn; selected: boolean }> = [];
  for (const vehicle of transportAddOns) {
    addOnRows.push({ addOn: vehicle, selected: vehicle.id === defaultVehicleId });
  }
  for (const addOn of addOns) {
    if (addOn.category === "Transport" || !selectedIds.has(addOn.id)) continue;
    addOnRows.push({ addOn, selected: true });
  }

  if (addOnRows.length > 0) {
    const payload: Database["public"]["Tables"]["proposal_add_ons"]["Insert"][] = addOnRows.map(({ addOn, selected }) => ({
      proposal_id: proposalId,
      add_on_id: addOn.id,
      name: addOn.name,
      description: addOn.description || null,
      category: addOn.category || "General",
      image_url: addOn.image_url || null,
      unit_price: Number(addOn.price || 0),
      quantity: 1,
      is_selected: selected,
    }));
    await adminClient.from("proposal_add_ons").insert(payload);
  }

  const { data: newPrice, error: newPriceError } = await adminClient.rpc("calculate_proposal_price", {
    p_proposal_id: proposalId,
  });
  if (newPriceError) {
    throw new Error(newPriceError.message || "Failed to calculate proposal price");
  }

  const proposalUpdates: Record<string, unknown> = {
    client_selected_price: newPrice,
  };

  if (proposalTitle || normalized.trip_title) {
    proposalUpdates.title = proposalTitle || normalized.trip_title;
  }
  if (expirationDays > 0) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expirationDays);
    proposalUpdates.expires_at = expirationDate.toISOString();
  }
  if (tripId) {
    proposalUpdates.trip_id = tripId;
  }

  const { error: updateError } = await adminClient
    .from("proposals")
    .update(proposalUpdates)
    .eq("id", proposalId);

  if (updateError) {
    throw new Error(updateError.message || "Failed to update proposal details");
  }

  return {
    proposalId,
    amount: Number(newPrice || 0),
    reused: false,
  };
}

export async function syncTripToLinkedProposal(params: {
  adminClient: AdminClient;
  tripId: string;
  rawData: unknown;
}) {
  const { adminClient, tripId, rawData } = params;

  const { data: linkedProposal } = await adminClient
    .from("proposals")
    .select("id")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!linkedProposal?.id) {
    return { proposalId: null, synced: false };
  }

  const normalized = normalizeRawData(rawData);

  await adminClient
    .from("proposals")
    .update({ title: normalized.trip_title })
    .eq("id", linkedProposal.id);

  const { count: commentCount } = await adminClient
    .from("proposal_comments")
    .select("id", { count: "exact", head: true })
    .eq("proposal_id", linkedProposal.id);

  const destructiveReplace = (commentCount || 0) === 0;

  if (destructiveReplace) {
    const { data: existingDays } = await adminClient
      .from("proposal_days")
      .select("id")
      .eq("proposal_id", linkedProposal.id);

    const existingDayIds = (existingDays || []).map((day) => day.id);
    if (existingDayIds.length > 0) {
      await adminClient.from("proposal_activities").delete().in("proposal_day_id", existingDayIds);
    }
    await adminClient.from("proposal_days").delete().eq("proposal_id", linkedProposal.id);

    for (let index = 0; index < normalized.days.length; index += 1) {
      const day = normalized.days[index];
      const { data: insertedDay } = await adminClient
        .from("proposal_days")
        .insert({
          proposal_id: linkedProposal.id,
          day_number: index + 1,
          title: normalizedDayTitle(day, index),
          description: normalizedDayDescription(day),
        })
        .select("id")
        .single();

      if (!insertedDay) continue;

      const activities = Array.isArray(day.activities) ? day.activities : [];
      if (activities.length === 0) continue;

      await adminClient
        .from("proposal_activities")
        .insert(activities.map((activity, activityIndex) => buildActivityInsert(insertedDay.id, activity, activityIndex)));
    }

    return { proposalId: linkedProposal.id, synced: true };
  }

  const { data: existingDaysData } = await adminClient
    .from("proposal_days")
    .select("id, proposal_id, day_number, title, description, is_approved")
    .eq("proposal_id", linkedProposal.id)
    .order("day_number", { ascending: true });

  const existingDays = (existingDaysData || []) as ProposalDayRow[];

  for (let index = 0; index < normalized.days.length; index += 1) {
    const day = normalized.days[index];
    const existingDay = existingDays[index];

    let dayId = existingDay?.id || null;
    if (dayId) {
      await adminClient
        .from("proposal_days")
        .update({
          day_number: index + 1,
          title: normalizedDayTitle(day, index),
          description: normalizedDayDescription(day),
        })
        .eq("id", dayId);
    } else {
      const { data: insertedDay } = await adminClient
        .from("proposal_days")
        .insert({
          proposal_id: linkedProposal.id,
          day_number: index + 1,
          title: normalizedDayTitle(day, index),
          description: normalizedDayDescription(day),
        })
        .select("id")
        .single();
      dayId = insertedDay?.id || null;
    }

    if (!dayId) continue;

    const { data: existingActivitiesData } = await adminClient
      .from("proposal_activities")
      .select("id, proposal_day_id, time, title, description, location, image_url, price, is_optional, is_premium, is_selected, display_order")
      .eq("proposal_day_id", dayId)
      .order("display_order", { ascending: true });

    const existingActivities = (existingActivitiesData || []) as ProposalActivityRow[];
    const activities = Array.isArray(day.activities) ? day.activities : [];

    for (let activityIndex = 0; activityIndex < activities.length; activityIndex += 1) {
      const activity = activities[activityIndex];
      const existingActivity = existingActivities[activityIndex];
      const updatePayload = {
        time: activity.time || null,
        title: activity.title || `Activity ${activityIndex + 1}`,
        description: activity.description || null,
        location: activity.location || null,
        image_url: activity.image || activity.imageUrl || null,
        price: parseCostToNumber(activity.cost),
        display_order: activityIndex + 1,
        is_selected: true,
      };

      if (existingActivity?.id) {
        await adminClient
          .from("proposal_activities")
          .update(updatePayload)
          .eq("id", existingActivity.id);
      } else {
        await adminClient
          .from("proposal_activities")
          .insert(buildActivityInsert(dayId, activity, activityIndex));
      }
    }
  }

  return { proposalId: linkedProposal.id, synced: true };
}

export async function syncLinkedProposalToTrip(params: {
  adminClient: AdminClient;
  proposalId: string;
}) {
  const { adminClient, proposalId } = params;

  const { data: proposal } = await adminClient
    .from("proposals")
    .select("id, trip_id, title")
    .eq("id", proposalId)
    .maybeSingle();

  if (!proposal?.trip_id) {
    return { tripId: null, synced: false };
  }

  const { data: trip } = await adminClient
    .from("trips")
    .select("id, itinerary_id, status, itineraries(id, trip_title, duration_days, destination, raw_data)")
    .eq("id", proposal.trip_id)
    .maybeSingle();

  const itinerary = Array.isArray(trip?.itineraries) ? trip?.itineraries[0] : trip?.itineraries;
  if (!trip?.itinerary_id || !itinerary) {
    return { tripId: proposal.trip_id, synced: false };
  }

  const { data: proposalDaysData } = await adminClient
    .from("proposal_days")
    .select("id, proposal_id, day_number, title, description, is_approved")
    .eq("proposal_id", proposalId)
    .order("day_number", { ascending: true });

  const proposalDays = (proposalDaysData || []) as ProposalDayRow[];
  const dayIds = proposalDays.map((day) => day.id);

  const { data: proposalActivitiesData } = dayIds.length > 0
    ? await adminClient
        .from("proposal_activities")
        .select("id, proposal_day_id, time, title, description, location, image_url, price, is_optional, is_premium, is_selected, display_order")
        .in("proposal_day_id", dayIds)
        .order("display_order", { ascending: true })
    : { data: [] as ProposalActivityRow[] };

  const proposalActivities = (proposalActivitiesData || []) as ProposalActivityRow[];
  const activitiesByDay = new Map<string, ProposalActivityRow[]>();
  for (const activity of proposalActivities) {
    const list = activitiesByDay.get(activity.proposal_day_id) || [];
    list.push(activity);
    activitiesByDay.set(activity.proposal_day_id, list);
  }

  const days = proposalDays.map((day) => ({
    day_number: day.day_number,
    day: day.day_number,
    theme: day.title || `Day ${day.day_number}`,
    title: day.title || `Day ${day.day_number}`,
    summary: day.description || "",
    activities: (activitiesByDay.get(day.id) || [])
      .filter((activity) => activity.is_selected !== false)
      .map((activity) => ({
        time: activity.time || "TBD",
        title: activity.title,
        description: activity.description || "",
        location: activity.location || "",
        image: activity.image_url || undefined,
        cost: activity.price ? String(activity.price) : undefined,
      })),
  }));

  const existing = normalizeRawData(
    itinerary.raw_data,
    itinerary.trip_title || undefined,
    itinerary.destination || undefined,
    itinerary.duration_days || undefined,
  );

  const nextRawData = {
    ...(itinerary.raw_data && typeof itinerary.raw_data === "object" ? itinerary.raw_data : {}),
    ...existing,
    trip_title: proposal.title || existing.trip_title,
    duration_days: Math.max(1, days.length || existing.duration_days || 1),
    days,
  };

  await adminClient
    .from("itineraries")
    .update({
      trip_title: proposal.title || existing.trip_title,
      duration_days: Math.max(1, days.length || existing.duration_days || 1),
      raw_data: nextRawData as unknown as Database["public"]["Tables"]["itineraries"]["Update"]["raw_data"],
    })
    .eq("id", trip.itinerary_id);

  return { tripId: proposal.trip_id, synced: true };
}
