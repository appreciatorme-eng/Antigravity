export default function TasksLoading() {
    return (
        <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-8 w-36 bg-white/5 rounded-xl animate-pulse" />
                    <div className="h-4 w-56 bg-white/5 rounded-lg animate-pulse" />
                </div>
                <div className="flex gap-2">
                    <div className="h-10 w-20 bg-white/5 rounded-lg animate-pulse" />
                    <div className="h-10 w-20 bg-white/5 rounded-lg animate-pulse" />
                </div>
            </div>
            {/* Task cards skeleton */}
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-24 bg-white/5 border border-white/10 rounded-2xl animate-pulse"
                    />
                ))}
            </div>
        </div>
    );
}
