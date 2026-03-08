import { apiError, apiSuccess } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentLinkByToken } from "@/lib/payments/payment-links.server";
import { enforcePublicRouteRateLimit } from "@/lib/security/public-rate-limit";

const SHARE_TOKEN_REGEX = /^[A-Za-z0-9_-]{8,200}$/;
const PUBLIC_PORTAL_READ_RATE_LIMIT_MAX = Number(
  process.env.PUBLIC_PORTAL_READ_RATE_LIMIT_MAX || "30"
);
const PUBLIC_PORTAL_READ_RATE_LIMIT_WINDOW_MS = Number(
  process.env.PUBLIC_PORTAL_READ_RATE_LIMIT_WINDOW_MS || 60_000
);

function normalizeText(value: unknown) {
  const text = String(value || "").trim();
  return text.length > 0 ? text : null;
}

function normalizeNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function formatDayDate(dateIso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(new Date(dateIso));
}

function addDays(dateIso: string, offset: number) {
  const date = new Date(dateIso);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    if (!SHARE_TOKEN_REGEX.test(token)) {
      return apiError("Invalid portal token", 400);
    }

    const rateLimitResponse = await enforcePublicRouteRateLimit(request, {
      identifier: token,
      limit: PUBLIC_PORTAL_READ_RATE_LIMIT_MAX,
      windowMs: PUBLIC_PORTAL_READ_RATE_LIMIT_WINDOW_MS,
      prefix: "public:portal:read",
      message: "Too many requests. Please try again later.",
    });
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const admin = createAdminClient();
    const { data: proposal, error: proposalError } = await admin
      .from("proposals")
      .select(
        `
        id,
        title,
        client_id,
        created_by,
        organization_id,
        total_price,
        client_selected_price,
        status,
        approved_at,
        expires_at,
        share_token,
        tour_templates(name, destination, duration_days, description, hero_image_url)
      `,
      )
      .eq("share_token", token)
      .maybeSingle();

    if (proposalError) {
      console.error("[portal/:token] failed to load proposal:", proposalError);
      return apiError("Failed to load trip portal", 500);
    }

    if (!proposal) {
      return apiError("Portal not found", 404);
    }

    if (proposal.expires_at && new Date(proposal.expires_at) < new Date()) {
      return apiError("Portal link has expired", 410);
    }

    const template =
      Array.isArray(proposal.tour_templates) && proposal.tour_templates.length > 0
        ? proposal.tour_templates[0]
        : proposal.tour_templates;

    const [clientProfileResult, operatorProfileResult, organizationResult, tripResult, daysResult, paymentLinksResult] =
      await Promise.all([
        admin
          .from("profiles")
          .select("id, full_name, phone, phone_whatsapp, travelers_count")
          .eq("id", proposal.client_id)
          .maybeSingle(),
        proposal.created_by
          ? admin
              .from("profiles")
              .select("id, full_name, phone, phone_whatsapp")
              .eq("id", proposal.created_by)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        admin
          .from("organizations")
          .select("id, name, owner_id")
          .eq("id", proposal.organization_id)
          .maybeSingle(),
        admin
          .from("trips")
          .select("id, name, destination, start_date, end_date, status, driver_id")
          .eq("organization_id", proposal.organization_id)
          .eq("client_id", proposal.client_id)
          .order("start_date", { ascending: false, nullsFirst: false })
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        admin
          .from("proposal_days")
          .select("id, day_number, title, description")
          .eq("proposal_id", proposal.id)
          .order("day_number", { ascending: true }),
        admin
          .from("payment_links")
          .select("token, amount_paise, status, paid_at, created_at")
          .eq("proposal_id", proposal.id)
          .order("created_at", { ascending: false }),
      ]);

    if (clientProfileResult.error) {
      console.error("[portal/:token] failed to load client profile:", clientProfileResult.error);
      return apiError("Failed to load trip portal", 500);
    }

    if (organizationResult.error) {
      console.error("[portal/:token] failed to load organization:", organizationResult.error);
      return apiError("Failed to load trip portal", 500);
    }

    if (tripResult.error) {
      console.error("[portal/:token] failed to load trip:", tripResult.error);
      return apiError("Failed to load trip portal", 500);
    }

    if (daysResult.error) {
      console.error("[portal/:token] failed to load itinerary days:", daysResult.error);
      return apiError("Failed to load trip portal", 500);
    }

    if (paymentLinksResult.error) {
      console.error("[portal/:token] failed to load payment links:", paymentLinksResult.error);
      return apiError("Failed to load trip portal", 500);
    }

    const trip = tripResult.data;
    const tripStartDate = normalizeText(trip?.start_date);
    const tripEndDate = normalizeText(trip?.end_date);

    const dayIds = (daysResult.data || []).map((day) => day.id);
    const activities =
      dayIds.length > 0
        ? await admin
            .from("proposal_activities")
            .select("proposal_day_id, time, title, description, location")
            .in("proposal_day_id", dayIds)
            .order("display_order", { ascending: true })
        : { data: [], error: null };

    if (activities.error) {
      console.error("[portal/:token] failed to load activities:", activities.error);
      return apiError("Failed to load trip portal", 500);
    }

    const accommodations =
      dayIds.length > 0
        ? await admin
            .from("proposal_accommodations")
            .select("proposal_day_id, hotel_name, room_type")
            .in("proposal_day_id", dayIds)
        : { data: [], error: null };

    if (accommodations.error) {
      console.error("[portal/:token] failed to load accommodations:", accommodations.error);
      return apiError("Failed to load trip portal", 500);
    }

    const activityMap = new Map<string, Array<{ time: string; name: string; location: string; notes?: string }>>();
    for (const activity of activities.data || []) {
      const entries = activityMap.get(activity.proposal_day_id) || [];
      entries.push({
        time: normalizeText(activity.time) || "Planned",
        name: activity.title,
        location: normalizeText(activity.location) || "Location to be confirmed",
        ...(normalizeText(activity.description) ? { notes: normalizeText(activity.description) || undefined } : {}),
      });
      activityMap.set(activity.proposal_day_id, entries);
    }

    const accommodationMap = new Map<string, { hotelName: string; checkIn: string; address: string; phone: string }>();
    for (const accommodation of accommodations.data || []) {
      if (accommodationMap.has(accommodation.proposal_day_id)) continue;

      accommodationMap.set(accommodation.proposal_day_id, {
        hotelName: accommodation.hotel_name,
        checkIn: accommodation.room_type || "Check-in details shared by the operator",
        address: trip?.destination || normalizeText(template?.destination) || "Destination to be confirmed",
        phone: normalizeText(clientProfileResult.data?.phone_whatsapp) || normalizeText(clientProfileResult.data?.phone) || "",
      });
    }

    const itinerary = (daysResult.data || []).map((day) => {
      const fallbackDateIso = tripStartDate
        ? addDays(tripStartDate, Math.max(day.day_number - 1, 0))
        : `day-${day.day_number}`;
      const activityItems = activityMap.get(day.id) || [];
      const locationLabel =
        activityItems[0]?.location ||
        normalizeText(day.title) ||
        normalizeText(template?.destination) ||
        "Travel day";

      return {
        dayNumber: day.day_number,
        date: tripStartDate ? formatDayDate(fallbackDateIso) : `Day ${day.day_number}`,
        dateISO: fallbackDateIso,
        location: locationLabel,
        activities: activityItems,
        accommodation: accommodationMap.get(day.id),
      };
    });

    let driver: {
      name: string;
      phone: string | null;
      phoneDisplay: string | null;
      vehicle: string | null;
      plate: string | null;
    } | null = null;

    if (trip?.driver_id) {
      const { data: driverProfile } = await admin
        .from("profiles")
        .select("full_name, phone, phone_whatsapp, driver_info")
        .eq("id", trip.driver_id)
        .maybeSingle();

      if (driverProfile) {
        const rawPhone =
          normalizeText(driverProfile.phone_whatsapp) || normalizeText(driverProfile.phone);
        const driverInfo =
          typeof driverProfile.driver_info === "object" &&
          driverProfile.driver_info !== null &&
          !Array.isArray(driverProfile.driver_info)
            ? (driverProfile.driver_info as Record<string, unknown>)
            : null;

        driver = {
          name: driverProfile.full_name || "Assigned driver",
          phone: rawPhone,
          phoneDisplay: rawPhone,
          vehicle: normalizeText(driverInfo?.vehicle_type) || normalizeText(driverInfo?.vehicle) || null,
          plate: normalizeText(driverInfo?.vehicle_plate) || null,
        };
      }
    }

    const paymentRows = paymentLinksResult.data || [];
    const activePaymentRow =
      paymentRows.find((row) => row.status === "pending" || row.status === "viewed") ||
      paymentRows[0] ||
      null;
    const paidAmountPaise = paymentRows
      .filter((row) => row.status === "paid")
      .reduce((sum, row) => sum + normalizeNumber(row.amount_paise), 0);
    const totalAmountPaise = Math.round(
      normalizeNumber(proposal.client_selected_price ?? proposal.total_price) * 100,
    );
    const activePaymentLink = activePaymentRow
      ? await getPaymentLinkByToken(admin, activePaymentRow.token, new URL(request.url).origin)
      : null;

    let operatorPhone =
      normalizeText(operatorProfileResult.data?.phone_whatsapp) ||
      normalizeText(operatorProfileResult.data?.phone) ||
      null;
    let operatorName =
      normalizeText(operatorProfileResult.data?.full_name) ||
      normalizeText(organizationResult.data?.name) ||
      "Travel operator";

    if (!operatorPhone && organizationResult.data?.owner_id) {
      const { data: ownerProfile } = await admin
        .from("profiles")
        .select("full_name, phone, phone_whatsapp")
        .eq("id", organizationResult.data.owner_id)
        .maybeSingle();

      if (ownerProfile) {
        operatorPhone =
          normalizeText(ownerProfile.phone_whatsapp) || normalizeText(ownerProfile.phone) || null;
        operatorName = normalizeText(ownerProfile.full_name) || operatorName;
      }
    }

    return apiSuccess({
      proposal: {
        id: proposal.id,
        token,
        title: proposal.title,
        status: proposal.status || "draft",
        approvedAt: proposal.approved_at,
        totalAmount: Math.round(totalAmountPaise / 100),
        destination: normalizeText(template?.destination) || normalizeText(trip?.destination),
        durationDays:
          normalizeNumber(template?.duration_days, itinerary.length || 0) || null,
        description: normalizeText(template?.description),
        heroImageUrl: normalizeText(template?.hero_image_url),
      },
      client: {
        name: normalizeText(clientProfileResult.data?.full_name) || "Traveler",
        firstName:
          (normalizeText(clientProfileResult.data?.full_name) || "Traveler").split(" ")[0] || "Traveler",
        phone:
          normalizeText(clientProfileResult.data?.phone_whatsapp) ||
          normalizeText(clientProfileResult.data?.phone),
        travelersCount: normalizeNumber(clientProfileResult.data?.travelers_count, 0) || null,
      },
      operator: {
        name: operatorName,
        phone: operatorPhone,
      },
      trip: {
        name: normalizeText(trip?.name) || proposal.title,
        status: normalizeText(trip?.status) || proposal.status || "draft",
        startDate: tripStartDate,
        endDate: tripEndDate,
      },
      driver,
      itinerary,
      payment: {
        totalAmount: Math.round(totalAmountPaise / 100),
        paidAmount: Math.round(paidAmountPaise / 100),
        dueAmount: Math.max(Math.round((totalAmountPaise - paidAmountPaise) / 100), 0),
        paymentLink: activePaymentLink,
      },
      review: {
        enabled: Boolean(tripEndDate && new Date(tripEndDate) < new Date()),
        googleReviewLink: process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL || null,
      },
    });
  } catch (error) {
    console.error("[portal/:token] unexpected error:", error);
    return apiError("Failed to load trip portal", 500);
  }
}
