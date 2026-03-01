"use client";

import { useCallback, useEffect, useState } from "react";
import { Image as ImageIcon, Phone, Upload, Trash2, CheckCircle2, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface MediaItem {
    id: string;
    file_path: string;
    source: string;
    source_contact_phone: string | null;
    caption: string | null;
    created_at: string;
    publicUrl: string;
}

interface Props {
    onSelectImage: (url: string) => void;
}

type MediaTab = "all" | "whatsapp" | "uploads";

export const MediaLibrary = ({ onSelectImage }: Props) => {
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<MediaTab>("all");
    const [uploading, setUploading] = useState(false);

    const fetchMedia = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("social_media_library")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            const itemsWithUrl = await Promise.all((data || []).map(async (item) => {
                const { data: { publicUrl } } = supabase.storage
                    .from("social-media")
                    .getPublicUrl(item.file_path);
                return { ...item, publicUrl };
            }));

            setMediaItems(itemsWithUrl);
        } catch (error) {
            console.error("Error fetching media:", error);
            toast.error("Failed to load media library");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMedia();
    }, [fetchMedia]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const supabase = createClient();
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) throw new Error("Not authenticated");

            const { data: profile } = await supabase
                .from("profiles")
                .select("organization_id")
                .eq("id", userData.user.id)
                .single();

            if (!profile?.organization_id) throw new Error("No organization found");

            const fileName = `${Date.now()}-${file.name}`;
            const filePath = `${profile.organization_id}/uploads/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("social-media")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { error: dbError } = await supabase
                .from("social_media_library")
                .insert({
                    organization_id: profile.organization_id,
                    file_path: filePath,
                    source: "upload",
                    mime_type: file.type,
                    caption: file.name || ""
                });

            if (dbError) throw dbError;

            toast.success("Image uploaded successfully");
            fetchMedia();
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    const deleteMedia = async (id: string, filePath: string) => {
        try {
            const supabase = createClient();
            const { error: storageError } = await supabase.storage
                .from("social-media")
                .remove([filePath]);

            if (storageError) throw storageError;

            const { error: dbError } = await supabase
                .from("social_media_library")
                .delete()
                .eq("id", id);

            if (dbError) throw dbError;

            setMediaItems(prev => prev.filter(item => item.id !== id));
            toast.success("Image deleted");
        } catch {
            toast.error("Failed to delete image");
        }
    };

    const filteredItems = mediaItems.filter(item => {
        if (activeTab === "all") return true;
        if (activeTab === "whatsapp") return item.source === "whatsapp";
        if (activeTab === "uploads") return item.source === "upload";
        return true;
    });
    const tabs: Array<{ id: MediaTab; label: string }> = [
        { id: "all", label: "All Assets" },
        { id: "whatsapp", label: "WhatsApp Photos" },
        { id: "uploads", label: "Direct Uploads" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        <ImageIcon className="w-6 h-6 text-blue-500" /> Media Library
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Manage your marketing assets and WhatsApp photos.</p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="file"
                        id="media-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleUpload}
                        disabled={uploading}
                    />
                    <Button
                        variant="outline"
                        onClick={() => document.getElementById("media-upload")?.click()}
                        disabled={uploading}
                        className="bg-white dark:bg-slate-800"
                    >
                        {uploading ? "Uploading..." : <><Upload className="w-4 h-4 mr-2" /> Upload Image</>}
                    </Button>
                </div>
            </div>

            <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id
                            ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                    <p className="font-medium">Loading your library...</p>
                </div>
            ) : filteredItems.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredItems.map((item) => (
                        <div key={item.id} className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
                            <img
                                src={item.publicUrl}
                                alt={item.caption || "Media"}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />

                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4 text-center">
                                <Button
                                    size="sm"
                                    className="bg-white text-black hover:bg-slate-100 font-bold w-full"
                                    onClick={() => {
                                        onSelectImage(item.publicUrl);
                                        toast.success("Image selected for template");
                                    }}
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Use Image
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="w-full font-bold"
                                    onClick={() => deleteMedia(item.id, item.file_path)}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </Button>
                            </div>

                            {item.source === "whatsapp" && (
                                <div className="absolute top-2 left-2 bg-green-500 text-white p-1.5 rounded-lg shadow-lg">
                                    <Phone className="w-3.5 h-3.5" />
                                </div>
                            )}

                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                                <div className="flex items-center gap-1.5 text-white/90">
                                    {item.source === "whatsapp" ? (
                                        <div className="flex items-center gap-1 overflow-hidden">
                                            <User className="w-3 h-3 shrink-0" />
                                            <span className="text-[10px] font-bold truncate">{item.source_contact_phone}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 overflow-hidden">
                                            <Calendar className="w-3 h-3 shrink-0" />
                                            <span className="text-[10px] font-bold truncate">{new Date(item.created_at).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700 shadow-sm animate-fade-in-up">
                    <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border border-blue-100">
                        <ImageIcon className="w-10 h-10 text-blue-500" strokeWidth={1.5} />
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 tracking-tight">Your library is empty</p>
                    <p className="text-slate-500 mt-3 max-w-sm mx-auto text-lg leading-relaxed font-medium">Upload photos or receive them from customers via WhatsApp to see them here.</p>
                </div>
            )}
        </div>
    );
};
