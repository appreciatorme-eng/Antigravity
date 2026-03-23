export default function ScheduleLoading() {
    return (
        <div className="space-y-6">
            {/* Header skeleton */}
            <div className="space-y-2">
                <div className="h-8 w-44 bg-white/5 rounded-xl animate-pulse" />
                <div className="h-4 w-60 bg-white/5 rounded-lg animate-pulse" />
            </div>
            {/* Calendar skeleton */}
            <div className="h-96 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
        </div>
    );
}
