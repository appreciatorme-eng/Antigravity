import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch User's Referral Code
        const { data: profile } = await supabase
            .from("profiles")
            .select("id, referral_code")
            .eq("id", user.id)
            .single();

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        // Fetch user's referrals
        const { data: referrals, error: refError } = await supabase
            .from("referrals")
            .select(`
                id, status, reward_granted, created_at,
                referred_organization_id,
                referred_org:organizations!referred_organization_id(name)
            `)
            .eq("referrer_profile_id", profile.id)
            .order("created_at", { ascending: false });

        if (refError) {
            console.error("Error fetching referrals:", refError);
            return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
        }

        // Calculate stats
        const totalReferrals = referrals?.length || 0;
        const convertedReferrals = referrals?.filter(r => r.status === "converted").length || 0;

        // Progress tracking for 1 month free (e.g., target = 3)
        const TARGET_REFERRALS = 3;
        const progress = Math.min((convertedReferrals / TARGET_REFERRALS) * 100, 100);
        const canClaimReward = convertedReferrals >= TARGET_REFERRALS && !(referrals as any)?.every((r: any) => r.reward_granted);

        return NextResponse.json({
            referralCode: profile.referral_code,
            referrals: referrals || [],
            stats: {
                total: totalReferrals,
                converted: convertedReferrals,
                progress,
                target: TARGET_REFERRALS,
                canClaimReward
            }
        });
    } catch (error) {
        console.error("Referrals fetch error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Allow user to enter someone else's referral code to be tracked
export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { referralCode } = body;

        if (!referralCode) return NextResponse.json({ error: "Referral code required" }, { status: 400 });

        // Identify the referrer
        const { data: referrerProfile } = await supabase
            .from("profiles")
            .select("id, organization_id")
            .eq("referral_code", referralCode)
            .single();

        if (!referrerProfile) {
            return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
        }

        // Prevent self-referral
        if (referrerProfile.id === user.id) {
            return NextResponse.json({ error: "You cannot refer yourself." }, { status: 400 });
        }

        // Get this user's organization
        const { data: myProfile } = await supabase
            .from("profiles")
            .select("organization_id")
            .eq("id", user.id)
            .single();

        if (!myProfile?.organization_id) {
            return NextResponse.json({ error: "You do not have an active organization to link." }, { status: 400 });
        }

        // Prevent referring someone within the same organization
        if (referrerProfile.organization_id === myProfile.organization_id) {
            return NextResponse.json({ error: "You cannot apply a referral code from someone in your own team." }, { status: 400 });
        }

        // Fetch organization details for age check
        const { data: myOrg } = await supabase
            .from("organizations")
            .select("created_at")
            .eq("id", myProfile.organization_id)
            .single();

        if (myOrg?.created_at) {
            const orgAgeDays = (new Date().getTime() - new Date(myOrg.created_at).getTime()) / (1000 * 60 * 60 * 24);
            if (orgAgeDays > 7) {
                 return NextResponse.json({ error: "Referral codes can only be applied within 7 days of account creation." }, { status: 403 });
            }
        }

        // Prevent circular referrals (A refers B, then B tries to refer A)
        if (referrerProfile.organization_id) {
            const { data: circularCheck } = await supabase
                .from("referrals")
                .select("id")
                .eq("referrer_profile_id", user.id)
                .eq("referred_organization_id", referrerProfile.organization_id)
                .maybeSingle();

            if (circularCheck) {
                return NextResponse.json({ error: "Circular referrals are not permitted." }, { status: 403 });
            }
        }

        // Create the referral link (Fail silently if it already exists due to UNIQUE constraint)
        const { error: insertError } = await supabase
            .from("referrals")
            .insert({
                referrer_profile_id: referrerProfile.id,
                referred_organization_id: myProfile.organization_id,
                status: "pending"
            });

        if (insertError) {
            if (insertError.code === "23505") {
                return NextResponse.json({ error: "Your organization is already referred by someone." }, { status: 400 });
            }
            throw insertError;
        }

        return NextResponse.json({ success: true, message: "Referral code applied successfully" });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Server Error" }, { status: 500 });
    }
}
