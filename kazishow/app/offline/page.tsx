"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-kazi-dark flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-kazi-orange rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-white text-4xl font-black">K</span>
        </div>

        <h1 className="text-white font-black text-3xl mb-3">You are offline</h1>

        <p className="text-white/60 text-sm mb-8 leading-relaxed">
          KaziShow needs an internet connection to find providers near you.
          Please check your connection and try again.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl text-lg hover:bg-orange-600 transition-colors"
        >
          Try Again
        </button>

        <p className="text-white/30 text-xs mt-6">kazishow.co.ke</p>
      </div>
    </div>
  );
}
