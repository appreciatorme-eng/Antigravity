export default function MarketplaceLoading() {
    return (
        <div className="w-full space-y-8 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-8 w-44 bg-gray-200 dark:bg-slate-800 rounded-lg" />
                    <div className="h-4 w-64 bg-gray-100 dark:bg-slate-800/50 rounded" />
                </div>
                <div className="flex gap-3">
                    <div className="h-10 w-24 bg-gray-100 dark:bg-slate-800 rounded-xl" />
                    <div className="h-10 w-32 bg-gray-200 dark:bg-slate-800 rounded-xl" />
                </div>
            </div>
            <div className="h-12 bg-gray-100 dark:bg-slate-900 rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                        <div className="h-48 bg-gray-200 dark:bg-slate-800" />
                        <div className="p-5 space-y-3">
                            <div className="h-5 w-3/4 bg-gray-200 dark:bg-slate-800 rounded" />
                            <div className="h-4 w-full bg-gray-100 dark:bg-slate-800/50 rounded" />
                            <div className="h-4 w-2/3 bg-gray-100 dark:bg-slate-800/50 rounded" />
                            <div className="flex items-center justify-between pt-2">
                                <div className="h-6 w-16 bg-gray-200 dark:bg-slate-800 rounded" />
                                <div className="h-8 w-24 bg-gray-200 dark:bg-slate-800 rounded-lg" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
