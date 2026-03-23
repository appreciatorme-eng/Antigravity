export default function OnboardingLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center animate-pulse">
            <div className="w-full max-w-md space-y-6 px-4">
                <div className="text-center space-y-3">
                    <div className="h-12 w-12 bg-gray-200 dark:bg-slate-800 rounded-xl mx-auto" />
                    <div className="h-8 w-48 bg-gray-200 dark:bg-slate-800 rounded-lg mx-auto" />
                    <div className="h-4 w-64 bg-gray-100 dark:bg-slate-800/50 rounded mx-auto" />
                </div>
                <div className="h-64 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl" />
            </div>
        </div>
    );
}
