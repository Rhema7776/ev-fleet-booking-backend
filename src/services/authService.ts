import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import otpService from "./otpService";
import emailService from "./emailService";
import { verifyGoogleToken } from "./googleAuthService";
import { verifyFacebookToken } from "./facebookAuthService";
import { verifyAppleToken } from "./appleAuthService";
import { generateAccessToken, generateRefreshToken } from "../utils/token";
import type { SocialAuthResult } from "../types/socialAuth";
import type {
  RegisterInput,
  LoginInput,
  VerifyOtpInput,
  CreatePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  SocialLoginInput,
} from "../validators/authValidator";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

class AuthService {
  async register(data: RegisterInput) {
    const { fullName, email, phone, role } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw ApiError.badRequest("Email already exists.");
    }

    await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        role,
        password: null,
        isVerified: false,
      },
    });

    const code = await otpService.createOTP(email);
    await emailService.sendOTP(email, code);

    return { message: "Verification code sent successfully.", email };
  }

  async login(data: LoginInput) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      throw ApiError.unauthorized("Invalid email or password.");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw ApiError.unauthorized("Invalid email or password.");
    }

    const accessToken = generateAccessToken(user);
    const refresh = generateRefreshToken(user);

    await prisma.refreshToken.create({
      data: {
        jti: refresh.jti,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        userId: user.id,
      },
    });

    return {
      message: "Login successful",
      accessToken,
      refreshToken: refresh.token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }

  async verifyOTP(data: VerifyOtpInput) {
    const { email, code, purpose } = data;

    await otpService.verifyOTP(email, code, purpose);

    await prisma.user.update({
      where: { email },
      data: { isVerified: true },
    });

    return { message: "OTP verified successfully." };
  }

  async createPassword(data: CreatePasswordInput) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw ApiError.notFound("User not found.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    return { message: "Password created successfully." };
  }

  async forgotPassword(data: ForgotPasswordInput) {
    const { email } = data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw ApiError.notFound("No account exists with this email.");
    }

    const code = await otpService.createOTP(email, "RESET_PASSWORD");
    await emailService.sendOTP(email, code);

    return { message: "Verification code sent.", email };
  }

  async resetPassword(data: ResetPasswordInput) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw ApiError.notFound("User not found.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    return { message: "Password reset successful." };
  }

  async socialLogin(data: SocialLoginInput) {
    const { provider, token, role, fullName } = data;

    let socialUser: SocialAuthResult;

    if (provider === "GOOGLE") {
      socialUser = await verifyGoogleToken(token);
    } else if (provider === "FACEBOOK") {
      socialUser = await verifyFacebookToken(token);
    } else {
      socialUser = await verifyAppleToken(token, fullName);
    }

    if (!socialUser.email) {
      throw ApiError.badRequest("Social account email could not be retrieved.");
    }

    if (!socialUser.emailVerified) {
      throw ApiError.unauthorized("Social account email has not been verified.");
    }

    let user = await prisma.user.findUnique({
      where: { email: socialUser.email },
    });

    let isNewUser = false;

    if (user) {
      if (user.authProvider === provider && user.providerId === socialUser.providerId) {
        // Existing account, same provider — continue to login below.
      } else if (user.authProvider === "LOCAL") {
        throw ApiError.conflict(
          "An account already exists with this email. Please log in with your email and password."
        );
      } else {
        throw ApiError.conflict(
          `This email is already registered with ${user.authProvider}.`
        );
      }
    } else {
      if (!role) {
        throw ApiError.badRequest("Role is required for new social registration.");
      }

      isNewUser = true;

      user = await prisma.user.create({
        data: {
          fullName:
            socialUser.fullName ||
            (provider === "GOOGLE" ? "Google User" : "Facebook User"),
          email: socialUser.email,
          password: null,
          phone: null,
          role,
          authProvider: provider,
          providerId: socialUser.providerId,
          isVerified: false,
        },
      });

      // Same OTP flow as regular registration.
      const code = await otpService.createOTP(user.email);
      await emailService.sendOTP(user.email, code);
    }

    const accessToken = generateAccessToken(user);
    const refresh = generateRefreshToken(user);

    await prisma.refreshToken.create({
      data: {
        jti: refresh.jti,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        userId: user.id,
      },
    });

    return {
      message: "Social login successful.",
      isNewUser,
      accessToken,
      refreshToken: refresh.token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }
}

export default new AuthService();
