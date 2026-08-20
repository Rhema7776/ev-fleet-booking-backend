import { z } from "zod";

// Matches the Role enum in prisma/schema.prisma. Kept as a literal list here
// (rather than importing the Prisma enum) so validation errors are readable
// before Prisma is even involved.
const ROLES = [
  "ADMIN",
  "FLEET_OWNER",
  "MASTER_AGENT",
  "SUB_AGENT",
  "INDIVIDUAL_PARTNER",
  "ENTERPRISE_PARTNER",
] as const;

const PROVIDERS = ["GOOGLE", "FACEBOOK", "APPLE"] as const;

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is too short."),
  email: z.string().trim().toLowerCase().email("Invalid email address."),
  phone: z.string().trim().min(7, "Invalid phone number."),
  role: z.enum(ROLES),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required."),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address."),
  code: z.string().length(6, "OTP must be 6 digits."),
  purpose: z.string().min(1, "Purpose is required."),
});

export const createPasswordSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Invalid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address."),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Invalid email address."),
    code: z.string().length(6, "OTP must be 6 digits."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const socialLoginSchema = z.object({
  provider: z.enum(PROVIDERS),
  token: z.string().min(1, "Social provider token is required."),
  role: z.enum(ROLES).optional(),
  fullName: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type CreatePasswordInput = z.infer<typeof createPasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type SocialLoginInput = z.infer<typeof socialLoginSchema>;
