"use client";
import { useEffect } from "react";

function clearAuth() {
  localStorage.removeItem("kazishow_token");
  localStorage.removeItem("kazishow_user");
  localStorage.removeItem("kazishow_remember");
  localStorage.removeItem("kazishow_login_time");
  localStorage.removeItem("kazishow_session_expires");
  sessionStorage.removeItem("kazishow_token");
  sessionStorage.removeItem("kazishow_user");
}

// Checks token validity on mount. Suspension is handled by SuspensionGate.
export default function AuthGuard() {
  useEffect(() => {
    const token = localStorage.getItem("kazishow_token");
    if (!token) return;

    // Enforce expiry: 30 days if remembered, 1 day otherwise
    const loginTime = localStorage.getItem("kazishow_login_time");
    const remember = localStorage.getItem("kazishow_remember");
    if (loginTime) {
      const daysSince = (Date.now() - parseInt(loginTime)) / (1000 * 60 * 60 * 24);
      const maxDays = remember === "true" ? 30 : 1;
      if (daysSince > maxDays) {
        clearAuth();
        return;
      }
    }

    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    fetch(`${API}/api/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        // Token invalid or expired — log out
        if (!data.success && data.code !== "ACCOUNT_SUSPENDED") {
          clearAuth();
          window.location.href = "/auth/login";
        }
        // ACCOUNT_SUSPENDED is handled by SuspensionGate — do nothing here
      })
      .catch(() => {});
  }, []);

  return null;
}
