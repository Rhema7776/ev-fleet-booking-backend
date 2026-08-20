import jwt, { JwtHeader, SigningKeyCallback } from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { ApiError } from "../utils/ApiError";
import type { SocialAuthResult } from "../types/socialAuth";

const client = jwksClient({
  jwksUri: "https://appleid.apple.com/auth/keys",
});

function getAppleSigningKey(header: JwtHeader, callback: SigningKeyCallback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    callback(null, key?.getPublicKey());
  });
}

interface AppleTokenPayload {
  sub: string;
  email?: string;
  email_verified?: string | boolean;
  aud: string;
}

export async function verifyAppleToken(
  idToken: string,
  providedFullName?: string
): Promise<SocialAuthResult> {
  try {
    if (!idToken) {
      throw new Error("Apple id_token is required.");
    }

    const validAudiences = [
      process.env.APPLE_CLIENT_ID,
      process.env.APPLE_BUNDLE_ID,
    ].filter((v): v is string => Boolean(v));

    if (validAudiences.length === 0) {
      throw new Error(
        "No Apple audience configured. Set APPLE_CLIENT_ID and/or APPLE_BUNDLE_ID."
      );
    }

    const audience = validAudiences as [string, ...string[]];

    const decoded = await new Promise<AppleTokenPayload>((resolve, reject) => {
      jwt.verify(
        idToken,
        getAppleSigningKey,
        {
          algorithms: ["RS256"],
          issuer: "https://appleid.apple.com",
          audience,
        },
        (err: jwt.VerifyErrors | null, payload: jwt.JwtPayload | string | undefined) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(payload as AppleTokenPayload);
        }
      );
    });

    if (!decoded?.sub) {
      throw new Error("Apple account ID could not be retrieved.");
    }

    const source: "web" | "mobile" =
      decoded.aud === process.env.APPLE_BUNDLE_ID ? "mobile" : "web";

    return {
      providerId: decoded.sub,
      email: decoded.email,
      fullName: providedFullName || undefined,
      emailVerified: decoded.email_verified === "true" || decoded.email_verified === true,
      source,
    };
  } catch (error) {
    console.error("Apple token verification failed:", error);
    throw ApiError.unauthorized("Invalid Apple authentication token.");
  }
}