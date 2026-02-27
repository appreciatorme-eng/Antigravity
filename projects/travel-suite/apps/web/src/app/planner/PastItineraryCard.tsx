"use client";

import { useState } from "react";
import { useUpdateItinerary } from "@/lib/queries/itineraries";
import { useClients } from "@/lib/queries/clients";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MapPin, Calendar, Clock, DollarSign, Check, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface PastItineraryCardProps {
    itinerary: {
        id: string;
        trip_title: string;
        destination: string;
        duration_days: number;
        created_at: string;
        budget: string | null;
        client_id: string | null;
        client?: { full_name: string } | null;
    };
}

export function PastItineraryCard({ itinerary }: PastItineraryCardProps) {
    const { toast } = useToast();
    const { mutateAsync: updateItinerary, isPending } = useUpdateItinerary();
    const { data: clients, isLoading: isLoadingClients } = useClients();

    const [budget, setBudget] = useState(itinerary.budget || "");
    const [isEditingBudget, setIsEditingBudget] = useState(false);

    const handleClientChange = async (clientId: string) => {
        try {
            await updateItinerary({
                id: itinerary.id,
                updates: { client_id: clientId === "unassigned" ? null : clientId }
            });
            toast({
                title: "Client attached",
                description: "Successfully updated the itinerary's client.",
            });
        } catch (error) {
            toast({
                title: "Failed to update client",
                description: error instanceof Error ? error.message : "Unknown error",
                variant: "destructive" as any,
            });
        }
    };

    const handleSaveBudget = async () => {
        try {
            await updateItinerary({
                id: itinerary.id,
                updates: { budget }
            });
            setIsEditingBudget(false);
            toast({
                title: "Budget updated",
                description: "Successfully updated the itinerary's budget.",
            });
        } catch (error) {
            toast({
                title: "Failed to update budget",
                description: error instanceof Error ? error.message : "Unknown error",
                variant: "destructive" as any,
            });
        }
    };

    return (
        <Card className="overflow-hidden bg-background/50 backdrop-blur-sm border-white/10 hover:border-white/20 transition-all duration-300">
            <CardContent className="p-5 flex flex-col sm:flex-row gap-6">

                {/* Info Section */}
                <div className="flex-1 space-y-3">
                    <div>
                        <h3 className="text-lg font-semibold tracking-tight text-white mb-1">
                            {itinerary.trip_title || itinerary.destination || "Untitled Itinerary"}
                        </h3>
                        <p className="text-sm text-neutral-400 flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5" />
                            {itinerary.destination}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-neutral-500">
                        <span className="flex items-center gap-1.5 bg-white/5 py-1 px-2.5 rounded-full">
                            <Clock className="h-3 w-3" />
                            {itinerary.duration_days} Days
                        </span>
                        <span className="flex items-center gap-1.5 bg-white/5 py-1 px-2.5 rounded-full">
                            <Calendar className="h-3 w-3" />
                            {new Date(itinerary.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                {/* Actions Section */}
                <div className="flex flex-col gap-4 sm:w-[280px] shrink-0 border-t sm:border-t-0 sm:border-l border-white/5 pt-4 sm:pt-0 sm:pl-6 justify-center">

                    {/* Client Selector */}
                    <div className="space-y-1.5">
                        <Label className="text-xs text-neutral-400 font-medium">Assign Client</Label>
                        <Select
                            defaultValue={itinerary.client_id || "unassigned"}
                            onValueChange={handleClientChange}
                            disabled={isPending || isLoadingClients}
                        >
                            <SelectTrigger className="h-8 bg-white/5 border-white/10 text-sm">
                                <SelectValue placeholder="Select incoming client" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unassigned" className="text-neutral-400">
                                    No Client
                                </SelectItem>
                                {clients?.map((client: any) => (
                                    <SelectItem key={client.id} value={client.id}>
                                        {client.full_name || client.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Budget/Price */}
                    <div className="space-y-1.5">
                        <Label className="text-xs text-neutral-400 font-medium">Price / Budget</Label>
                        <div className="flex gap-2 items-center">
                            <div className="relative flex-1">
                                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                                <Input
                                    value={budget}
                                    onChange={(e) => {
                                        setBudget(e.target.value);
                                        setIsEditingBudget(true);
                                    }}
                                    placeholder="0.00"
                                    className="h-8 pl-8 bg-white/5 border-white/10 text-sm transition-colors"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveBudget();
                                    }}
                                />
                            </div>
                            {isEditingBudget && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-400/10 transition-colors"
                                    onClick={handleSaveBudget}
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                </div>
            </CardContent>
        </Card>
    );
}
