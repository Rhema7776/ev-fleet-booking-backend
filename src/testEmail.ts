// Manual verification script for the real email-sending path not part
// of the app itself, not imported anywhere, just a way to check your
// EMAIL_USER/EMAIL_PASS credentials actually work against a real inbox.
// Run with: npx tsx src/testEmail.ts
import "dotenv/config";
import emailService from "./services/emailService";

(async () => {
  try {
    await emailService.sendOTP(process.env.EMAIL_USER as string, "123456");
    console.log("Email sent successfully.");
  } catch (error) {
    console.error(error);
  }
})();