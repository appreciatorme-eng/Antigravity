import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { FeedbackAction, ClientComment } from '@/types/feedback';

/** Lightweight shape used for optimistic cache updates on the itinerary list. */
interface ItineraryListItem {
    id: string;
    client_comments?: ClientComment[];
    self_service_status?: string | null;
    [key: string]: unknown;
}

export const itinerariesKeys = {
    all: ['itineraries'] as const,
    lists: () => [...itinerariesKeys.all, 'list'] as const,
    details: () => [...itinerariesKeys.all, 'detail'] as const,
    detail: (id: string) => [...itinerariesKeys.details(), id] as const,
};

export function useItineraries() {
    return useQuery({
        queryKey: itinerariesKeys.lists(),
        queryFn: async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            const response = await fetch("/api/itineraries", {
                headers: {
                    "Authorization": `Bearer ${session?.access_token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch itineraries");
            }

            const payload = await response.json();
            return payload.itineraries;
        }
    });
}

export function useUpdateItinerary() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: { client_id?: string | null; budget?: string } }) => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/itineraries/${id}`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${session?.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.error || "Failed to update itinerary");
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: itinerariesKeys.all });
        }
    });
}

/** Apply a feedback action optimistically to a local comments array */
function applyFeedbackOptimistic(
    comments: ClientComment[],
    action: FeedbackAction,
    operatorName: string,
): ClientComment[] {
    const now = new Date().toISOString();

    switch (action.action) {
        case "resolve_comment":
            return comments.map((c) =>
                c.id === action.comment_id
                    ? { ...c, resolved_at: now, resolved_by: operatorName }
                    : c
            );
        case "unresolve_comment":
            return comments.map((c) => {
                if (c.id !== action.comment_id) return c;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { resolved_at, resolved_by, ...rest } = c;
                return rest;
            });
        case "reply_comment":
            return comments.map((c) =>
                c.id === action.comment_id
                    ? { ...c, operator_reply: action.reply, operator_reply_at: now }
                    : c
            );
        case "resolve_all":
            return comments.map((c) =>
                c.resolved_at ? c : { ...c, resolved_at: now, resolved_by: operatorName }
            );
    }
}

export function useFeedbackAction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            itineraryId,
            ...action
        }: FeedbackAction & { itineraryId: string }) => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/itineraries/${itineraryId}/feedback`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${session?.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(action),
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.error || "Failed to update feedback");
            }

            return response.json();
        },
        onMutate: async ({ itineraryId, ...action }) => {
            await queryClient.cancelQueries({ queryKey: itinerariesKeys.all });
            const previousData = queryClient.getQueryData(itinerariesKeys.lists());

            queryClient.setQueryData(itinerariesKeys.lists(), (old: ItineraryListItem[] | undefined) => {
                if (!old) return old;
                return old.map((itin) => {
                    if (itin.id !== itineraryId) return itin;
                    const comments: ClientComment[] = itin.client_comments ?? [];
                    const updatedComments = applyFeedbackOptimistic(comments, action as FeedbackAction, "You");
                    const updatedStatus = action.action === "resolve_all" ? "resolved" : itin.self_service_status;
                    return {
                        ...itin,
                        client_comments: updatedComments,
                        self_service_status: updatedStatus,
                    };
                });
            });

            return { previousData };
        },
        onError: (_err, _vars, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(itinerariesKeys.lists(), context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: itinerariesKeys.all });
        },
    });
}
