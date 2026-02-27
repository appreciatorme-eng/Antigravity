import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Database } from "../database.types";

export type SupportTicket = Database["public"]["Tables"]["support_tickets"]["Row"];

export function useSupportTickets() {
    return useQuery<SupportTicket[]>({
        queryKey: ["support-tickets"],
        queryFn: async () => {
            const res = await fetch("/api/support");
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to fetch support tickets");
            }
            return res.json();
        }
    });
}

export type CreateSupportTicketParams = {
    title: string;
    description: string;
    category: string;
    priority: string;
};

export function useCreateSupportTicket() {
    const queryClient = useQueryClient();

    return useMutation<SupportTicket, Error, CreateSupportTicketParams>({
        mutationFn: async (params) => {
            const res = await fetch("/api/support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(params)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to create support ticket");
            }

            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
        }
    });
}
