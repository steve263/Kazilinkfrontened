"use client";
import { useEffect } from "react";

export default function AuthGuard() {
  useEffect(() => {
    const token = localStorage.getItem("kazishow_token");
    if (!token) return;

    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    // Verify token is valid against the live backend
    fetch(`${API}/api/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          // Token references a user that doesn't exist in this database
          localStorage.removeItem("kazishow_token");
          localStorage.removeItem("kazishow_user");
          window.location.href = "/auth/login";
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
