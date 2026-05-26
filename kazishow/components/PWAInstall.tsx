"use client";
import { useEffect, useState } from "react";

export default function PWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<Event & { prompt: () => Promise<{ outcome: string }> } | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => {});
    }

    // Already installed as standalone
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    const dismissed = localStorage.getItem("pwa_dismissed");

    // Android / Desktop — listen for native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as Event & { prompt: () => Promise<{ outcome: string }> });
      if (!dismissed) {
        setTimeout(() => setShowBanner(true), 3000);
      }
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS — show manual instructions banner
    if (isIOSDevice && !dismissed) {
      setTimeout(() => setShowBanner(true), 5000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    const result = await installPrompt.prompt();
    if (result.outcome === "accepted") {
      setShowBanner(false);
      setIsInstalled(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa_dismissed", "true");
  };

  if (!showBanner || isInstalled) return null;

  // iOS — manual instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[9998] bg-kazi-dark border-t border-kazi-orange/30 p-4 shadow-2xl">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/40 text-lg leading-none"
          aria-label="Dismiss"
        >
          ✕
        </button>
        <div className="flex items-start gap-3 max-w-lg mx-auto">
          <div className="w-12 h-12 bg-kazi-orange rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-xl">K</span>
          </div>
          <div>
            <p className="text-white font-black text-sm">Install KaziShow App</p>
            <p className="text-white/60 text-xs mt-1">
              Tap the share button{" "}
              <span className="mx-1 text-white">⬆</span>
              then tap{" "}
              <strong className="text-white">"Add to Home Screen"</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Android / Desktop — native install banner
  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9998] max-w-sm mx-auto">
      <div className="bg-kazi-dark border border-kazi-orange/30 rounded-2xl p-4 shadow-2xl relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/40 text-sm leading-none"
          aria-label="Dismiss"
        >
          ✕
        </button>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-kazi-orange rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-xl">K</span>
          </div>
          <div>
            <p className="text-white font-black text-sm">Install KaziShow</p>
            <p className="text-white/50 text-xs">Add to your home screen</p>
          </div>
        </div>
        <p className="text-white/60 text-xs mb-3">
          Get instant access to find verified service providers in Nairobi!
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2 bg-white/10 text-white/60 font-bold rounded-xl text-xs hover:bg-white/15 transition-colors"
          >
            Not Now
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 py-2 bg-kazi-orange text-white font-black rounded-xl text-xs hover:bg-orange-600 transition-colors"
          >
            📲 Install App
          </button>
        </div>
      </div>
    </div>
  );
}
