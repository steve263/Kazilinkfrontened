"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface AppSettings {
  commissionRate: number;
  cashCommissionRate: number;
  trialDays: number;
  starterPrice: number;
  growthPrice: number;
  premiumPrice: number;
  autoCancelHours: number;
  autoReleaseHours: number;
  cancellationRefundHours: number;
  maxBookingsPerDay: number;
  supportPhone: string;
  supportEmail: string;
  whatsappNumber: string;
  appName: string;
  maintenanceMode: boolean;
  newRegistrationsOpen: boolean;
  currency: string;
}

const DEFAULTS: AppSettings = {
  commissionRate: 10,
  cashCommissionRate: 10,
  trialDays: 14,
  starterPrice: 800,
  growthPrice: 1200,
  premiumPrice: 1500,
  autoCancelHours: 24,
  autoReleaseHours: 24,
  cancellationRefundHours: 2,
  maxBookingsPerDay: 10,
  supportPhone: "0795542312",
  supportEmail: "kazishow0@gmail.com",
  whatsappNumber: "0795542312",
  appName: "KaziShow",
  maintenanceMode: false,
  newRegistrationsOpen: true,
  currency: "KSh",
};

const SettingsContext = createContext<AppSettings>(DEFAULTS);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);

  useEffect(() => {
    fetch(`${API_URL}/api/settings/public`)
      .then((r) => r.text())
      .then((t) => {
        try {
          const d = JSON.parse(t);
          if (d.success && d.data) setSettings((s) => ({ ...s, ...d.data }));
        } catch {}
      })
      .catch(() => {});
  }, []);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
