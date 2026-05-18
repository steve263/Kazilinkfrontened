"use client";
import { useState, useEffect, useRef } from "react";
import {
  Search, User, Briefcase, ShoppingBag, X,
  BarChart2, ClipboardCheck, CheckSquare, Users, Activity,
  Wallet, DollarSign, Shield, Scale, LayoutDashboard, XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ── All admin pages with keywords for instant client-side matching ─────────────
const PAGES = [
  { label: "Overview",      href: "/admin",              icon: LayoutDashboard, keywords: ["overview", "dashboard", "home", "stats", "summary"] },
  { label: "Approvals",     href: "/admin/approvals",    icon: ClipboardCheck,  keywords: ["approval", "approvals", "approve", "pending", "verify", "review"] },
  { label: "Providers",     href: "/admin/providers",    icon: CheckSquare,     keywords: ["provider", "providers", "business", "fundi", "verified", "verification"] },
  { label: "Users",         href: "/admin/users",        icon: Users,           keywords: ["user", "users", "customer", "customers", "account", "accounts"] },
  { label: "Bookings",      href: "/admin/bookings",     icon: ShoppingBag,     keywords: ["booking", "bookings", "order", "orders", "dispute", "disputed"] },
  { label: "Analytics",     href: "/admin/analytics",    icon: Activity,        keywords: ["analytics", "analytic", "revenue", "report", "reports", "chart", "graph"] },
  { label: "Withdrawals",   href: "/admin/withdrawals",  icon: Wallet,          keywords: ["withdrawal", "withdrawals", "withdraw", "cash", "payout", "pay out"] },
  { label: "Payouts",       href: "/admin/payouts",      icon: DollarSign,      keywords: ["payout", "payouts", "pay", "mpesa", "b2c", "send money"] },
  { label: "Trust & Safety",  href: "/admin/trust",          icon: Shield,    keywords: ["trust", "safety", "safe", "report", "reports", "fraud", "ban", "suspend"] },
  { label: "Appeals",         href: "/admin/appeals",        icon: Scale,     keywords: ["appeal", "appeals", "reinstate", "unsuspend", "review"] },
  { label: "Cancellations",   href: "/admin/cancellations",  icon: XCircle,   keywords: ["cancellation", "cancellations", "cancel", "cancelled", "refund", "refunds"] },
];

const PAGE_COLORS: Record<string, string> = {
  "/admin":              "bg-orange-100 text-kazi-orange",
  "/admin/approvals":    "bg-amber-100 text-amber-600",
  "/admin/providers":    "bg-orange-100 text-orange-600",
  "/admin/users":        "bg-blue-100 text-blue-600",
  "/admin/bookings":     "bg-purple-100 text-purple-600",
  "/admin/analytics":    "bg-green-100 text-green-600",
  "/admin/withdrawals":  "bg-teal-100 text-teal-600",
  "/admin/payouts":      "bg-emerald-100 text-emerald-600",
  "/admin/trust":          "bg-red-100 text-red-600",
  "/admin/appeals":        "bg-indigo-100 text-indigo-600",
  "/admin/cancellations":  "bg-rose-100 text-rose-600",
};

const STATUS_COLOR: Record<string, string> = {
  COMPLETED:   "text-green-600",
  CANCELLED:   "text-gray-400",
  DISPUTED:    "text-red-500",
  ACCEPTED:    "text-blue-600",
  PENDING:     "text-amber-500",
  IN_PROGRESS: "text-purple-600",
  DECLINED:    "text-red-400",
};

interface SearchResults {
  users: any[];
  providers: any[];
  bookings: any[];
}

function matchPages(q: string) {
  const term = q.toLowerCase().trim();
  if (!term) return [];
  return PAGES.filter(
    (p) =>
      p.label.toLowerCase().includes(term) ||
      p.keywords.some((k) => k.includes(term))
  );
}

export default function AdminSearchBar({ token }: { token: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [pageMatches, setPageMatches] = useState<typeof PAGES>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q || q.length < 1) {
      setResults(null);
      setPageMatches([]);
      setOpen(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    // Instant client-side page match (no debounce)
    const pages = matchPages(q);
    setPageMatches(pages);
    if (pages.length > 0) setOpen(true);

    // Debounced API search for data records
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) return;

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/admin/search?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setResults(data.data);
          setOpen(true);
        }
      } catch {}
      setLoading(false);
    }, 350);
  }, [query, token]);

  const dataTotal = results
    ? results.users.length + results.providers.length + results.bookings.length
    : 0;
  const hasAny = pageMatches.length > 0 || dataTotal > 0;

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    setResults(null);
    setPageMatches([]);
    router.push(href);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-xl px-3 py-2.5">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (hasAny) setOpen(true); }}
          placeholder="Search pages, users, providers, bookings…"
          className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none min-w-0"
        />
        {loading && (
          <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin shrink-0" />
        )}
        {query && !loading && (
          <button onClick={() => { setQuery(""); setResults(null); setPageMatches([]); setOpen(false); }}>
            <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden max-h-[460px] overflow-y-auto">
          {!hasAny ? (
            <div className="p-5 text-center text-sm text-gray-400">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <>
              {/* ── Pages ── */}
              {pageMatches.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                    <BarChart2 className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-black text-gray-400 uppercase tracking-wide">Pages</span>
                  </div>
                  {pageMatches.map((page) => {
                    const Icon = page.icon;
                    const colorCls = PAGE_COLORS[page.href] || "bg-gray-100 text-gray-600";
                    return (
                      <button
                        key={page.href}
                        onClick={() => go(page.href)}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                      >
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${colorCls}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-800">{page.label}</p>
                          <p className="text-xs text-gray-400">admin{page.href.replace("/admin", "") || " dashboard"}</p>
                        </div>
                        <span className="text-xs text-gray-300">→</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── Users ── */}
              {results && results.users.length > 0 && (
                <div className={pageMatches.length > 0 ? "border-t border-gray-100" : ""}>
                  <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-black text-gray-400 uppercase tracking-wide">Users</span>
                  </div>
                  {results.users.map((u) => (
                    <button key={u.id} onClick={() => go("/admin/users")}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                        {u.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">{u.name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email || u.phone}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        u.role === "ADMIN" ? "bg-purple-100 text-purple-600"
                        : u.role === "PROVIDER" ? "bg-orange-100 text-orange-600"
                        : "bg-blue-100 text-blue-600"
                      }`}>{u.role}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* ── Providers ── */}
              {results && results.providers.length > 0 && (
                <div className={(pageMatches.length > 0 || (results.users.length > 0)) ? "border-t border-gray-100" : ""}>
                  <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-xs font-black text-gray-400 uppercase tracking-wide">Providers</span>
                  </div>
                  {results.providers.map((p) => (
                    <button key={p.id} onClick={() => go("/admin/providers")}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs shrink-0">
                        {p.businessName?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">{p.businessName}</p>
                        <p className="text-xs text-gray-400">{p.category}</p>
                      </div>
                      {p.isVerified && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-600 shrink-0">Verified</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Bookings ── */}
              {results && results.bookings.length > 0 && (
                <div className={(pageMatches.length > 0 || dataTotal > results.bookings.length) ? "border-t border-gray-100" : ""}>
                  <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5 text-purple-500" />
                    <span className="text-xs font-black text-gray-400 uppercase tracking-wide">Bookings</span>
                  </div>
                  {results.bookings.map((b) => (
                    <button key={b.id} onClick={() => go("/admin/bookings")}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                        <ShoppingBag className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {b.customer?.name} → {b.provider?.businessName}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{b.service?.name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-xs font-bold ${STATUS_COLOR[b.status] || "text-gray-500"}`}>{b.status}</p>
                        <p className="text-xs text-gray-400">KSh {b.totalAmount?.toLocaleString()}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
