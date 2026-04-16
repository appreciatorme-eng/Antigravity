import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import {
    draftAccountPlaybook,
    draftCollectionsSequence,
    draftCustomerSaveOutreach,
    draftGrowthExperiment,
    draftRenewalStrategy,
} from "@/lib/platform/business-os";
import { logError } from "@/lib/observability/logger";

type Body = {
    org_id?: string;
};

export async function POST(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    let body: Body;
    try {
        body = await request.json() as Body;
    } catch {
        return apiError("Invalid JSON", 400);
    }

    const orgId = body.org_id?.trim();
    if (!orgId) return apiError("org_id is required", 400);

    try {
        const [playbook, outreach, collections, renewal, growth] = await Promise.all([
            draftAccountPlaybook(auth.adminClient as never, orgId),
            draftCustomerSaveOutreach(auth.adminClient as never, orgId),
            draftCollectionsSequence(auth.adminClient as never, orgId),
            draftRenewalStrategy(auth.adminClient as never, orgId),
            draftGrowthExperiment(auth.adminClient as never, orgId),
        ]);
        return NextResponse.json({
            playbook,
            outreach,
            collections,
            renewal,
            growth,
        });
    } catch (error) {
        logError("[superadmin/ai/account-playbook POST]", error);
        return apiError("Failed to draft account playbook", 500);
    }
}
