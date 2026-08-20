import { Response } from "express";

export function sendSuccess<T>(
  res: Response,
  status: number,
  message: string,
  data?: T
) {
  return res.status(status).json({
    success: true,
    message,
    ...(data !== undefined ? { data } : {}),
  });
}
