import Link from "next/link";
import { WifiOff, Plane } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-16 bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-lg w-full rounded-3xl border border-slate-200 bg-white/90 shadow-xl p-8 text-center space-y-5">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
          <WifiOff className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900">You are offline</h1>
        <p className="text-slate-600">
          Cached itinerary pages remain available, but live APIs require internet access.
        </p>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-700 transition-colors"
          >
            <Plane className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
