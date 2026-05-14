"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Menu,
  X,
  MapPin,
  ChevronDown,
  Zap,
  LogOut,
  User,
  MessageSquare,
} from "lucide-react";
import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  // Read user from localStorage only when loggedInUser is null (post-login redirect).
  // If a user is already in state, don't overwrite from localStorage — this prevents
  // cross-tab pollution where another tab's login overwrites this tab's session.
  useEffect(() => {
    setLoggedInUser((current: any) => {
      if (current) return current;
      const stored = localStorage.getItem("kazishow_user");
      if (!stored) return null;
      try { return JSON.parse(stored); } catch { return null; }
    });
  }, [pathname]);

  // Sync with other tabs: listen for storage events caused by login/logout elsewhere
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== "kazishow_user") return;
      if (e.newValue) {
        try { setLoggedInUser(JSON.parse(e.newValue)); } catch {}
      } else {
        setLoggedInUser(null);
        setUnreadCount(0);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Real-time unread badge — only reconnect socket when the logged-in user actually changes,
  // NOT on every page navigation (prevents socket collision when switching accounts).
  useEffect(() => {
    if (!loggedInUser) {
      setUnreadCount(0);
      setUnreadNotifCount(0);
      return;
    }
    const token = localStorage.getItem("kazishow_token");
    if (!token) return;

    const fetchUnread = async () => {
      try {
        const res = await fetch(`${API_URL}/api/messages/unread/count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setUnreadCount(data.data.count);
      } catch {}
    };

    const fetchNotifUnread = async () => {
      try {
        const res = await fetch(`${API_URL}/api/notifications/unread/count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setUnreadNotifCount(data.data.count);
      } catch {}
    };

    fetchUnread();
    fetchNotifUnread();

    if (socketRef.current) socketRef.current.disconnect();
    const socket = io(API_URL, { transports: ["websocket"] });
    socketRef.current = socket;
    socket.on("connect", () => socket.emit("join", loggedInUser.id));
    socket.on("new_message", (msg: any) => {
      if (msg.receiverId === loggedInUser.id) setUnreadCount((c) => c + 1);
    });
    socket.on("message_read", () => fetchUnread());
    socket.on("new_notification", () => setUnreadNotifCount((c) => c + 1));

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [loggedInUser?.id]); // only re-run when the user identity changes

  // Clear notification badge when the user visits the notifications page
  useEffect(() => {
    if (pathname === "/notifications" && loggedInUser) {
      setUnreadNotifCount(0);
    }
  }, [pathname, loggedInUser]);

  // Sync bell badge when notifications page marks read / deletes
  useEffect(() => {
    const handleAllRead = () => setUnreadNotifCount(0);
    const handleDecrement = () => setUnreadNotifCount((c) => Math.max(0, c - 1));
    window.addEventListener("notif_mark_all_read", handleAllRead);
    window.addEventListener("notif_decrement_unread", handleDecrement);
    return () => {
      window.removeEventListener("notif_mark_all_read", handleAllRead);
      window.removeEventListener("notif_decrement_unread", handleDecrement);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("kazishow_token");
    localStorage.removeItem("kazishow_user");
    setLoggedInUser(null);
    setUserDropdownOpen(false);
    router.push("/auth/login");
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/discover", label: "Discover" },
    { href: "/feed", label: "Feed" },
    { href: "/videos", label: "🎬 ShowReel" },
    { href: "/about", label: "About" },
    { href: "/tips", label: "Tips & Guides" },
    { href: "/deals", label: "🔥 Deals" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-kazi-orange flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="text-xl font-black text-kazi-dark tracking-tight">
              Kazi<span className="text-kazi-orange">Show</span>
            </span>
          </Link>

          {/* Location pill (desktop) */}
          <div className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-kazi-cream rounded-full cursor-pointer hover:bg-orange-50 transition-colors border border-orange-100">
            <MapPin className="w-3.5 h-3.5 text-kazi-orange" />
            <span className="text-xs font-medium text-kazi-dark">
              Nairobi, Kenya
            </span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === link.href
                    ? "bg-kazi-orange text-white"
                    : "text-gray-600 hover:text-kazi-orange hover:bg-orange-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-kazi-orange"
            >
              <Search className="w-5 h-5" />
            </button>
            <Link
              href="/notifications"
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-kazi-orange"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-kazi-orange rounded-full flex items-center justify-center px-0.5">
                  <span className="text-white text-[9px] font-bold leading-none">
                    {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                  </span>
                </span>
              )}
            </Link>
            <Link
              href="/chat"
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-kazi-orange"
            >
              <MessageSquare className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-kazi-orange rounded-full flex items-center justify-center px-0.5">
                  <span className="text-white text-[9px] font-bold leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                </span>
              )}
            </Link>

            {/* Logged in: avatar + dropdown */}
            {loggedInUser ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-kazi-orange flex items-center justify-center text-white text-xs font-black">
                    {loggedInUser.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-kazi-dark max-w-[100px] truncate">
                    {loggedInUser.name?.split(" ")[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-bold text-kazi-dark truncate">{loggedInUser.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{loggedInUser.role?.toLowerCase()}</p>
                    </div>
                    <Link
                      href="/notifications"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-kazi-orange transition-colors"
                    >
                      <Bell className="w-4 h-4" /> Notifications
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-kazi-orange transition-colors"
                    >
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-kazi-orange rounded-xl hover:bg-orange-600 transition-all active:scale-95"
              >
                Sign In
              </Link>
            )}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {menuOpen ? (
                <X className="w-5 h-5 text-kazi-dark" />
              ) : (
                <Menu className="w-5 h-5 text-kazi-dark" />
              )}
            </button>
          </div>
        </div>

        {/* Search bar dropdown */}
        {searchOpen && (
          <div className="py-3 pb-4 animate-slide-up">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = searchQuery.trim();
                setSearchOpen(false);
                setSearchQuery("");
                router.push(q ? `/discover?q=${encodeURIComponent(q)}` : "/discover");
              }}
              className="relative flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search businesses, services, locations..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-kazi-orange focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-3 bg-kazi-orange text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        )}

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-3 pb-4 border-t border-gray-100 space-y-1 animate-slide-up">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  pathname === link.href
                    ? "bg-kazi-orange text-white"
                    : "text-gray-700 hover:bg-orange-50 hover:text-kazi-orange"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100 mt-2">
              {loggedInUser ? (
                <>
                  <div className="px-4 py-2 mb-1">
                    <p className="text-xs font-bold text-kazi-dark">{loggedInUser.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{loggedInUser.role?.toLowerCase()}</p>
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMenuOpen(false)}
                  className="block text-center px-4 py-2.5 text-sm font-semibold text-white bg-kazi-orange rounded-xl hover:bg-orange-600 transition-all"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
