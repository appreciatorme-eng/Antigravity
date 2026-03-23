export default function SettingsLoading() {
    return (
        <div className="space-y-6">
            {/* Header skeleton */}
            <div className="space-y-2">
                <div className="h-8 w-40 bg-white/5 rounded-xl animate-pulse" />
                <div className="h-4 w-64 bg-white/5 rounded-lg animate-pulse" />
            </div>
            {/* Tab bar skeleton */}
            <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-10 w-24 bg-white/5 rounded-lg animate-pulse"
                    />
                ))}
            </div>
            {/* Form skeleton */}
            <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-16 bg-white/5 border border-white/10 rounded-xl animate-pulse"
                    />
                ))}
            </div>
        </div>
    );
}
