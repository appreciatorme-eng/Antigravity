export default function ShareLoading() {
    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 animate-pulse px-4 py-8">
            <div className="h-64 bg-gray-100 dark:bg-slate-900 rounded-3xl" />
            <div className="space-y-3">
                <div className="h-8 w-72 bg-gray-200 dark:bg-slate-800 rounded-lg" />
                <div className="h-4 w-48 bg-gray-100 dark:bg-slate-800/50 rounded" />
            </div>
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-48 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl" />
                ))}
            </div>
        </div>
    );
}
