import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

type ValidationTarget = "body" | "params" | "query";

export function validateRequest(schema: ZodType, target: ValidationTarget = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (target === "query") {
      req.validatedQuery = schema.parse(req.query);
    } else {
      req[target] = schema.parse(req[target]);
    }
    next();
  };
}
