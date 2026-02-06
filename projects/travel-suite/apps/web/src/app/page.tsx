import Link from "next/link";
import { Plane, MapPin, Calendar, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 py-16 bg-gradient-to-b from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto">
        {/* Logo Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl shadow-lg mb-6">
          <Plane className="w-10 h-10 text-white" />
        </div>

        {/* Main Title */}
        <h1 className="text-5xl md:text-6xl font-serif text-secondary mb-4">
          GoBuddy <span className="text-primary">Adventures</span>
        </h1>

        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Your AI-powered travel companion. Create personalized luxury itineraries in seconds.
        </p>

        {/* CTA Button */}
        <Link href="/planner">
          <button className="px-10 py-4 bg-primary text-white font-bold rounded-full hover:bg-opacity-90 transition-all shadow-lg text-lg inline-flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Start Planning
          </button>
        </Link>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto">
        <div className="text-center p-6 bg-white/60 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-secondary mb-2">Any Destination</h3>
          <p className="text-sm text-gray-500">
            Plan trips to any city in the world with AI-curated recommendations.
          </p>
        </div>

        <div className="text-center p-6 bg-white/60 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-secondary mb-2">Custom Duration</h3>
          <p className="text-sm text-gray-500">
            From weekend getaways to extended adventures, we've got you covered.
          </p>
        </div>

        <div className="text-center p-6 bg-white/60 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-secondary mb-2">AI-Powered</h3>
          <p className="text-sm text-gray-500">
            Personalized itineraries based on your interests and budget.
          </p>
        </div>
      </div>
    </main>
  );
}


