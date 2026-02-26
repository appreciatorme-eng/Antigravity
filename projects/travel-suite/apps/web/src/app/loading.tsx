export default function GlobalLoading() {
    return (
        <div className="w-full h-full space-y-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-gray-200 dark:bg-slate-800 rounded-lg" />
                    <div className="h-4 w-32 bg-gray-100 dark:bg-slate-800/50 rounded" />
                </div>
                <div className="h-10 w-32 bg-gray-200 dark:bg-slate-800 rounded-xl" />
            </div>

            {/* KPI Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-slate-800" />
                            <div className="w-16 h-6 rounded-lg bg-gray-100 dark:bg-slate-800" />
                        </div>
                        <div className="h-8 w-24 bg-gray-200 dark:bg-slate-800 rounded" />
                    </div>
                ))}
            </div>

            {/* Main Content Area Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="h-[400px] bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8" />
                </div>
                <div className="space-y-6">
                    <div className="h-[200px] bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6" />
                    <div className="h-[300px] bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6" />
                </div>
            </div>
        </div>
    );
}
