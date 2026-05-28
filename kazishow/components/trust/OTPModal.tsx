"use client";
import { useState, useRef, useEffect } from "react";
import { X, Smartphone, CheckCircle, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

interface OTPModalProps {
  phone: string;
  onVerified: () => void;
  onClose: () => void;
}

export default function OTPModal({ phone, onVerified, onClose }: OTPModalProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    sendOTP();
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(countdownRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const sendOTP = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to send OTP");
        return;
      }
      toast.success(`OTP sent to ${phone}`);
      startCountdown();
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      toast.error("Network error. Check your connection.");
    } finally {
      setSending(false);
    }
  };

  const handleInput = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    if (next.every((d) => d !== "")) {
      handleVerify(next.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const digits = pasted.split("");
      setOtp(digits);
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    }
  };

  const handleVerify = async (code?: string) => {
    const value = code ?? otp.join("");
    if (value.length < 6) { toast.error("Enter all 6 digits"); return; }
    setVerifying(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Incorrect code");
        // Clear digits on wrong code
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
        return;
      }
      setVerified(true);
      toast.success("Phone number verified!");
      setTimeout(() => onVerified(), 1200);
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setVerifying(false);
    }
  };

  const maskedPhone = phone.replace(/(\+254\s*\d{3})\s*\d{3}\s*\d{3}/, "$1 *** ***");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-kazi-dark2 rounded-3xl shadow-2xl border border-white/10 overflow-hidden animate-slide-up">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 transition-colors z-10">
          <X className="w-5 h-5 text-white/60" />
        </button>

        <div className="p-7">
          {verified ? (
            <div className="flex flex-col items-center py-4 animate-slide-up">
              <div className="w-16 h-16 bg-kazi-green/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-9 h-9 text-kazi-green" fill="#00C896" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Phone Verified!</h3>
              <p className="text-white/50 text-sm text-center">Your number has been confirmed. You&apos;re all set.</p>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 bg-kazi-orange/20 rounded-2xl flex items-center justify-center mb-5">
                <Smartphone className="w-7 h-7 text-kazi-orange" />
              </div>
              <h3 className="text-xl font-black text-white mb-1">Verify your phone</h3>
              <p className="text-white/50 text-sm mb-1 leading-relaxed">
                {sending ? "Sending code…" : "We sent a 6-digit code to"}{" "}
                {!sending && <span className="text-white font-semibold">{maskedPhone}</span>}
              </p>


              <div className="flex gap-2 justify-center mb-6 mt-4" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    value={digit}
                    onChange={(e) => handleInput(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    disabled={sending || verifying}
                    className={`w-11 h-14 text-center text-xl font-black rounded-2xl border-2 bg-white/[0.08] text-white transition-all focus:outline-none disabled:opacity-50 ${
                      digit ? "border-kazi-orange" : "border-white/15 focus:border-kazi-orange/60"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => handleVerify()}
                disabled={verifying || sending || otp.some((d) => !d)}
                className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl hover:bg-orange-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
              >
                {verifying ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Verifying…</>
                ) : (
                  <><ShieldCheck className="w-5 h-5" /> Verify OTP</>
                )}
              </button>

              <div className="text-center">
                {sending ? (
                  <p className="text-sm text-white/40 flex items-center justify-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending code…
                  </p>
                ) : countdown > 0 ? (
                  <p className="text-sm text-white/40">
                    Resend code in <span className="text-white/70 font-semibold">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    onClick={sendOTP}
                    className="flex items-center gap-1.5 text-sm text-kazi-orange font-semibold hover:text-orange-400 transition-colors mx-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Resend OTP
                  </button>
                )}
              </div>

              <p className="text-xs text-white/25 text-center mt-4">
                Didn&apos;t get the code? Check your SMS inbox or wait for the resend timer.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
