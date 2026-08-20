import { prisma } from "../lib/prisma";
import { generateOTP } from "../utils/generateOTP";
import { ApiError } from "../utils/ApiError";

class OTPService {
  async createOTP(email: string, purpose = "REGISTRATION"): Promise<string> {
    await prisma.oTP.deleteMany({
      where: { email, purpose, verified: false },
    });

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.oTP.create({
      data: { email, code, purpose, expiresAt },
    });

    return code;
  }

  async verifyOTP(
    email: string,
    code: string,
    purpose = "REGISTRATION"
  ): Promise<true> {
    const otp = await prisma.oTP.findFirst({
      where: { email, code, purpose, verified: false },
    });

    if (!otp) {
      throw ApiError.badRequest("Invalid verification code.");
    }

    if (otp.expiresAt < new Date()) {
      throw ApiError.badRequest("OTP has expired.");
    }

    await prisma.oTP.update({
      where: { id: otp.id },
      data: { verified: true },
    });

    return true;
  }
}

export default new OTPService();