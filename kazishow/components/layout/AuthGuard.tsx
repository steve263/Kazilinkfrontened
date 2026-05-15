"use client";
import { useEffect } from "react";

// Checks token validity on mount. Suspension is handled by SuspensionGate.
export default function AuthGuard() {
  useEffect(() => {
    // Enforce "Remember me" expiry — clears auth if the 24-hour session window has passed
    const sessionExpires = localStorage.getItem("kazishow_session_expires");
    if (sessionExpires && Date.now() > parseInt(sessionExpires)) {
      localStorage.removeItem("kazishow_token");
      localStorage.removeItem("kazishow_user");
      localStorage.removeItem("kazishow_session_expires");
      return;
    }

    const token = localStorage.getItem("kazishow_token");
    if (!token) return;

    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    fetch(`${API}/api/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        // Token invalid or expired — log out
        if (!data.success && data.code !== "ACCOUNT_SUSPENDED") {
          localStorage.removeItem("kazishow_token");
          localStorage.removeItem("kazishow_user");
          window.location.href = "/auth/login";
        }
        // ACCOUNT_SUSPENDED is handled by SuspensionGate — do nothing here
      })
      .catch(() => {});
  }, []);

  return null;
}
