import nodemailer from "nodemailer";

/**
 * Converted from emailService.js. One real bug fixed here, not just a
 * TS conversion:
 *
 * The original called `transporter.verify(...)` at MODULE LOAD TIME (top
 * level, outside any function). That means simply importing this file —
 * which happens automatically any time authService.ts loads, which
 * happens on every app boot and every test run that touches app.ts —
 * triggered a real network connection attempt to Gmail's SMTP server
 * immediately, whether or not an email was ever actually going to be
 * sent, and whether or not real credentials were even configured.
 *
 * In practice this caused: slow/noisy app startup, scary error logs on
 * every boot when EMAIL_USER/EMAIL_PASS aren't set, and — the way this
 * surfaced — Jest test runs hanging and exiting with a non-zero code
 * even when every individual test passed, because the dangling async
 * connection attempt was still in flight when the test run finished.
 *
 * Fixed by making verification an explicit, opt-in function instead of
 * an automatic side effect of importing the module. Call
 * `verifyMailServer()` yourself (e.g. once at real server startup in
 * server.ts, if you want that check) rather than it happening implicitly.
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function verifyMailServer(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log("Mail server is ready.");
    return true;
  } catch (error) {
    console.error("Mail transport verification failed:", error);
    return false;
  }
}

class EmailService {
  async sendOTP(email: string, code: string): Promise<void> {
    try {
      const info = await transporter.sendMail({
        from: `"LeaseHub" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Verify your LeaseHub account",
        html: `
          <div style="font-family:Arial;padding:30px">
              <h2>Welcome to LeaseHub</h2>
              <p>Your verification code is:</p>
              <h1 style="letter-spacing:8px;color:#0A7C4A;">${code}</h1>
              <p>This code expires in 10 minutes.</p>
          </div>
        `,
      });

      console.log("Email sent:", info.response);
    } catch (error) {
      console.error("Nodemailer Error:", error);
      throw error;
    }
  }
}

export default new EmailService();