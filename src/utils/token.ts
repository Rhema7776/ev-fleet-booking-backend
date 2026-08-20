import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

// Minimal shape needed to mint a token — works for a full Prisma User
// or a partial object, as long as these three fields are present.
export interface TokenSubject {
  id: number;
  email: string;
  role: string;
}

export function generateAccessToken(user: TokenSubject): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "15m" }
  );
}

export interface RefreshTokenResult {
  token: string;
  jti: string;
}

export function generateRefreshToken(user: TokenSubject): RefreshTokenResult {
  // Was uuid's v4() — swapped for Node's built-in crypto.randomUUID()
  // (same RFC 4122 v4 UUID output, zero external dependency). Removed
  // because the installed uuid package ships ESM-only, which Jest can't
  // parse from inside node_modules without extra config — this sidesteps
  // that entirely rather than fighting Jest's transform settings.
  const jti = randomUUID();

  const token = jwt.sign(
    { id: user.id, jti },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: "7d" }
  );

  return { token, jti };
}