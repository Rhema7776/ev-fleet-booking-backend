import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import { AuthenticatedUser } from "../types/express";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw ApiError.unauthorized("Access denied. No token provided.");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw ApiError.unauthorized("Invalid token.");
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as AuthenticatedUser;

    req.user = decoded;
    next();
  } catch {
    throw ApiError.unauthorized("Invalid or expired token.");
  }
}
