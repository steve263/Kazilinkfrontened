"use client";
import { useEffect, useState } from "react";

export default function AuthGuard() {
  const [suspended, setSuspended] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("kazishow_token");
    if (!token) return;

    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    fetch(`${API}/api/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          if (data.code === "ACCOUNT_SUSPENDED") {
            setSuspended(true);
          } else {
            localStorage.removeItem("kazishow_token");
            localStorage.removeItem("kazishow_user");
            window.location.href = "/auth/login";
          }
        }
      })
      .catch(() => {});
  }, []);

  if (!suspended) return null;

  return (
    <div className="fixed inset-0 bg-[#1A1714] z-[9999] flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-7xl mb-6">🚫</div>
        <h2 className="text-white font-black text-2xl mb-3">Account Suspended</h2>
        <p className="text-white/50 text-sm mb-8 leading-relaxed">
          Your account has been suspended due to violations of our community guidelines.
          Please contact our support team to appeal this decision.
        </p>
        <a
          href="mailto:support@kazishow.co.ke"
          className="block w-full py-4 bg-kazi-orange text-white font-bold rounded-2xl text-center mb-3"
        >
          Appeal Suspension
        </a>
        <button
          onClick={() => {
            localStorage.removeItem("kazishow_token");
            localStorage.removeItem("kazishow_user");
            window.location.href = "/auth/login";
          }}
          className="text-white/40 text-sm"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
