import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { prisma } from "../lib/prisma";
import { generateAccessToken } from "../utils/token";
import authService from "../services/authService";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  return sendSuccess(res, 201, result.message, { email: result.email });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  return sendSuccess(res, 200, result.message, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user,
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw ApiError.unauthorized("Refresh token required.");
  }

  let decoded: { id: number; jti: string };
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as {
      id: number;
      jti: string;
    };
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token.");
  }

  const storedToken = await prisma.refreshToken.findFirst({
    where: { jti: decoded.jti },
  });

  if (!storedToken) {
    throw ApiError.unauthorized("Invalid refresh token.");
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });

  if (!user) {
    throw ApiError.notFound("User not found.");
  }

  const accessToken = generateAccessToken(user);
  return sendSuccess(res, 200, "Access token refreshed.", { accessToken });
});

export const verifyOTP = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.verifyOTP(req.body);
  return sendSuccess(res, 200, result.message);
});

export const createPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.createPassword(req.body);
  return sendSuccess(res, 200, result.message);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.forgotPassword(req.body);
  return sendSuccess(res, 200, result.message, { email: result.email });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.resetPassword(req.body);
  return sendSuccess(res, 200, result.message);
});

export const socialLogin = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.socialLogin(req.body);
  return sendSuccess(res, 200, result.message, {
    isNewUser: result.isNewUser,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user,
  });
});
