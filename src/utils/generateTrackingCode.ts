const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 chars — no 0/O/1/I (ambiguous read over a phone)
const CODE_LENGTH = 6;
const SPACE = ALPHABET.length ** CODE_LENGTH; // 32^6 = 1,073,741,824 (2^30, since 32 = 2^5)

const MULTIPLIER = 104729;

export function encodeShipmentId(id: number): string {
  if (!Number.isInteger(id) || id < 0) {
    throw new Error(`encodeShipmentId requires a non-negative integer, got: ${id}`);
  }
  if (id >= SPACE) {

    throw new Error(
      `Shipment id ${id} exceeds the tracking code space (${SPACE}). ` +
        `Increase CODE_LENGTH in generateTrackingCode.ts before this happens.`
    );
  }

  const permuted = (id * MULTIPLIER) % SPACE;

  let code = "";
  let remaining = permuted;
  for (let i = 0; i < CODE_LENGTH; i++) {
    code = ALPHABET[remaining % ALPHABET.length] + code;
    remaining = Math.floor(remaining / ALPHABET.length);
  }

  return `SHP-${code}`;
}
