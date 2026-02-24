"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Heart,
  MessageSquare,
  Save,
  Send,
  User,
  WifiOff,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

interface ApprovalManagerProps {
  token: string;
  clientName: string;
}

interface Comment {
  id: string;
  author: string;
  comment: string;
  created_at: string;
}

interface Preferences {
  budget_preference?: string;
  pace?: string;
  room_preference?: string;
  must_have?: string[];
  avoid?: string[];
  notes?: string;
}

export function ApprovalManager({ token, clientName }: ApprovalManagerProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<"viewed" | "commented" | "approved" | "loading">("loading");
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState(clientName || "");
  const [approvalName, setApprovalName] = useState(clientName || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvedBy, setApprovedBy] = useState("");
  const [approvedAt, setApprovedAt] = useState("");
  const [wishlistInput, setWishlistInput] = useState("");
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<Preferences>({});

  const mustHaveValue = useMemo(() => (preferences.must_have || []).join(", "), [preferences.must_have]);
  const avoidValue = useMemo(() => (preferences.avoid || []).join(", "), [preferences.avoid]);

  const parseTags = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 20);

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/share/${token}`);
      const data = await response.json();
      if (data.status) {
        setStatus(data.status);
        setComments(Array.isArray(data.comments) ? data.comments : []);
        setApprovedBy(data.approved_by || "");
        setApprovedAt(data.approved_at || "");
        setPreferences((data.preferences || {}) as Preferences);
        setWishlistItems(Array.isArray(data.wishlist_items) ? data.wishlist_items : []);
      }
    } catch (error) {
      console.error("Failed to load share status", error);
    }
  }, [token]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const postAction = async (payload: Record<string, unknown>) => {
    const response = await fetch(`/api/share/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || "Request failed");
    }
    return data;
  };

  const handleComment = async () => {
    if (!newComment.trim() || !authorName.trim()) return;
    setIsSubmitting(true);
    try {
      const data = await postAction({
        action: "comment",
        author: authorName,
        comment: newComment,
      });
      setComments((prev) => [data.comment, ...prev]);
      setNewComment("");
      if (status !== "approved") setStatus("commented");
      toast({
        title: "Comment sent",
        description: "Your feedback was saved and shared with the operator.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Comment failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!approvalName.trim()) {
      toast({
        title: "Approver name required",
        description: "Enter your full name before finalizing.",
        variant: "warning",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await postAction({ action: "approve", name: approvalName });
      setStatus("approved");
      setApprovedBy(approvalName);
      setApprovedAt(new Date().toISOString());
      toast({
        title: "Trip approved",
        description: "The operator has been notified.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Approval failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSubmitting(true);
    try {
      await postAction({
        action: "save_preferences",
        preferences,
      });
      if (status !== "approved") setStatus("commented");
      toast({
        title: "Preferences saved",
        description: "Your customization requests were saved.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddWishlist = async () => {
    if (!wishlistInput.trim()) return;
    setIsSubmitting(true);
    try {
      const data = await postAction({
        action: "add_wishlist",
        wishlist_item: wishlistInput,
      });
      setWishlistItems(Array.isArray(data.wishlist_items) ? data.wishlist_items : []);
      setWishlistInput("");
      toast({
        title: "Added to wish list",
        description: "Your requested experience was saved.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Add failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveWishlist = async (item: string) => {
    setIsSubmitting(true);
    try {
      const data = await postAction({
        action: "remove_wishlist",
        wishlist_item: item,
      });
      setWishlistItems(Array.isArray(data.wishlist_items) ? data.wishlist_items : []);
    } catch (error) {
      toast({
        title: "Remove failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOfflinePack = async () => {
    if (typeof window !== "undefined" && navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "CACHE_URLS",
        urls: [window.location.href, `/api/share/${token}`],
      });
    }
    try {
      await postAction({ action: "mark_offline_ready" });
      toast({
        title: "Offline pack requested",
        description: "This itinerary was marked for offline access.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Offline request failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    }
  };

  if (status === "loading") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-400">Loading communications...</div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-8 mb-20">
      <Card
        className={`overflow-hidden border-2 transition-all ${
          status === "approved" ? "border-emerald-500 bg-emerald-50/30" : "border-blue-100 shadow-xl"
        }`}
      >
        <CardHeader
          className={`${status === "approved" ? "bg-emerald-500" : "bg-blue-600"} text-white p-8 text-center`}
        >
          <CardTitle className="text-3xl font-serif">
            {status === "approved" ? "Journey Finalized" : "Finalize This Journey"}
          </CardTitle>
          <CardDescription className="text-white/80 text-lg mt-2">
            {status === "approved"
              ? "Your trip has been approved. The operator can start confirmations."
              : "Approve when ready, or send requested edits below."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-4">
          {status === "approved" ? (
            <div className="space-y-3 text-center">
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-6 py-3 rounded-full font-semibold">
                <User className="w-5 h-5" /> Approved by {approvedBy}
              </div>
              <p className="text-gray-500 text-sm">
                {approvedAt ? new Date(approvedAt).toLocaleString("en-IN") : "Approval timestamp unavailable"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                value={approvalName}
                onChange={(event) => setApprovalName(event.target.value)}
                placeholder="Your full name"
              />
              <Button
                size="lg"
                onClick={handleApprove}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Finalize & Approve
              </Button>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleOfflinePack} className="gap-2">
              <WifiOff className="w-4 h-4" />
              Prepare Offline Access
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-serif flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Comments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              placeholder="Your name"
            />
            <Textarea
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              placeholder="Request edits, add notes, or ask questions..."
              className="min-h-[110px]"
            />
            <Button onClick={handleComment} disabled={isSubmitting || !newComment.trim()} className="w-full">
              <Send className="w-4 h-4 mr-2" />
              Send Comment
            </Button>
            <div className="space-y-3 max-h-80 overflow-auto pr-1">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-400">No comments yet.</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{comment.author}</span>
                      <span className="text-[11px] text-gray-400">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{comment.comment}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-serif flex items-center gap-2">
              <Save className="w-5 h-5 text-indigo-500" />
              Self-Service Customization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <select
                value={preferences.budget_preference || ""}
                onChange={(event) =>
                  setPreferences((prev) => ({ ...prev, budget_preference: event.target.value || undefined }))
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Budget Preference</option>
                <option value="economy">Economy</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="luxury">Luxury</option>
              </select>
              <select
                value={preferences.pace || ""}
                onChange={(event) => setPreferences((prev) => ({ ...prev, pace: event.target.value || undefined }))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Trip Pace</option>
                <option value="relaxed">Relaxed</option>
                <option value="balanced">Balanced</option>
                <option value="packed">Packed</option>
              </select>
            </div>

            <Input
              value={preferences.room_preference || ""}
              onChange={(event) =>
                setPreferences((prev) => ({ ...prev, room_preference: event.target.value || undefined }))
              }
              placeholder="Room preference (e.g. king bed, sea view)"
            />
            <Input
              value={mustHaveValue}
              onChange={(event) =>
                setPreferences((prev) => ({ ...prev, must_have: parseTags(event.target.value) }))
              }
              placeholder="Must-have experiences (comma separated)"
            />
            <Input
              value={avoidValue}
              onChange={(event) =>
                setPreferences((prev) => ({ ...prev, avoid: parseTags(event.target.value) }))
              }
              placeholder="Avoid experiences (comma separated)"
            />
            <Textarea
              value={preferences.notes || ""}
              onChange={(event) => setPreferences((prev) => ({ ...prev, notes: event.target.value || undefined }))}
              placeholder="Extra notes for customization"
              className="min-h-[90px]"
            />
            <Button onClick={handleSavePreferences} disabled={isSubmitting} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </Button>

            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div className="flex gap-2">
                <Input
                  value={wishlistInput}
                  onChange={(event) => setWishlistInput(event.target.value)}
                  placeholder="Add wish list item (activity, hotel, meal)"
                />
                <Button onClick={handleAddWishlist} disabled={isSubmitting || !wishlistInput.trim()}>
                  <Heart className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>

              <div className="space-y-2 max-h-40 overflow-auto pr-1">
                {wishlistItems.length === 0 ? (
                  <p className="text-sm text-gray-400">No wish list items yet.</p>
                ) : (
                  wishlistItems.map((item) => (
                    <div key={item} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                      <span className="text-sm text-gray-700">{item}</span>
                      <button
                        type="button"
                        onClick={() => void handleRemoveWishlist(item)}
                        className="text-gray-400 hover:text-red-500"
                        aria-label={`Remove ${item}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
