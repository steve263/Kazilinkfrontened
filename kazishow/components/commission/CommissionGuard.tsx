'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import CommissionAlert from './CommissionAlert';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const POLL_INTERVAL_MS = 60_000;
const GRACE_PERIOD_MS = 10 * 60 * 1000; // 10 minutes after job completion

interface Commission {
  id: string;
  bookingId: string;
  amount: number;
  status: 'PENDING' | 'OVERDUE' | 'PENDING_VERIFICATION';
  dueAt: string;
  createdAt: string;
  booking: {
    service?: { name: string };
    totalAmount: number;
  };
}

export default function CommissionGuard() {
  const pathname = usePathname();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [total, setTotal] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isProvider, setIsProvider] = useState(false);
  const [checked, setChecked] = useState(false);
  const [graceUntil, setGraceUntil] = useState<number>(0);
  const tokenRef = useRef<string | null>(null);

  const fetchCommissions = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API}/api/bookings/commission/outstanding`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { return; }
      if (data.success && Array.isArray(data.data)) {
        const actionable = (data.data as Commission[]).filter(
          (c) => c.status === 'PENDING' || c.status === 'OVERDUE'
        );
        setCommissions(actionable);
        setTotal(actionable.reduce((s, c) => s + c.amount, 0));
        setIsBlocked(actionable.some((c) => c.status === 'OVERDUE'));
      }
    } catch {
      // Silently fail — don't block provider if API is down
    } finally {
      setChecked(true);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('kazishow_token');
    const raw = localStorage.getItem('kazishow_user');
    if (!token || !raw) { setChecked(true); return; }

    try {
      const user = JSON.parse(raw);
      if (user?.role === 'PROVIDER' && user?.provider?.category === 'FUNDI') {
        setIsProvider(true);
        tokenRef.current = token;
        fetchCommissions(token);
      } else {
        setChecked(true);
      }
    } catch {
      setChecked(true);
    }
  }, [fetchCommissions]);

  // Poll every 60s so commission data stays fresh
  useEffect(() => {
    if (!isProvider) return;
    const id = setInterval(() => {
      const token = tokenRef.current || localStorage.getItem('kazishow_token');
      if (token) fetchCommissions(token);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isProvider, fetchCommissions]);

  // On job completion: fetch immediately + start 10-min grace period before showing popup
  useEffect(() => {
    if (!isProvider) return;
    const handler = () => {
      const token = tokenRef.current || localStorage.getItem('kazishow_token');
      if (token) fetchCommissions(token);
      setGraceUntil(Date.now() + GRACE_PERIOD_MS);
    };
    window.addEventListener('commission:refresh', handler);
    return () => window.removeEventListener('commission:refresh', handler);
  }, [isProvider, fetchCommissions]);

  // When grace period expires: clear it + fetch fresh data to trigger popup if unpaid
  useEffect(() => {
    if (graceUntil === 0) return;
    const remaining = graceUntil - Date.now();
    if (remaining <= 0) { setGraceUntil(0); return; }
    const id = setTimeout(() => {
      setGraceUntil(0);
      const token = tokenRef.current || localStorage.getItem('kazishow_token');
      if (token) fetchCommissions(token);
    }, remaining);
    return () => clearTimeout(id);
  }, [graceUntil, fetchCommissions]);

  const handlePaid = useCallback(() => {
    const token = localStorage.getItem('kazishow_token');
    if (token) fetchCommissions(token);
  }, [fetchCommissions]);

  // Hide popup on commission page (so fundi can access it to pay)
  const isOnCommissionPage = pathname?.startsWith('/provider/commission');
  const isInGrace = Date.now() < graceUntil;

  if (!checked || !isProvider || commissions.length === 0 || isOnCommissionPage || isInGrace) return null;

  return (
    <CommissionAlert
      commissions={commissions}
      total={total}
      isBlocked={isBlocked}
      onPaid={handlePaid}
    />
  );
}
