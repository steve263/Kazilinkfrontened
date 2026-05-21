'use client';

import { useState, useEffect, useCallback } from 'react';
import CommissionAlert from './CommissionAlert';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Commission {
  id: string;
  bookingId: string;
  amount: number;
  status: 'PENDING' | 'OVERDUE';
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
        setCommissions(data.data.commissions);
        setTotal(data.data.total);
        setIsBlocked(data.data.isBlocked);
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
      if (user?.role === 'PROVIDER') {
        setIsProvider(true);
        fetchCommissions(token);
      } else {
        setChecked(true);
      }
    } catch {
      setChecked(true);
    }
  }, [fetchCommissions]);

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
