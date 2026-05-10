"use client";
import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import SuspensionScreen from "@/components/suspension/SuspensionScreen";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Pages suspended users are allowed to access
const ALLOWED_PATHS = ["/appeal", "/appeal/provide-info", "/auth/login", "/auth/register"];

export default function SuspensionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSuspended, setIsSuspended] = useState(false);
  const [checked, setChecked] = useState(false);

  const checkSuspension = useCallback(async () => {
    const token = localStorage.getItem("kazishow_token");
    const userRaw = localStorage.getItem("kazishow_user");

    // Not logged in — nothing to check
    if (!token || !userRaw) {
      setIsSuspended(false);
      setChecked(true);
      return;
    }

    // Instant check from localStorage so there's no visible flash
    try {
      const cached = JSON.parse(userRaw);
      if (cached.isSuspended) setIsSuspended(true);
    } catch {}

    setChecked(true); // Allow render based on cached value

    // Verify with backend to get authoritative suspension status
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        const suspended = data.data.isSuspended === true;
        setIsSuspended(suspended);
        // Keep localStorage in sync
        localStorage.setItem("kazishow_user", JSON.stringify(data.data));
      } else if (data.code === "ACCOUNT_SUSPENDED") {
        setIsSuspended(true);
        try {
          const u = JSON.parse(userRaw);
          u.isSuspended = true;
          localStorage.setItem("kazishow_user", JSON.stringify(u));
        } catch {}
      }
    } catch {
      // Network error — keep using cached value
    }
  }, []);

  // Check on mount and on every route change
  useEffect(() => {
    checkSuspension();
  }, [pathname, checkSuspension]);

  // Lock body scroll when suspended
  useEffect(() => {
    if (isSuspended) {
      document.body.classList.add("suspended");
    } else {
      document.body.classList.remove("suspended");
    }
    return () => document.body.classList.remove("suspended");
  }, [isSuspended]);

  // Show minimal spinner only on first load (localStorage check is sync so this is very brief)
  if (!checked) {
    return (
      <div className="min-h-screen bg-kazi-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isAllowedPath = ALLOWED_PATHS.some((p) => pathname?.startsWith(p));

  // Complete block — SuspensionScreen is the ONLY thing rendered, no background content
  if (isSuspended && !isAllowedPath) {
    return <SuspensionScreen onUnsuspend={() => setIsSuspended(false)} />;
  }

  return <>{children}</>;
}
