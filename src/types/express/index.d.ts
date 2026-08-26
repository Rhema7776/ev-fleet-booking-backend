import "express";

export interface AuthenticatedUser {
  id: number;
  email?: string;
  role?: string;
  jti?: string;
}

declare global {
  namespace Express {
    // Augments req.user across every route/middleware — no more `as any`.
    interface Request {
      user?: AuthenticatedUser;
      // Set by validateRequest(schema, "query") — see that file for why
      // this can't just live on req.query in Express 5.
      validatedQuery?: unknown;
      // Captured by express.json()'s verify callback in app.ts — the
      // Paystack webhook signature is an HMAC over these exact raw
      // bytes, not the parsed JSON object (which can differ in
      // whitespace/key order from what was actually sent).
      rawBody?: Buffer;
    }
  }
}