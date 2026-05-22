'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import CommissionAlert from './CommissionAlert';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const POLL_INTERVAL_MS = 60_000; // re-check every 60s so popup appears shortly after job completion

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
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [total, setTotal] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isProvider, setIsProvider] = useState(false);
  const [checked, setChecked] = useState(false);
  const tokenRef = useRef<string | null>(null);

  const fetchCommissions = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API}/api/bookings/my-commissions`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { return; }
      if (data.success) {
        // Only show popup for PENDING/OVERDUE — not PENDING_VERIFICATION (already submitted)
        const actionable = (data.data.commissions as Commission[]).filter(
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

  // Poll every 60s so the popup appears shortly after a job is marked COMPLETED
  useEffect(() => {
    if (!isProvider) return;
    const id = setInterval(() => {
      const token = tokenRef.current || localStorage.getItem('kazishow_token');
      if (token) fetchCommissions(token);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isProvider, fetchCommissions]);

  const handlePaid = useCallback(() => {
    const token = localStorage.getItem('kazishow_token');
    if (token) fetchCommissions(token);
  }, [fetchCommissions]);

  if (!checked || !isProvider || commissions.length === 0) return null;

  return (
    <CommissionAlert
      commissions={commissions}
      total={total}
      isBlocked={isBlocked}
      onPaid={handlePaid}
    />
  );
}
