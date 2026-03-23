export default function TourTemplatesLoading() {
    return (
        <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-8 w-56 bg-white/5 rounded-xl animate-pulse" />
                    <div className="h-4 w-72 bg-white/5 rounded-lg animate-pulse" />
                </div>
                <div className="h-10 w-36 bg-white/5 rounded-xl animate-pulse" />
            </div>
            {/* Card grid skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-48 bg-white/5 border border-white/10 rounded-2xl animate-pulse"
                    />
                ))}
            </div>
        </div>
    );
}
