export default function BillingLoading() {
    return (
        <div className="w-full space-y-8 animate-pulse">
            <div className="text-center space-y-3">
                <div className="h-6 w-32 bg-gray-200 dark:bg-slate-800 rounded-full mx-auto" />
                <div className="h-10 w-96 bg-gray-200 dark:bg-slate-800 rounded-lg mx-auto" />
                <div className="h-4 w-64 bg-gray-100 dark:bg-slate-800/50 rounded mx-auto" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                <div className="h-40 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl" />
                <div className="h-40 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-80 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl" />
                ))}
            </div>
        </div>
    );
}
