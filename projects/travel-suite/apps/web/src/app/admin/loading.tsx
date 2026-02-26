export default function AdminLoading() {
    return (
        <div className="w-full h-full space-y-8 animate-pulse">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-4 w-24 bg-primary/10 rounded-full" />
                    <div className="h-10 w-64 bg-gray-200 dark:bg-slate-800 rounded-xl" />
                </div>
                <div className="flex gap-3">
                    <div className="h-10 w-10 bg-gray-100 dark:bg-slate-800 rounded-xl" />
                    <div className="h-10 w-32 bg-primary/20 rounded-xl" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-40 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm" />
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-6">
                    <div className="h-[500px] bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl" />
                </div>
                <div className="space-y-6">
                    <div className="h-[250px] bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl" />
                    <div className="h-[250px] bg-slate-900 dark:bg-slate-800 rounded-2xl" />
                </div>
            </div>
        </div>
    );
}
