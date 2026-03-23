export default function PaymentLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center animate-pulse">
            <div className="w-full max-w-md space-y-6 px-4">
                <div className="text-center space-y-3">
                    <div className="h-10 w-10 bg-gray-200 dark:bg-slate-800 rounded-full mx-auto" />
                    <div className="h-6 w-40 bg-gray-200 dark:bg-slate-800 rounded-lg mx-auto" />
                </div>
                <div className="h-72 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl" />
                <div className="h-12 bg-gray-200 dark:bg-slate-800 rounded-xl" />
            </div>
        </div>
    );
}
