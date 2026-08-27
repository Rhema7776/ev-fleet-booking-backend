export interface BusinessVerificationResult {
  found: boolean;
  isActive: boolean;
  registeredName: string | null;
  rawStatus: string | null;
}

export interface VerificationProvider {
  verifyBusiness(rcNumber: string): Promise<BusinessVerificationResult>;
}