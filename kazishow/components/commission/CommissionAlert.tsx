'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Clock, CheckCircle, Loader2, Phone } from 'lucide-react';

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

interface CommissionAlertProps {
  commissions: Commission[];
  total: number;
  isBlocked: boolean;
  onPaid: () => void;
}

type PaymentState = 'idle' | 'paying' | 'waiting' | 'paid';

export default function CommissionAlert({ commissions, total, isBlocked, onPaid }: CommissionAlertProps) {
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState<Record<string, number>>({});

  // Compute seconds remaining until dueAt for each commission
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

  // Poll for payment confirmation while in 'waiting' state
  useEffect(() => {
    if (paymentState !== 'waiting' || !payingId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/bookings/my-commissions', { cache: 'no-store' });
        const data = await res.json();
        if (!data.success) return;
        const still = data.data.commissions.find((c: Commission) => c.id === payingId);
        if (!still) {
          setPaymentState('paid');
          setTimeout(() => onPaid(), 2000);
        }
      } catch {
        // silently ignore poll errors
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [paymentState, payingId, onPaid]);

  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const handlePay = useCallback(async (commission: Commission) => {
    setPayingId(commission.id);
    setPaymentState('paying');
    setError('');
    try {
      const res = await fetch(`/api/bookings/commissions/${commission.id}/pay`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setPaymentState('waiting');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
      setPaymentState('idle');
      setPayingId(null);
    }
  }, []);

  const primaryCommission = commissions[0];

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
              : 'You must pay KaziShow commission for cash payments'}
          </p>
        </div>

        {/* Payment state overlays */}
        {paymentState === 'waiting' && (
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
            <div>
              <p className="text-lg font-semibold text-gray-800">Waiting for M-Pesa...</p>
              <p className="mt-1 text-sm text-gray-500">
                Check your phone and enter your M-Pesa PIN to complete payment
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-4 py-3 text-sm text-orange-700">
              <Phone className="h-4 w-4 shrink-0" />
              <span>STK Push sent — enter your PIN to pay</span>
            </div>
          </div>
        )}

        {paymentState === 'paid' && (
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <CheckCircle className="h-14 w-14 text-green-500" />
            <div>
              <p className="text-lg font-semibold text-gray-800">Commission Paid!</p>
              <p className="mt-1 text-sm text-gray-500">Your account has been unlocked. Thank you!</p>
            </div>
          </div>
        )}

        {paymentState === 'idle' || paymentState === 'paying' ? (
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
                        <span
                          className={`text-xs font-medium ${
                            c.status === 'OVERDUE' ? 'text-red-600' : 'text-orange-600'
                          }`}
                        >
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
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          c.status === 'OVERDUE'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                  </div>

                  {/* Pay button per commission */}
                  <button
                    onClick={() => handlePay(c)}
                    disabled={paymentState === 'paying' && payingId === c.id}
                    className={`mt-3 w-full rounded-lg py-2 text-sm font-semibold text-white transition-colors ${
                      paymentState === 'paying' && payingId === c.id
                        ? 'bg-gray-400 cursor-not-allowed'
                        : c.status === 'OVERDUE'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-orange-500 hover:bg-orange-600'
                    }`}
                  >
                    {paymentState === 'paying' && payingId === c.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending M-Pesa...
                      </span>
                    ) : (
                      `Pay KSh ${c.amount.toLocaleString()} via M-Pesa`
                    )}
                  </button>
                </div>
              ))}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <p className="text-center text-xs text-gray-400">
              {isBlocked
                ? 'Your app is blocked until all commissions are paid'
                : 'Pay within 24 hours to keep your account active'}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
