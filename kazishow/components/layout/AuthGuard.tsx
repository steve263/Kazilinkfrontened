"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import SuspensionScreen from "@/components/suspension/SuspensionScreen";

const APPEAL_PATHS = ["/appeal", "/appeal/provide-info"];

export default function AuthGuard() {
  const pathname = usePathname();
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

  // Allow suspended users to access appeal pages
  if (suspended && !APPEAL_PATHS.some((p) => pathname?.startsWith(p))) {
    return <SuspensionScreen />;
  }

  return null;
}
