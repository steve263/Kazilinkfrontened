"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useAdminGuard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("kazishow_user");
    if (!raw) { router.replace("/auth/login"); return; }
    try {
      const user = JSON.parse(raw);
      if (user.role !== "ADMIN") { router.replace("/auth/login"); return; }
      setReady(true);
    } catch {
      router.replace("/auth/login");
    }
  }, [router]);

  return ready;
}

export function getAdminToken(): string {
  return localStorage.getItem("kazishow_token") || "";
}
