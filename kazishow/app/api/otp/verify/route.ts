import { NextRequest, NextResponse } from "next/server";

declare global {
  // eslint-disable-next-line no-var
  var __otpStore: Map<string, { code: string; expiresAt: number; attempts: number }> | undefined;
}
if (!global.__otpStore) global.__otpStore = new Map();
const otpStore = global.__otpStore;

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    const key = email.trim().toLowerCase();
    const record = otpStore.get(key);

    if (!record) {
      return NextResponse.json(
        { error: "No OTP found for this email. Request a new one." },
        { status: 400 }
      );
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(key);
      return NextResponse.json(
        { error: "OTP has expired. Request a new one." },
        { status: 400 }
      );
    }

    if (record.code !== code.trim()) {
      return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
    }

    otpStore.delete(key);
    return NextResponse.json({ success: true, message: "Email verified" });

  } catch (err: unknown) {
    console.error("OTP verify error:", err);
    const message = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
