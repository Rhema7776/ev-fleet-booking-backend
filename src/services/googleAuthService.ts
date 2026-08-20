import { OAuth2Client } from "google-auth-library";
import { ApiError } from "../utils/ApiError";
import type { SocialAuthResult } from "../types/socialAuth";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(token: string): Promise<SocialAuthResult> {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error("Invalid Google token.");
    }

    return {
      providerId: payload.sub,
      email: payload.email,
      fullName: payload.name,
      emailVerified: payload.email_verified ?? false,
    };
  } catch (error) {
    console.error("Google token verification failed:", error);
    throw ApiError.unauthorized("Invalid Google authentication token.");
  }
}