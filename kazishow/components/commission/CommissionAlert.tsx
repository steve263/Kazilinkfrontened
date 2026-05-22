'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Clock } from 'lucide-react';

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

interface CommissionAlertProps {
  commissions: Commission[];
  total: number;
  isBlocked: boolean;
  onPaid: () => void;
}

export default function CommissionAlert({ commissions, total, isBlocked }: CommissionAlertProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState<Record<string, number>>({});

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const next: Record<string, number> = {};
      for (const c of commissions) {
        next[c.id] = Math.max(0, Math.floor((new Date(c.dueAt).getTime() - now) / 1000));
      }
      setCountdown(next);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [commissions]);

  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const handlePay = (commission: Commission) => {
    router.push(
      `/provider/commission?bookingId=${commission.bookingId}&amount=${commission.booking.totalAmount}&service=${encodeURIComponent(commission.booking.service?.name || 'Service')}&customer=Customer`
    );
  };

  const handlePayAll = () => {
    router.push('/provider/commission');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white overflow-hidden shadow-2xl">
        {/* Header */}
        <div className={`p-6 text-center ${isBlocked ? 'bg-red-600' : 'bg-orange-500'}`}>
          <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-white" />
          <h1 className="text-2xl font-bold text-white">
            {isBlocked ? 'Account Blocked' : 'Commission Due'}
          </h1>
          <p className="mt-1 text-sm text-white/80">
            {isBlocked
              ? 'Pay your commission immediately to unlock your account'
              : 'Pay KaziShow commission via Paybill 247247'}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Total outstanding */}
          <div className="rounded-xl bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-500">Total Outstanding</p>
            <p className="text-3xl font-bold text-gray-900">KSh {total.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">
              {commissions.length} commission{commissions.length > 1 ? 's' : ''} pending
            </p>
          </div>

          {/* Commission list */}
          <div className="space-y-3 max-h-52 overflow-y-auto">
            {commissions.map((c) => (
              <div
                key={c.id}
                className={`rounded-xl border p-4 ${
                  c.status === 'OVERDUE' ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">
                      {c.booking.service?.name || 'Service'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Job value: KSh {c.booking.totalAmount.toLocaleString()}
                    </p>
                    <div className="mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className={`text-xs font-medium ${c.status === 'OVERDUE' ? 'text-red-600' : 'text-orange-600'}`}>
                        {c.status === 'OVERDUE'
                          ? 'OVERDUE'
                          : countdown[c.id] !== undefined
                          ? `${formatCountdown(countdown[c.id])} left`
                          : '...'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-gray-900">
                      KSh {c.amount.toLocaleString()}
                    </p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      c.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handlePay(c)}
                  className={`mt-3 w-full rounded-lg py-2 text-sm font-semibold text-white transition-colors ${
                    c.status === 'OVERDUE' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'
                  }`}
                >
                  Pay KSh {c.amount.toLocaleString()} via M-Pesa
                </button>
              </div>
            ))}
          </div>

          {commissions.length > 1 && (
            <button
              onClick={handlePayAll}
              className="w-full py-3 bg-kazi-orange text-white font-black rounded-xl"
            >
              View All & Pay — KSh {total.toLocaleString()}
            </button>
          )}

          <p className="text-center text-xs text-gray-400">
            {isBlocked
              ? 'Your app is blocked until all commissions are paid'
              : 'Pay within 24 hours to keep your account active'}
          </p>
        </div>
      </div>
    </div>
  );
}
