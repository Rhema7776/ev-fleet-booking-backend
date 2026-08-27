import axios from "axios";
import type { VerificationProvider, BusinessVerificationResult } from "./verificationProvider";

const dojahClient = axios.create({
  baseURL: "https://api.dojah.io",
  headers: {
    AppId: process.env.DOJAH_APP_ID,
    Authorization: process.env.DOJAH_API_KEY,
  },
});

export class DojahVerificationProvider implements VerificationProvider {
  async verifyBusiness(rcNumber: string): Promise<BusinessVerificationResult> {
    try {
      const response = await dojahClient.get("/api/v1/kyc/cac/basic", {
        params: { rc_number: rcNumber },
      });

      const entity = response.data?.entity;

      if (!entity) {
        return { found: false, isActive: false, registeredName: null, rawStatus: null };
      }

      return {
        found: true,
        isActive: typeof entity.status === "string" && entity.status.toLowerCase() === "active",
        registeredName: entity.company_name ?? null,
        rawStatus: entity.status ?? null,
      };
    } catch {
      return { found: false, isActive: false, registeredName: null, rawStatus: null };
    }
  }
}