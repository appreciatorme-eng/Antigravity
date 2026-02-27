import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type ReferralStats = {
    total: number;
    converted: number;
    progress: number;
    target: number;
    canClaimReward: boolean;
};

export type Referral = {
    id: string;
    status: 'pending' | 'converted';
    reward_granted: boolean;
    created_at: string;
    referred_organization_id: string;
    referred_org: { name: string } | null;
};

export type ReferralData = {
    referralCode: string;
    referrals: Referral[];
    stats: ReferralStats;
};

export function useReferralData() {
    return useQuery<ReferralData>({
        queryKey: ["referrals"],
        queryFn: async () => {
            const res = await fetch("/api/admin/referrals");
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to fetch referral data");
            }
            return res.json();
        }
    });
}

export function useApplyReferralCode() {
    const queryClient = useQueryClient();

    return useMutation<any, Error, { referralCode: string }>({
        mutationFn: async ({ referralCode }) => {
            const res = await fetch("/api/admin/referrals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ referralCode })
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) throw new Error(data.error || "Failed to apply referral code");
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["referrals"] });
            toast.success("Referral code applied successfully!");
        },
        onError: (err) => {
            toast.error(err.message);
        }
    });
}
