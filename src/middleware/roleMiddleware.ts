import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    if (!req.user.role || !roles.includes(req.user.role)) {
      throw ApiError.forbidden(
        "You do not have permission to perform this action."
      );
    }

    next();
  };
}
