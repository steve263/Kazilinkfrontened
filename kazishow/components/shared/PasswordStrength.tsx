"use client";
import { CheckCircle2, XCircle } from "lucide-react";

export interface PasswordCheck {
  label: string;
  met: boolean;
}

export function getPasswordChecks(pw: string): PasswordCheck[] {
  return [
    { label: "8+ characters",       met: pw.length >= 8 },
    { label: "Uppercase letter",     met: /[A-Z]/.test(pw) },
    { label: "Lowercase letter",     met: /[a-z]/.test(pw) },
    { label: "Number (0–9)",         met: /[0-9]/.test(pw) },
    { label: "Special character",    met: /[^A-Za-z0-9]/.test(pw) },
  ];
}

export function isStrongPassword(pw: string): boolean {
  return getPasswordChecks(pw).every((c) => c.met);
}

export default function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = getPasswordChecks(password);
  const metCount = checks.filter((c) => c.met).length;

  const strengthLabel = metCount <= 2 ? "Weak" : metCount <= 3 ? "Fair" : metCount === 4 ? "Good" : "Strong";
  const strengthColor = metCount <= 2 ? "bg-red-500" : metCount <= 3 ? "bg-yellow-500" : metCount === 4 ? "bg-blue-500" : "bg-green-500";
  const textColor    = metCount <= 2 ? "text-red-400" : metCount <= 3 ? "text-yellow-400" : metCount === 4 ? "text-blue-400" : "text-green-400";

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
            style={{ width: `${(metCount / 5) * 100}%` }}
          />
        </div>
        <span className={`text-xs font-bold ${textColor}`}>{strengthLabel}</span>
      </div>

      {/* Requirement chips */}
      <div className="flex flex-wrap gap-1.5">
        {checks.map(({ label, met }) => (
          <span
            key={label}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
              met
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-white/5 text-white/30 border border-white/10"
            }`}
          >
            {met
              ? <CheckCircle2 className="w-2.5 h-2.5" />
              : <XCircle className="w-2.5 h-2.5" />}
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
