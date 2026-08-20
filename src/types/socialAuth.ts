//  My shared return shape for Google/Facebook/Apple token verification.

export interface SocialAuthResult {
  providerId: string;
  email?: string;
  fullName?: string;
  emailVerified: boolean;
  /** Apple-specific: which client the token came from (web vs mobile). */
  source?: "web" | "mobile";
}