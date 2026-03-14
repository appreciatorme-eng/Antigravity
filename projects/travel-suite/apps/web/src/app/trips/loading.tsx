export default function TripsLoading() {
    return (
        <div className="min-h-screen bg-[#0a1628] p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header skeleton */}
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-white/5 rounded-xl animate-pulse" />
                    <div className="h-4 w-72 bg-white/5 rounded-lg animate-pulse" />
                </div>
                {/* Content skeleton */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-40 bg-white/5 border border-white/10 rounded-2xl animate-pulse"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
