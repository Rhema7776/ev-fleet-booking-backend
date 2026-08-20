import { ApiError } from "../utils/ApiError";
import type { SocialAuthResult } from "../types/socialAuth";

interface FacebookDebugTokenResponse {
  data?: {
    is_valid: boolean;
    app_id: string | number;
  };
  error?: unknown;
}

interface FacebookUserResponse {
  id?: string;
  name?: string;
  email?: string;
  error?: unknown;
}

export async function verifyFacebookToken(accessToken: string): Promise<SocialAuthResult> {
  try {
    if (!accessToken) {
      throw new Error("Facebook access token is required.");
    }

    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    if (!appId || !appSecret) {
      throw new Error("Facebook App ID or App Secret is not configured.");
    }

    const appAccessToken = `${appId}|${appSecret}`;

    const debugUrl =
      `https://graph.facebook.com/v26.0/debug_token` +
      `?input_token=${encodeURIComponent(accessToken)}` +
      `&access_token=${encodeURIComponent(appAccessToken)}`;

    const debugResponse = await fetch(debugUrl);
    const debugData = (await debugResponse.json()) as FacebookDebugTokenResponse;

    if (!debugResponse.ok || debugData.error) {
      throw new Error("Invalid Facebook access token.");
    }

    const tokenData = debugData.data;

    if (!tokenData || !tokenData.is_valid) {
      throw new Error("Facebook access token is invalid.");
    }

    if (String(tokenData.app_id) !== String(appId)) {
      throw new Error("Facebook access token does not belong to this application.");
    }

    const userUrl =
      `https://graph.facebook.com/v26.0/me` +
      `?fields=id,name,email` +
      `&access_token=${encodeURIComponent(accessToken)}`;

    const userResponse = await fetch(userUrl);
    const userData = (await userResponse.json()) as FacebookUserResponse;

    if (!userResponse.ok || userData.error) {
      throw new Error("Unable to retrieve Facebook account information.");
    }

    if (!userData.id) {
      throw new Error("Facebook account ID could not be retrieved.");
    }

    return {
      providerId: userData.id,
      email: userData.email,
      fullName: userData.name,
      emailVerified: true,
    };
  } catch (error) {
    console.error("Facebook token verification failed:", error);
    throw ApiError.unauthorized("Invalid Facebook authentication token.");
  }
}