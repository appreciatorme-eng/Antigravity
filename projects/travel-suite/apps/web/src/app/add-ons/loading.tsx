export default function AddOnsLoading() {
    return (
        <div className="w-full space-y-8 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="h-8 w-48 bg-gray-200 dark:bg-slate-800 rounded-lg" />
                <div className="h-10 w-32 bg-gray-200 dark:bg-slate-800 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-48 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                        <div className="h-6 w-3/4 bg-gray-200 dark:bg-slate-800 rounded" />
                        <div className="h-4 w-full bg-gray-100 dark:bg-slate-800/50 rounded" />
                        <div className="h-4 w-2/3 bg-gray-100 dark:bg-slate-800/50 rounded" />
                        <div className="h-8 w-24 bg-gray-200 dark:bg-slate-800 rounded-lg mt-auto" />
                    </div>
                ))}
            </div>
        </div>
    );
}
