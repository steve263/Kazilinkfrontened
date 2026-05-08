import { NextRequest, NextResponse } from "next/server";

declare global {
  // eslint-disable-next-line no-var
  var __otpStore: Map<string, { code: string; expiresAt: number; attempts: number }> | undefined;
}

if (!global.__otpStore) {
  global.__otpStore = new Map();
}
const otpStore = global.__otpStore;

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "").replace(/^0/, "+254");
}

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return NextResponse.json({ error: "Phone and code are required" }, { status: 400 });
    }

    const normalized = normalizePhone(phone);

    // Dev mode bypass — must come BEFORE store lookup so serverless cold instances don't fail
    const devMode = process.env.OTP_DEV_MODE === "true";
    if (devMode && code.trim() === "123456") {
      return NextResponse.json({ success: true, message: "Phone number verified" });
    }

    const record = otpStore.get(normalized);

    if (!record) {
      return NextResponse.json({ error: "No OTP found for this number. Request a new one." }, { status: 400 });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(normalized);
      return NextResponse.json({ error: "OTP has expired. Request a new one." }, { status: 400 });
    }

    if (record.code !== code.trim()) {
      return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
    }

    otpStore.delete(normalized);
    return NextResponse.json({ success: true, message: "Phone number verified" });

  } catch (err: unknown) {
    console.error("OTP verify error:", err);
    const message = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
