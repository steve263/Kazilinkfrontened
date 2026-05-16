"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, MessageSquare, User, CalendarCheck, ClipboardList, Wallet } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function BottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("kazishow_user");
      if (stored) {
        const u = JSON.parse(stored);
        setUserRole(u.role || null);
      }
    } catch {}
  }, [pathname]);

  useEffect(() => {
    const token = localStorage.getItem("kazishow_token");
    if (!token) return;
    fetch(`${API_URL}/api/messages/unread/count`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setUnreadCount(d.data.count); })
      .catch(() => {});
  }, [pathname]);

  // Build nav items based on role
  const navItems = userRole === "PROVIDER"
    ? [
        { href: "/", icon: Home, label: "Home" },
        { href: "/provider/notifications", icon: ClipboardList, label: "Jobs" },
        { href: "/provider/earnings", icon: Wallet, label: "Wallet" },
        { href: "/chat", icon: MessageSquare, label: "Chat" },
        { href: "/profile", icon: User, label: "Profile" },
      ]
    : [
        { href: "/", icon: Home, label: "Home" },
        { href: "/discover", icon: Compass, label: "Discover" },
        { href: "/booking", icon: CalendarCheck, label: "Bookings" },
        { href: "/chat", icon: MessageSquare, label: "Chat" },
        { href: userRole ? "/profile" : "/auth/login", icon: User, label: userRole ? "Profile" : "Login" },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 bottom-safe md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={label}
              href={href}
              className={`relative flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                active ? "text-kazi-orange" : "text-gray-400"
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${active ? "bg-orange-50" : ""}`}>
                <Icon
                  className="w-5 h-5"
                  fill={active ? "#FF6B2B" : "none"}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                {label === "Chat" && unreadCount > 0 && (
                  <span className="absolute top-0 right-0 min-w-[15px] h-[15px] bg-kazi-orange rounded-full flex items-center justify-center px-0.5">
                    <span className="text-white text-[8px] font-bold leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  </span>
                )}
              </div>
              <span className={`text-xs font-medium ${active ? "text-kazi-orange" : "text-gray-400"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
