import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

declare global {
  // eslint-disable-next-line no-var
  var __otpStore: Map<string, { code: string; expiresAt: number; attempts: number }> | undefined;
}
if (!global.__otpStore) global.__otpStore = new Map();
const otpStore = global.__otpStore;

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function otpEmailHtml(name: string, otp: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#1a1714;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1714;padding:40px 20px;">
  <tr><td align="center">
    <table width="100%" style="max-width:480px;background:#242019;border-radius:20px;padding:40px;border:1px solid rgba(255,255,255,0.08);">
      <tr><td align="center" style="padding-bottom:24px;">
        <div style="width:60px;height:60px;background:rgba(255,107,43,0.2);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;font-size:28px;line-height:60px;">🔐</div>
        <h2 style="color:#ffffff;font-size:22px;font-weight:900;margin:16px 0 4px;">Verify your email</h2>
        <p style="color:rgba(255,255,255,0.5);font-size:14px;margin:0;">Hi <strong style="color:rgba(255,255,255,0.8);">${name || "there"}</strong>, here is your KaziShow code.</p>
      </td></tr>
      <tr><td align="center" style="padding-bottom:24px;">
        <div style="background:rgba(255,107,43,0.1);border:2px solid #FF6B2B;border-radius:16px;padding:28px 40px;display:inline-block;">
          <p style="margin:0 0 6px;color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:1px;">Your code</p>
          <p style="margin:0;color:#FF6B2B;font-size:42px;font-weight:900;letter-spacing:10px;">${otp}</p>
          <p style="margin:10px 0 0;color:rgba(255,255,255,0.3);font-size:12px;">Valid for 10 minutes · Do not share</p>
        </div>
      </td></tr>
      <tr><td align="center">
        <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;">If you did not request this, you can safely ignore this email.</p>
      </td></tr>
    </table>
  </td></tr>
</table></body></html>`;
}

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }

    const key = email.trim().toLowerCase();

    // Rate limit: max 3 OTPs per email per 10 minutes
    const existing = otpStore.get(key);
    if (existing && existing.expiresAt > Date.now() && existing.attempts >= 3) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please wait 10 minutes." },
        { status: 429 }
      );
    }

    const code = generateOTP();
    otpStore.set(key, { code, expiresAt: Date.now() + 10 * 60 * 1000, attempts: (existing?.attempts ?? 0) + 1 });

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      console.error("❌ EMAIL_USER or EMAIL_PASS missing from Vercel env vars");
      return NextResponse.json({ error: "Email service not configured. Contact support." }, { status: 503 });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: emailUser, pass: emailPass },
    });

    await transporter.sendMail({
      from: `"KaziShow" <${emailUser}>`,
      to: key,
      subject: "KaziShow — Your Verification Code",
      html: otpEmailHtml(name || "", code),
    });

    console.log(`✅ OTP emailed to ${key}`);
    return NextResponse.json({ success: true, message: "OTP sent to your email" });

  } catch (err: unknown) {
    console.error("❌ OTP send error:", err);
    const message = err instanceof Error ? err.message : "Failed to send OTP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
