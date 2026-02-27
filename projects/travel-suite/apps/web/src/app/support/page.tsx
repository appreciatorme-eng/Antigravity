"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSupportTickets, useCreateSupportTicket } from "@/lib/queries/support";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LifeBuoy, Send, Loader2, AlertCircle, CheckCircle2, Filter } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function SupportPage() {
    const { data: tickets, isLoading: ticketsLoading, error: ticketsError } = useSupportTickets();
    const { mutate: createTicket, isPending } = useCreateSupportTicket();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("General Inquiry");
    const [priority, setPriority] = useState("Medium");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !description.trim()) {
            toast.error("Please fill in all required fields.");
            return;
        }

        createTicket({
            title,
            description,
            category,
            priority
        }, {
            onSuccess: () => {
                toast.success("Support ticket created successfully!");
                setTitle("");
                setDescription("");
                setCategory("General Inquiry");
                setPriority("Medium");
            }
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Open':
                return <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">Open</Badge>;
            case 'In Progress':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
            case 'Resolved':
                return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">Resolved</Badge>;
            case 'Closed':
                return <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">Closed</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'Low':
                return <Badge variant="outline" className="text-slate-500 border-slate-200 bg-white">Low</Badge>;
            case 'Medium':
                return <Badge variant="outline" className="text-blue-500 border-blue-200 bg-white">Medium</Badge>;
            case 'High':
                return <Badge variant="outline" className="text-orange-500 border-orange-200 bg-white">High</Badge>;
            case 'Urgent':
                return <Badge variant="outline" className="text-red-500 border-red-200 bg-white uppercase font-bold text-[10px]">Urgent</Badge>;
            default:
                return <Badge variant="outline" className="bg-white">{priority}</Badge>;
        }
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-64px)] bg-slate-50/50">
            {/* Header section with gradient background */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white pb-8 pt-10 px-6 border-b border-slate-700">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/20 rounded-xl">
                                <LifeBuoy className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">Support Center</h1>
                        </div>
                        <p className="text-slate-300 max-w-xl text-sm md:text-base leading-relaxed">
                            Need help? Submit a ticket below, and our team will get back to you as soon as possible. Track your ongoing issues in the list.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 max-w-6xl mx-auto w-full p-6 -mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column - Form */}
                    <div className="lg:col-span-5 relative z-10">
                        <Card className="shadow-lg border-0 ring-1 ring-slate-200/50 backdrop-blur-xl bg-white/90">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-slate-400" />
                                    Submit a Request
                                </CardTitle>
                                <CardDescription>Tell us what's happening and we'll help you out.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-slate-700">Issue Title <span className="text-red-500">*</span></label>
                                            <Input
                                                placeholder="Brief summary of your issue"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium text-slate-700">Category</label>
                                                <Select value={category} onValueChange={setCategory}>
                                                    <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white transition-colors">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="General Inquiry">General Inquiry</SelectItem>
                                                        <SelectItem value="Bug">Technical Bug</SelectItem>
                                                        <SelectItem value="Feature Request">Feature Request</SelectItem>
                                                        <SelectItem value="Billing">Billing/Payments</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium text-slate-700">Priority</label>
                                                <Select value={priority} onValueChange={setPriority}>
                                                    <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white transition-colors">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Low">Low</SelectItem>
                                                        <SelectItem value="Medium">Medium</SelectItem>
                                                        <SelectItem value="High">High</SelectItem>
                                                        <SelectItem value="Urgent">Urgent</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-slate-700">Description <span className="text-red-500">*</span></label>
                                            <Textarea
                                                placeholder="Provide as much detail as possible to help us resolve the issue faster..."
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                className="min-h-[160px] resize-y bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full text-white shadow-md hover:shadow-lg transition-all"
                                        disabled={isPending}
                                    >
                                        {isPending ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin opacity-80" />
                                                Submitting Request...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5 mr-2" />
                                                Submit Support Request
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Existing Tickets */}
                    <div className="lg:col-span-7 mt-8 lg:mt-0 relative z-10">
                        <div className="flex items-center justify-between mb-4 mt-2">
                            <h2 className="text-lg font-semibold text-slate-800">Your Recent Tickets</h2>
                            <Button variant="outline" size="sm" className="h-8 gap-2 text-slate-500">
                                <Filter className="w-3.5 h-3.5" />
                                Filter
                            </Button>
                        </div>

                        {ticketsLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse border border-slate-200" />
                                ))}
                            </div>
                        ) : ticketsError ? (
                            <Card className="border-red-100 bg-red-50/50 shadow-sm">
                                <CardContent className="p-8 text-center text-red-600 flex flex-col items-center">
                                    <AlertCircle className="w-10 h-10 mb-3 opacity-50" />
                                    <p className="font-medium">Failed to load support tickets</p>
                                    <p className="text-sm opacity-80 mt-1">Please try refreshing the page or try again later.</p>
                                </CardContent>
                            </Card>
                        ) : tickets && tickets.length > 0 ? (
                            <div className="space-y-4">
                                <AnimatePresence mode="popLayout">
                                    {tickets.map((ticket, idx) => (
                                        <motion.div
                                            key={ticket.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                        >
                                            <Card className="group border-slate-200 hover:border-primary/30 transition-all hover:shadow-md cursor-pointer overflow-hidden bg-white/80 backdrop-blur-sm">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent to-transparent group-hover:from-primary/50 group-hover:to-primary/20 transition-colors" />
                                                <CardContent className="p-5">
                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                        <div className="space-y-1.5 flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-semibold text-slate-900 truncate" title={ticket.title}>
                                                                    {ticket.title}
                                                                </h3>
                                                                <span className="text-xs text-slate-400 shrink-0 font-mono">
                                                                    #{ticket.id.split('-')[0]}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                                                                {ticket.description}
                                                            </p>
                                                            <div className="flex items-center gap-3 pt-2 text-xs text-slate-500">
                                                                <span className="flex items-center gap-1.5 font-medium px-2 py-0.5 bg-slate-100 rounded-full">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                                    {ticket.category}
                                                                </span>
                                                                <span>&bull;</span>
                                                                <span>{format(new Date(ticket.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                                            {getStatusBadge(ticket.status)}
                                                            {getPriorityBadge(ticket.priority)}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <Card className="border-dashed border-slate-300 bg-white/50 shadow-sm">
                                <CardContent className="p-12 text-center text-slate-500 flex flex-col items-center">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full mb-4 flex items-center justify-center">
                                        <CheckCircle2 className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <p className="font-medium text-slate-700">No support tickets found</p>
                                    <p className="text-sm mt-1 max-w-sm">You haven't submitted any support requests yet. When you do, they will appear here for you to track.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
