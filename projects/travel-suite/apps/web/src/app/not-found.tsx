import Link from "next/link";
import { Search } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";

export default function NotFound() {
    return (
        <div className="min-h-[calc(100vh-64px)] bg-gradient-app px-4 py-10">
            <div className="mx-auto max-w-xl">
                <GlassCard padding="xl" rounded="2xl" className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                        <Search className="h-6 w-6 text-slate-500 dark:text-slate-400" />
                    </div>
                    <h1 className="text-2xl font-serif text-secondary dark:text-white">Page not found</h1>
                    <p className="mt-2 text-sm text-text-secondary">
                        The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    </p>
                    <div className="mt-6">
                        <Link
                            href="/"
                            className="inline-flex items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-smooth hover:brightness-110"
                        >
                            Back to home
                        </Link>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
