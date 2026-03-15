export default function BookingsLoading() {
    return (
        <div className="w-full space-y-6 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-8 w-40 bg-gray-200 dark:bg-slate-800 rounded-lg" />
                    <div className="h-4 w-28 bg-gray-100 dark:bg-slate-800/50 rounded" />
                </div>
                <div className="h-10 w-36 bg-gray-200 dark:bg-slate-800 rounded-xl" />
            </div>
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-20 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-slate-800 shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-5 w-48 bg-gray-200 dark:bg-slate-800 rounded" />
                            <div className="h-3 w-32 bg-gray-100 dark:bg-slate-800/50 rounded" />
                        </div>
                        <div className="h-7 w-20 bg-gray-100 dark:bg-slate-800 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}
