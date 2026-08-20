import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  // Zod validation errors get a clean 400 with field-level detail.
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      ...(err.details ? { errors: err.details } : {}),
    });
  }

  // Unexpected error — log the full thing server-side, but never leak
  // internals (stack traces, DB error text, etc) to the client.
  console.error("[unhandled error]", err);

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}
