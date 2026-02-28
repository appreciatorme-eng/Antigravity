import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getFeatureLimitStatus } from "@/lib/subscriptions/limits";
import { createAdminClient } from "@/lib/supabase/admin";

const supabaseAdmin = createAdminClient();

const lifecycleTemplateByStage: Record<string, string> = {
    lead: "lifecycle_lead",
    prospect: "lifecycle_prospect",
    proposal: "lifecycle_proposal",
    payment_pending: "lifecycle_payment_pending",
    payment_confirmed: "lifecycle_payment_confirmed",
    active: "lifecycle_active",
    review: "lifecycle_review",
    past: "lifecycle_past",
};

function featureLimitExceededResponse(limitStatus: Awaited<ReturnType<typeof getFeatureLimitStatus>>) {
    return NextResponse.json(
        {
            error: `You've reached your ${limitStatus.limit} ${limitStatus.label} on the ${limitStatus.tier} plan.`,
            code: "FEATURE_LIMIT_EXCEEDED",
            feature: limitStatus.feature,
            tier: limitStatus.tier,
            used: limitStatus.used,
            limit: limitStatus.limit,
            remaining: limitStatus.remaining,
            reset_at: limitStatus.resetAt,
            upgrade_plan: limitStatus.upgradePlan,
            billing_path: "/admin/billing",
        },
        { status: 402 }
    );
}

async function getAdminUserId(req: Request) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (!authError && authData?.user) {
            return authData.user.id;
        }
    }

    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();
    return user?.id || null;
}

