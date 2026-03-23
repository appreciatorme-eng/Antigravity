export default function PortalLoading() {
    return (
        <div className="w-full space-y-8 animate-pulse max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gray-200 dark:bg-slate-800 rounded-xl" />
                <div className="space-y-2">
                    <div className="h-6 w-48 bg-gray-200 dark:bg-slate-800 rounded-lg" />
                    <div className="h-4 w-32 bg-gray-100 dark:bg-slate-800/50 rounded" />
                </div>
            </div>
            <div className="h-64 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-48 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl" />
                <div className="h-48 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl" />
            </div>
        </div>
    );
}
