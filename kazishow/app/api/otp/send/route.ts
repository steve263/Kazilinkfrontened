import { NextRequest, NextResponse } from "next/server";

declare global {
  // eslint-disable-next-line no-var
  var __otpStore: Map<string, { code: string; expiresAt: number; attempts: number }> | undefined;
}
if (!global.__otpStore) global.__otpStore = new Map();
const otpStore = global.__otpStore;

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhone(phone: string): string {
  let p = phone.replace(/\s+/g, "");
  if (p.startsWith("0")) return "+254" + p.slice(1);
  if (p.startsWith("254") && !p.startsWith("+")) return "+" + p;
  return p;
}

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const normalized = normalizePhone(phone);

    if (!/^\+254[17]\d{8}$/.test(normalized)) {
      return NextResponse.json(
        { error: "Enter a valid Kenyan phone number (+254 7XX or +254 1XX)" },
        { status: 400 }
      );
    }

    // Rate limit: max 3 OTPs per phone per 10 minutes
    const existing = otpStore.get(normalized);
    if (existing && existing.expiresAt > Date.now() && existing.attempts >= 3) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please wait 10 minutes." },
        { status: 429 }
      );
    }

    const code = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    otpStore.set(normalized, { code, expiresAt, attempts: (existing?.attempts ?? 0) + 1 });

    const username = process.env.AT_USERNAME;
    const apiKey = process.env.AT_API_KEY;

    if (!username || !apiKey) {
      console.error("❌ Africa's Talking credentials not set in Vercel env vars");
      return NextResponse.json(
        { error: "SMS service not configured. Please contact support on WhatsApp: 0795542312" },
        { status: 503 }
      );
    }

    const message = `Your KaziShow verification code is: ${code}. Valid for 10 minutes. Do not share this code.`;

    const AfricasTalking = require("africastalking");
    const at = AfricasTalking({ username, apiKey });

    await at.SMS.send({
      to: [normalized],
      message,
    });

    console.log("✅ OTP sent to", normalized);
    return NextResponse.json({ success: true, message: "OTP sent to your phone" });

  } catch (err: unknown) {
    console.error("OTP send error:", err);
    const message = err instanceof Error ? err.message : "Failed to send OTP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
