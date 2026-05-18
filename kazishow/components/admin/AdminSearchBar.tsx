"use client";
import { useState, useEffect, useRef } from "react";
import { Search, User, Briefcase, ShoppingBag, X } from "lucide-react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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

export default function AdminSearchBar({ token }: { token: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
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
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 2) { setResults(null); setOpen(false); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/admin/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) { setResults(data.data); setOpen(true); }
      } catch {}
      setLoading(false);
    }, 350);
  }, [query, token]);

  const total = results ? results.users.length + results.providers.length + results.bookings.length : 0;

  const go = (href: string) => { setOpen(false); setQuery(""); router.push(href); };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-xl px-3 py-2.5">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results && total > 0) setOpen(true); }}
          placeholder="Search users, providers, bookings…"
          className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none min-w-0"
        />
        {loading && <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin shrink-0" />}
        {query && !loading && (
          <button onClick={() => { setQuery(""); setResults(null); setOpen(false); }}>
            <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {open && results && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden max-h-[420px] overflow-y-auto">
          {total === 0 ? (
            <div className="p-5 text-center text-sm text-gray-400">No results for &ldquo;{query}&rdquo;</div>
          ) : (
            <>
              {results.users.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-black text-gray-400 uppercase tracking-wide">Users</span>
                  </div>
                  {results.users.map((u) => (
                    <button key={u.id} onClick={() => go(`/admin/users`)}
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

              {results.providers.length > 0 && (
                <div className={results.users.length > 0 ? "border-t border-gray-50" : ""}>
                  <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-xs font-black text-gray-400 uppercase tracking-wide">Providers</span>
                  </div>
                  {results.providers.map((p) => (
                    <button key={p.id} onClick={() => go(`/admin/providers`)}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs shrink-0">
                        {p.businessName?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">{p.businessName}</p>
                        <p className="text-xs text-gray-400">{p.category}</p>
                      </div>
                      {p.isVerified && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-600 shrink-0">Verified</span>}
                    </button>
                  ))}
                </div>
              )}

              {results.bookings.length > 0 && (
                <div className={(results.users.length > 0 || results.providers.length > 0) ? "border-t border-gray-50" : ""}>
                  <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5 text-purple-500" />
                    <span className="text-xs font-black text-gray-400 uppercase tracking-wide">Bookings</span>
                  </div>
                  {results.bookings.map((b) => (
                    <button key={b.id} onClick={() => go(`/admin/bookings`)}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs shrink-0">
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