export async function POST(req: Request) {
    try {
        const adminUserId = await getAdminUserId(req);
        if (!adminUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: adminProfile } = await supabaseAdmin
            .from("profiles")
            .select("role, organization_id")
            .eq("id", adminUserId)
            .single();

        if (!adminProfile || adminProfile.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (!adminProfile.organization_id) {
            return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
        }

        const body = await req.json();
        const email = String(body.email || "").trim().toLowerCase();
        const fullName = String(body.full_name || "").trim();
        const phone = String(body.phone || "").trim();
        const normalizedPhone = phone ? phone.replace(/\D/g, "") : "";
        const preferredDestination = String(body.preferredDestination || "").trim();
        const travelStyle = String(body.travelStyle || "").trim();
        const homeAirport = String(body.homeAirport || "").trim();
        const notes = String(body.notes || "").trim();
        const leadStatus = String(body.leadStatus || "").trim();
        const clientTag = String(body.clientTag || "").trim();
        const lifecycleStage = String(body.lifecycleStage || "").trim();
        const phaseNotificationsEnabled =
            typeof body.phaseNotificationsEnabled === "boolean"
                ? body.phaseNotificationsEnabled
                : true;
        const referralSource = String(body.referralSource || "").trim();
        const sourceChannel = String(body.sourceChannel || "").trim();
        const travelersCount = Number.isFinite(Number(body.travelersCount)) ? Number(body.travelersCount) : null;
        const budgetMin = Number.isFinite(Number(body.budgetMin)) ? Number(body.budgetMin) : null;
        const budgetMax = Number.isFinite(Number(body.budgetMax)) ? Number(body.budgetMax) : null;
        const marketingOptIn = typeof body.marketingOptIn === "boolean" ? body.marketingOptIn : null;
        const interests = Array.isArray(body.interests)
            ? body.interests.map((item: unknown) => String(item).trim()).filter(Boolean)
            : String(body.interests || "")
                .split(",")
                .map((item: string) => item.trim())
                .filter(Boolean);

        if (!email || !fullName) {
            return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
        }

        let { data: existingProfile } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("email", email)
            .single();

        if (!existingProfile && normalizedPhone) {
            const { data: phoneProfile } = await supabaseAdmin
                .from("profiles")
                .select("id")
                .eq("phone_normalized", normalizedPhone)
                .maybeSingle();
            existingProfile = phoneProfile ?? null;
        }

        if (!existingProfile?.id) {
            const clientLimitStatus = await getFeatureLimitStatus(
                supabaseAdmin,
                adminProfile.organization_id,
                "clients"
            );
            if (!clientLimitStatus.allowed) {
                return featureLimitExceededResponse(clientLimitStatus);
            }
        }

        const updates = {
            email,
            full_name: fullName,
            phone: phone || null,
            phone_normalized: normalizedPhone || null,
            role: "client",
            organization_id: adminProfile.organization_id ?? null,
            preferred_destination: preferredDestination || null,
            travelers_count: travelersCount,
            budget_min: budgetMin,
            budget_max: budgetMax,
            travel_style: travelStyle || null,
            interests: interests.length ? interests : null,
            home_airport: homeAirport || null,
            notes: notes || null,
            lead_status: leadStatus || "new",
            client_tag: clientTag || "standard",
            phase_notifications_enabled: phaseNotificationsEnabled,
            lifecycle_stage: lifecycleStage || "lead",
            marketing_opt_in: marketingOptIn,
            referral_source: referralSource || null,
            source_channel: sourceChannel || null,
        };

        if (existingProfile?.id) {
            const { data: existingOrgProfile } = await supabaseAdmin
                .from("profiles")
                .select("organization_id")
                .eq("id", existingProfile.id)
                .maybeSingle();
            if (
                existingOrgProfile?.organization_id &&
                existingOrgProfile.organization_id !== adminProfile.organization_id
            ) {
                return NextResponse.json({ error: "User belongs to a different organization" }, { status: 403 });
            }

            const { error: profileError } = await supabaseAdmin
                .from("profiles")
                .update(updates)
                .eq("id", existingProfile.id);

            if (profileError) {
                return NextResponse.json({ error: profileError.message }, { status: 400 });
            }

            // Ensure the relational "clients" record exists (proposals/trips reference this table).
            const { error: clientUpsertError } = await supabaseAdmin
                .from("clients")
                .upsert(
                    {
                        id: existingProfile.id,
                        organization_id: adminProfile.organization_id,
                        user_id: existingProfile.id,
                    },
                    { onConflict: "id" }
                );

            if (clientUpsertError) {
                return NextResponse.json({ error: clientUpsertError.message }, { status: 400 });
            }

            return NextResponse.json({ success: true, userId: existingProfile.id, status: "updated_existing" });
        }

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
            },
        });

        if (createError || !newUser?.user) {
            return NextResponse.json({ error: createError?.message || "Failed to create user" }, { status: 400 });
        }

        // `auth.admin.createUser()` does not guarantee our `profiles` row exists yet.
        // Use an upsert so the client appears immediately in downstream joins (e.g. proposals dropdown).
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .upsert(
                {
                    id: newUser.user.id,
                    ...updates,
                },
                { onConflict: "id" }
            );

        if (profileError) {
            return NextResponse.json({ error: profileError.message }, { status: 400 });
        }

        const { error: clientInsertError } = await supabaseAdmin
            .from("clients")
            .upsert(
                {
                    id: newUser.user.id,
                    organization_id: adminProfile.organization_id,
                    user_id: newUser.user.id,
                },
                { onConflict: "id" }
            );

        if (clientInsertError) {
            return NextResponse.json({ error: clientInsertError.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, userId: newUser.user.id });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const adminUserId = await getAdminUserId(req);
        if (!adminUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: adminProfile } = await supabaseAdmin
            .from("profiles")
            .select("role, organization_id")
            .eq("id", adminUserId)
            .single();

        if (!adminProfile || adminProfile.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (!adminProfile.organization_id) {
            return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
        }

        const { data: profiles, error: profilesError } = await supabaseAdmin
            .from("profiles")
            .select("id, role, full_name, email, phone, avatar_url, created_at, preferred_destination, travelers_count, budget_min, budget_max, travel_style, interests, home_airport, notes, lead_status, client_tag, phase_notifications_enabled, lifecycle_stage, marketing_opt_in, referral_source, source_channel")
            .eq("role", "client")
            .eq("organization_id", adminProfile.organization_id)
            .order("created_at", { ascending: false });

        if (profilesError) {
            return NextResponse.json({ error: profilesError.message }, { status: 400 });
        }

        const clientsWithTrips = await Promise.all(
            (profiles || []).map(async (client) => {
                const { count } = await supabaseAdmin
                    .from("trips")
                    .select("*", { count: "exact", head: true })
                    .eq("client_id", client.id);

                return {
                    ...client,
                    trips_count: count || 0,
                };
            })
        );

        return NextResponse.json({ clients: clientsWithTrips });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get("id");

        if (!clientId) {
            return NextResponse.json({ error: "Missing client id" }, { status: 400 });
        }

        const adminUserId = await getAdminUserId(req);
        if (!adminUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: adminProfile } = await supabaseAdmin
            .from("profiles")
            .select("role, organization_id")
            .eq("id", adminUserId)
            .single();

        if (!adminProfile || adminProfile.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (!adminProfile.organization_id) {
            return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
        }

        const { data: targetProfile } = await supabaseAdmin
            .from("profiles")
            .select("organization_id")
            .eq("id", clientId)
            .maybeSingle();
        if (!targetProfile || targetProfile.organization_id !== adminProfile.organization_id) {
            return NextResponse.json({ error: "Client not found in your organization" }, { status: 404 });
        }

        const { data: profileSnapshot } = await supabaseAdmin
            .from("profiles")
            .select("*")
            .eq("id", clientId)
            .maybeSingle();
        const { data: clientSnapshot } = await supabaseAdmin
            .from("clients")
            .select("*")
            .eq("id", clientId)
            .maybeSingle();

        const { error: profileDeleteError } = await supabaseAdmin
            .from("profiles")
            .delete()
            .eq("id", clientId);

        if (profileDeleteError) {
            return NextResponse.json({ error: profileDeleteError.message }, { status: 400 });
        }

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(clientId);

        if (deleteError) {
            // Best-effort compensating rollback so profile records are not silently lost.
            if (profileSnapshot) {
                await supabaseAdmin.from("profiles").upsert(profileSnapshot);
            }
            if (clientSnapshot) {
                await supabaseAdmin.from("clients").upsert(clientSnapshot);
            }
            return NextResponse.json({ error: deleteError.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const adminUserId = await getAdminUserId(req);
        if (!adminUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: adminProfile } = await supabaseAdmin
            .from("profiles")
            .select("role, organization_id")
            .eq("id", adminUserId)
            .single();

        if (!adminProfile || adminProfile.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (!adminProfile.organization_id) {
            return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
        }

        const body = await req.json();
        const profileId = String(body.id || "").trim();
        const role = typeof body.role === "string" ? body.role.trim() : "";
        const lifecycleStage = typeof body.lifecycle_stage === "string" ? body.lifecycle_stage.trim() : "";
        const clientTag = typeof body.clientTag === "string" ? body.clientTag.trim() : "";
        const phaseNotificationsEnabled =
            typeof body.phaseNotificationsEnabled === "boolean"
                ? body.phaseNotificationsEnabled
                : null;

        // Additional fields for update
        const fullName = typeof body.full_name === "string" ? body.full_name.trim() : undefined;
        const phone = typeof body.phone === "string" ? body.phone.trim() : undefined;
        // email is not updated here to avoid auth sync issues for now
        const preferredDestination = typeof body.preferredDestination === "string" ? body.preferredDestination.trim() : undefined;
        const travelersCount = Number.isFinite(Number(body.travelersCount)) ? Number(body.travelersCount) : undefined;
        const budgetMin = Number.isFinite(Number(body.budgetMin)) ? Number(body.budgetMin) : undefined;
        const budgetMax = Number.isFinite(Number(body.budgetMax)) ? Number(body.budgetMax) : undefined;
        const travelStyle = typeof body.travelStyle === "string" ? body.travelStyle.trim() : undefined;
        const interests = Array.isArray(body.interests)
            ? body.interests
            : typeof body.interests === "string"
                ? body.interests.split(",").map((s: string) => s.trim()).filter(Boolean)
                : undefined;
        const homeAirport = typeof body.homeAirport === "string" ? body.homeAirport.trim() : undefined;
        const notes = typeof body.notes === "string" ? body.notes.trim() : undefined;
        const marketingOptIn = typeof body.marketingOptIn === "boolean" ? body.marketingOptIn : undefined;
        const referralSource = typeof body.referralSource === "string" ? body.referralSource.trim() : undefined;
        const sourceChannel = typeof body.sourceChannel === "string" ? body.sourceChannel.trim() : undefined;
        const leadStatus = typeof body.leadStatus === "string" ? body.leadStatus.trim() : undefined;
        const languagePreference = typeof body.languagePreference === "string" ? body.languagePreference.trim() : undefined;

        if (!profileId) {
            return NextResponse.json({ error: "Profile id is required" }, { status: 400 });
        }

        // We allow updates if at least one field is provided
        const hasUpdates = role || lifecycleStage || clientTag || phaseNotificationsEnabled !== null ||
            fullName !== undefined || phone !== undefined || preferredDestination !== undefined ||
            travelersCount !== undefined || budgetMin !== undefined || budgetMax !== undefined ||
            travelStyle !== undefined || interests !== undefined || homeAirport !== undefined ||
            notes !== undefined || marketingOptIn !== undefined || referralSource !== undefined ||
            sourceChannel !== undefined || leadStatus !== undefined || languagePreference !== undefined;

        if (!hasUpdates) {
            return NextResponse.json({ error: "No fields to update provided" }, { status: 400 });
        }

        if (role && role !== "client" && role !== "driver") {
            return NextResponse.json({ error: "Role must be client or driver" }, { status: 400 });
        }

        const validLifecycleStages = new Set([
            "lead",
            "prospect",
            "proposal",
            "payment_pending",
            "payment_confirmed",
            "active",
            "review",
            "past",
        ]);
        if (lifecycleStage && !validLifecycleStages.has(lifecycleStage)) {
            return NextResponse.json({ error: "Invalid lifecycle_stage" }, { status: 400 });
        }

        const validClientTags = new Set([
            "standard",
            "vip",
            "repeat",
            "corporate",
            "family",
            "honeymoon",
            "high_priority",
        ]);
        if (clientTag && !validClientTags.has(clientTag)) {
            return NextResponse.json({ error: "Invalid client_tag" }, { status: 400 });
        }

        const { data: existingProfile } = await supabaseAdmin
            .from("profiles")
            .select("id,full_name,email,phone,phone_normalized,lifecycle_stage,preferred_destination,phase_notifications_enabled,organization_id")
            .eq("id", profileId)
            .maybeSingle();

        if (!existingProfile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }
        if (existingProfile.organization_id !== adminProfile.organization_id) {
            return NextResponse.json({ error: "Profile not found in your organization" }, { status: 404 });
        }

        const updates: Record<string, string | number | boolean | string[] | null> = {};
        if (role) updates.role = role;
        if (lifecycleStage) updates.lifecycle_stage = lifecycleStage;
        if (clientTag) updates.client_tag = clientTag;
        if (phaseNotificationsEnabled !== null) updates.phase_notifications_enabled = phaseNotificationsEnabled;
        if (role === "client" && !lifecycleStage && !existingProfile.lifecycle_stage) {
            updates.lifecycle_stage = "lead";
        }
        if (role === "client" && !clientTag) {
            updates.client_tag = "standard";
        }

        // Map camelCase body to snake_case DB fields
        if (fullName !== undefined) updates.full_name = fullName;
        if (phone !== undefined) {
            updates.phone = phone;
            updates.phone_normalized = phone.replace(/\D/g, "");
        }
        if (preferredDestination !== undefined) updates.preferred_destination = preferredDestination;
        if (travelersCount !== undefined) updates.travelers_count = travelersCount;
        if (budgetMin !== undefined) updates.budget_min = budgetMin;
        if (budgetMax !== undefined) updates.budget_max = budgetMax;
        if (travelStyle !== undefined) updates.travel_style = travelStyle;
        if (interests !== undefined) updates.interests = interests;
        if (homeAirport !== undefined) updates.home_airport = homeAirport;
        if (notes !== undefined) updates.notes = notes;
        if (marketingOptIn !== undefined) updates.marketing_opt_in = marketingOptIn;
        if (referralSource !== undefined) updates.referral_source = referralSource;
        if (sourceChannel !== undefined) updates.source_channel = sourceChannel;
        if (leadStatus !== undefined) updates.lead_status = leadStatus;
        if (languagePreference !== undefined) updates.language_preference = languagePreference;

        const { error } = await supabaseAdmin
            .from("profiles")
            .update(updates)
            .eq("id", profileId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        const lifecycleChanged =
            !!lifecycleStage &&
            existingProfile.lifecycle_stage !== lifecycleStage;

        if (lifecycleChanged) {
            await supabaseAdmin.from("workflow_stage_events").insert({
                organization_id: adminProfile.organization_id,
                profile_id: existingProfile.id,
                from_stage: existingProfile.lifecycle_stage || "lead",
                to_stage: lifecycleStage,
                changed_by: adminUserId,
            });
        }

        if (
            lifecycleChanged
        ) {
            let notifyClient = true;
            if (adminProfile.organization_id) {
                const { data: stageRule } = await supabaseAdmin
                    .from("workflow_notification_rules")
                    .select("notify_client")
                    .eq("organization_id", adminProfile.organization_id)
                    .eq("lifecycle_stage", lifecycleStage)
                    .maybeSingle();
                notifyClient = stageRule?.notify_client ?? true;
            }

            const clientNotificationsEnabled = existingProfile.phase_notifications_enabled ?? true;
            if (!notifyClient || !clientNotificationsEnabled) {
                return NextResponse.json({ success: true, id: profileId, role: role || null, lifecycle_stage: lifecycleStage || null, client_tag: clientTag || null });
            }

            const templateKey = lifecycleTemplateByStage[lifecycleStage];
            const recipientPhone = existingProfile.phone_normalized || existingProfile.phone || null;
            const recipientEmail = existingProfile.email || null;

            await supabaseAdmin.from("notification_queue").insert({
                user_id: existingProfile.id,
                notification_type: "custom",
                recipient_phone: recipientPhone,
                recipient_email: recipientEmail,
                channel_preference: recipientPhone ? "whatsapp_first" : "email_only",
                recipient_type: "client",
                scheduled_for: new Date().toISOString(),
                idempotency_key: `lifecycle-stage:${existingProfile.id}:${existingProfile.lifecycle_stage || "lead"}:${lifecycleStage}:${Date.now()}`,
                payload: {
                    title: "Stage Update",
                    body: `Hi ${existingProfile.full_name || "Traveler"}, your trip stage is now ${lifecycleStage.replace(/_/g, " ")}.`,
                    template_key: templateKey,
                    template_vars: {
                        client_name: existingProfile.full_name || "Traveler",
                        destination: existingProfile.preferred_destination || "your destination",
                    },
                },
                status: "pending",
            });
        }

        return NextResponse.json({ success: true, id: profileId, role: role || null, lifecycle_stage: lifecycleStage || null, client_tag: clientTag || null });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}
