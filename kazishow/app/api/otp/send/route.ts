import { NextRequest, NextResponse } from "next/server";

// Shared in-memory OTP store via global to survive Next.js hot-reload
// In production replace with Redis or a database
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
  // Convert +254 7XX XXX XXX → +2547XXXXXXXX
  return phone.replace(/\s+/g, "").replace(/^0/, "+254");
}

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const normalized = normalizePhone(phone);

    // Basic Kenyan phone validation
    if (!/^\+254[17]\d{8}$/.test(normalized)) {
      return NextResponse.json({ error: "Enter a valid Kenyan phone number (+254 7XX or +254 1XX)" }, { status: 400 });
    }

    // Rate limit: max 3 OTPs per phone per 10 minutes
    const existing = otpStore.get(normalized);
    if (existing && existing.expiresAt > Date.now() && existing.attempts >= 3) {
      return NextResponse.json({ error: "Too many OTP requests. Please wait 10 minutes." }, { status: 429 });
    }

    const code = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(normalized, { code, expiresAt, attempts: (existing?.attempts ?? 0) + 1 });

    const devMode = process.env.OTP_DEV_MODE === "true";

    if (devMode) {
      // Demo mode: always use fixed code 123456 so no SMS needed
      const demoCode = "123456";
      otpStore.set(normalized, { code: demoCode, expiresAt, attempts: (existing?.attempts ?? 0) + 1 });
      console.log(`\n📱 [DEMO OTP] Phone: ${normalized} → Code: ${demoCode} (demo mode)\n`);
      return NextResponse.json({
        success: true,
        message: `Demo OTP ready — use code 123456`,
        devCode: demoCode,
      });
    }

    // Production: send via Africa's Talking
    const username = process.env.AFRICASTALKING_USERNAME;
    const apiKey = process.env.AFRICASTALKING_API_KEY;

    if (!username || !apiKey || apiKey === "your_api_key_here") {
      return NextResponse.json({ error: "SMS service not configured. Set AFRICASTALKING_API_KEY in .env.local" }, { status: 503 });
    }

    // Dynamic import to avoid issues with Edge runtime
    const AfricasTalking = require("africastalking");
    const at = AfricasTalking({ username, apiKey });
    const sms = at.SMS;

    const message = `Your KaziShow verification code is: ${code}\n\nDo not share this code with anyone. Valid for 10 minutes.`;

    const result = await sms.send({
      to: [normalized],
      message,
      from: "KaziShow", // Will use default short code in sandbox
    });

    console.log("Africa's Talking SMS result:", JSON.stringify(result));

    const recipient = result?.SMSMessageData?.Recipients?.[0];
    if (recipient?.status !== "Success" && recipient?.statusCode !== 101) {
      return NextResponse.json({ error: `SMS failed: ${recipient?.status ?? "Unknown error"}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `OTP sent to ${normalized}` });

  } catch (err: unknown) {
    console.error("OTP send error:", err);
    const message = err instanceof Error ? err.message : "Failed to send OTP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
