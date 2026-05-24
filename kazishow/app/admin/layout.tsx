"use client";
import { useState, useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("admin_dark_mode");
    if (saved === "true") setDark(true);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("admin_dark_mode", String(next));
  };

  if (!mounted) return null;

  return (
    <div className={dark ? "admin-dark" : ""} style={{ minHeight: "100vh" }}>
      {children}

      {/* Floating dark/light mode toggle — always visible on all admin pages */}
      <button
        onClick={toggle}
        title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        className="fixed bottom-6 left-6 z-[9999] w-12 h-12 rounded-full shadow-xl flex items-center justify-center text-xl transition-all hover:scale-110 active:scale-95"
        style={{
          background: dark ? "#f1f5f9" : "#1e293b",
          color: dark ? "#1e293b" : "#f1f5f9",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        {dark ? "☀️" : "🌙"}
      </button>
    </div>
  );
}
