import nodemailer, { type Transporter } from "nodemailer";

interface SendOtpOptions {
  to: string;
  name?: string;
  otp: string;
  magicUrl?: string;
  role?: string;
}

const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER || "";
const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || "";

let transporter: Transporter | null = null;

if (gmailUser && gmailPass) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });
}

export async function sendOtpEmail(opts: SendOtpOptions): Promise<{ success: boolean; preview?: string }> {
  const { to, name, otp, magicUrl, role } = opts;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
      <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 28px 24px; text-align: center; border-bottom: 1px solid #334155;">
        <h1 style="margin: 0; color: #e2e8f0; font-size: 22px; letter-spacing: 2px;">PASSION CAR</h1>
        <p style="margin: 4px 0 0; color: #94a3b8; font-size: 12px; letter-spacing: 1px;">KAVURI HILLS, MADHAPUR, HYDERABAD</p>
      </div>
      <div style="padding: 32px 24px;">
        <p style="font-size: 15px; color: #cbd5e1; margin-top: 0;">Hello ${name || "Administrator"},</p>
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
          Your 2-Step Verification code for <strong>${role || "Admin"}</strong> access is:
        </p>
        <div style="background: #1e293b; border: 2px dashed #ef4444; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ffffff;">${otp}</span>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 6px;">Valid for 15 minutes</div>
        </div>
        ${
          magicUrl
            ? `
        <div style="text-align: center; margin: 28px 0 20px;">
          <p style="font-size: 13px; color: #94a3b8; margin-bottom: 12px;">Or sign in with 1 click using your secure Magic URL:</p>
          <a href="${magicUrl}" style="display: inline-block; background: #ef4444; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 700; font-size: 14px;">Sign In via Magic URL</a>
        </div>
        `
            : ""
        }
        <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 28px; border-top: 1px solid #1e293b; paddingTop: 16px;">
          If you did not request this login, please protect your credentials. For assistance contact +91 88858 58380.
        </p>
      </div>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Passion Car Security" <${gmailUser}>`,
        to,
        subject: `[Passion Car] Your 2-Step Verification Code: ${otp}`,
        html,
      });
      return { success: true };
    } catch (err) {
      console.warn("Nodemailer send error:", err);
    }
  }

  console.log(`\n========================================`);
  console.log(`📧 [EMAIL OTP DISPATCH] To: ${to}`);
  console.log(`🔑 6-Digit Security OTP: ${otp}`);
  if (magicUrl) console.log(`🔗 1-Click Magic URL: ${magicUrl}`);
  console.log(`========================================\n`);

  return { success: true, preview: `Local dev dispatched: OTP ${otp}` };
}
