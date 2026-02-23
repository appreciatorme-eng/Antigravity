"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Calendar, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface ConvertProposalModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (tripId: string) => void;
    proposalId: string;
    proposalTitle: string;
}

export default function ConvertProposalModal({
    open,
    onOpenChange,
    onSuccess,
    proposalId,
    proposalTitle
}: ConvertProposalModalProps) {
    const [startDate, setStartDate] = useState("");
    const [converting, setConverting] = useState(false);
    const { toast } = useToast();

    const handleConvert = async () => {
        if (!startDate) {
            toast({
                title: "Start date required",
                description: "Please select a start date for the trip.",
                variant: "warning",
            });
            return;
        }

        setConverting(true);
        try {
            const response = await fetch(`/api/admin/proposals/${proposalId}/convert`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ startDate }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to convert proposal");
            }

            onSuccess(data.tripId);
            onOpenChange(false);
            toast({
                title: "Proposal converted",
                description: "Trip was created successfully.",
                variant: "success",
            });
        } catch (error) {
            console.error("Error converting proposal:", error);
            toast({
                title: "Conversion failed",
                description: error instanceof Error ? error.message : "Failed to convert proposal",
                variant: "error",
            });
        } finally {
            setConverting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-serif flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        Convert to Trip
                    </DialogTitle>
                    <DialogDescription>
                        Create a confirmed trip from <strong>{proposalTitle}</strong>.
                        Select the start date to begin.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Trip Start Date
                        </label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            The trip duration will match the proposal length.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={handleConvert}
                        disabled={converting || !startDate}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {converting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Converting...
                            </>
                        ) : (
                            "Create Trip"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
