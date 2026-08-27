import { prisma } from "../lib/prisma";
import { DojahVerificationProvider } from "./verification/dojahVerificationProvider";
import type { VerificationProvider } from "./verification/verificationProvider";

const provider: VerificationProvider = new DojahVerificationProvider();

function looksLikeSameBusiness(registeredName: string, submittedName: string): boolean {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const a = normalize(registeredName);
    const b = normalize(submittedName);
    return a.includes(b) || b.includes(a);
}

async function runVerification(rcNumber: string, submittedName: string) {
    const result = await provider.verifyBusiness(rcNumber);

    const nameMatches = result.registeredName
        ? looksLikeSameBusiness(result.registeredName, submittedName)
        : false;

    const verified = result.found && result.isActive && nameMatches;

    const notes = !result.found
        ? "RC number not found in CAC registry."
        : !result.isActive
            ? `Business found but not marked Active (status: ${result.rawStatus}).`
            : !nameMatches
                ? `Registered name "${result.registeredName}" doesn't clearly match the submitted name "${submittedName}".`
                : null;

    return {
        status: verified ? ("VERIFIED" as const) : ("FLAGGED" as const),
        registeredName: result.registeredName,
        notes,
    };
}

export async function verifyEnterprise(enterpriseId: number): Promise<void> {
    const enterprise = await prisma.enterprise.findUnique({ where: { id: enterpriseId } });

    if (!enterprise?.rcNumber) return;

    const { status, registeredName, notes } = await runVerification(
        enterprise.rcNumber,
        enterprise.name
    );

    await prisma.enterprise.update({
        where: { id: enterpriseId },
        data: {
            verificationStatus: status,
            verifiedBusinessName: registeredName,
            verificationCheckedAt: new Date(),
            verificationNotes: notes,
        },
    });
}

export async function verifyFleetOwner(fleetOwnerId: number): Promise<void> {
    const fleetOwner = await prisma.fleetOwner.findUnique({ where: { id: fleetOwnerId } });

    if (!fleetOwner?.rcNumber) return;

    const { status, registeredName, notes } = await runVerification(
        fleetOwner.rcNumber,
        fleetOwner.companyName
    );

    await prisma.fleetOwner.update({
        where: { id: fleetOwnerId },
        data: {
            verificationStatus: status,
            verifiedBusinessName: registeredName,
            verificationCheckedAt: new Date(),
            isVerified: status === "VERIFIED",
            verificationNotes: notes,
        },
    });
}