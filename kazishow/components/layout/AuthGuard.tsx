"use client";
import { useEffect } from "react";

// Checks token validity on mount. Suspension is handled by SuspensionGate.
export default function AuthGuard() {
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
