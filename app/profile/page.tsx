"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CustomerProfile from "@/components/profile/CustomerProfile";
import ProviderProfile from "@/components/profile/ProviderProfile";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("kazishow_user");
      const token = localStorage.getItem("kazishow_token");

      if (!stored || !token) {
        router.replace("/auth/login");
        return;
      }

      const parsed = JSON.parse(stored);
      if (parsed.role === "ADMIN") {
        router.replace("/admin");
        return;
      }

      setUser(parsed);
    } catch {
      router.replace("/auth/login");
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-kazi-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-kazi-orange animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (user.role === "PROVIDER") {
    return <ProviderProfile user={user} />;
  }

  return <CustomerProfile user={user} />;
}
