"use client";

import { useState, useEffect } from "react";
import { Clock, Instagram, Facebook, Trash2, Download, Send, CheckCircle2, XCircle, Loader2, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Post {
    id: string;
    template_id: string;
    caption_instagram: string | null;
    status: string;
    source: string;
    created_at: string;
    rendered_image_url: string | null;
    template_data: any;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    draft:      { label: "Draft",     color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",    icon: FileText },
    ready:      { label: "Ready",     color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",      icon: CheckCircle2 },
    scheduled:  { label: "Scheduled", color: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300",  icon: Clock },
    publishing: { label: "Posting…",  color: "bg-purple-50 text-purple-600",                                         icon: Loader2 },
    published:  { label: "Published", color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300", icon: CheckCircle2 },
    failed:     { label: "Failed",    color: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300",          icon: XCircle },
};

export const PostHistory = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>("all");

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/social/posts");
            const data = await res.json();
            setPosts(data.posts || []);
        } catch {
            toast.error("Failed to load post history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPosts(); }, []);

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const res = await fetch(`/api/social/posts/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            setPosts(prev => prev.filter(p => p.id !== id));
            toast.success("Post deleted");
        } catch {
            toast.error("Failed to delete post");
        } finally {
            setDeletingId(null);
        }
    };

    const filtered = filter === "all" ? posts : posts.filter(p => p.status === filter);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        <Clock className="w-6 h-6 text-indigo-500" /> Post History
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">
                        {posts.length} post{posts.length !== 1 ? "s" : ""} saved
                    </p>
                </div>
                <Button variant="outline" onClick={fetchPosts} className="gap-2 self-start sm:self-auto">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </Button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {["all", "draft", "ready", "scheduled", "published", "failed"].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors capitalize ${
                            filter === f
                                ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                    >
                        {f === "all" ? `All (${posts.length})` : `${f} (${posts.filter(p => p.status === f).length})`}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700">
                    <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-9 h-9 text-indigo-400" strokeWidth={1.5} />
                    </div>
                    <p className="text-xl font-bold text-slate-700 dark:text-slate-200">No posts yet</p>
                    <p className="text-slate-400 mt-2 max-w-xs mx-auto font-medium">
                        Create a design in Marketing Studio and save it as a draft to see it here.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((post, i) => {
                        const cfg = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
                        const StatusIcon = cfg.icon;
                        return (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                            >
                                {/* Image or placeholder */}
                                <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 relative overflow-hidden">
                                    {post.rendered_image_url ? (
                                        <img
                                            src={post.rendered_image_url}
                                            alt="Post preview"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                                            <FileText className="w-10 h-10 mb-2 opacity-40" />
                                            <p className="text-xs font-medium opacity-70">
                                                {post.template_data?.destination || "Draft Post"}
                                            </p>
                                        </div>
                                    )}
                                    {/* Status badge */}
                                    <div className={`absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm ${cfg.color}`}>
                                        <StatusIcon className={`w-3 h-3 ${post.status === 'publishing' ? 'animate-spin' : ''}`} />
                                        {cfg.label}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4 flex-1 flex flex-col gap-3">
                                    <div>
                                        <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                                            {post.template_data?.destination || "Untitled Post"}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {new Date(post.created_at).toLocaleDateString("en-IN", {
                                                day: "2-digit", month: "short", year: "numeric"
                                            })}
                                        </p>
                                    </div>

                                    {post.caption_instagram && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                            {post.caption_instagram}
                                        </p>
                                    )}

                                    {/* Source tags */}
                                    <div className="flex gap-1.5 flex-wrap mt-auto">
                                        {post.source === "ai_generated" && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-900/30">AI</span>
                                        )}
                                        {post.source === "auto_review" && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30">Review</span>
                                        )}
                                        {post.template_data?.price && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30">{post.template_data.price}</span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                                        {post.rendered_image_url && (
                                            <a
                                                href={post.rendered_image_url}
                                                download
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                <Download className="w-3.5 h-3.5" /> Download
                                            </a>
                                        )}
                                        {(post.status === "draft" || post.status === "ready") && (
                                            <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                                                <Send className="w-3.5 h-3.5" /> Publish
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(post.id)}
                                            disabled={deletingId === post.id}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            {deletingId === post.id ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
