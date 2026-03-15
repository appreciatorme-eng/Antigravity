export default function AuthLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center animate-pulse">
            <div className="w-full max-w-md space-y-6 p-8 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-xl">
                <div className="space-y-2 text-center">
                    <div className="h-8 w-48 bg-gray-200 dark:bg-slate-800 rounded-lg mx-auto" />
                    <div className="h-4 w-64 bg-gray-100 dark:bg-slate-800/50 rounded mx-auto" />
                </div>
                <div className="space-y-4">
                    <div className="h-12 bg-gray-100 dark:bg-slate-800 rounded-xl" />
                    <div className="h-12 bg-gray-100 dark:bg-slate-800 rounded-xl" />
                    <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded-xl" />
                </div>
            </div>
        </div>
    );
}
