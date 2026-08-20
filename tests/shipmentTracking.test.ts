import { encodeShipmentId } from "../src/utils/generateTrackingCode";
import {
  trackShipmentParamSchema,
  trackShipmentQuerySchema,
} from "../src/validators/shipmentValidator";

describe("encodeShipmentId", () => {
  it("produces an SHP-prefixed 6-character code using only the unambiguous alphabet", () => {
    const code = encodeShipmentId(12345);
    expect(code).toMatch(/^SHP-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  });

  it("is deterministic — the same id always produces the same code", () => {
    expect(encodeShipmentId(42)).toBe(encodeShipmentId(42));
    expect(encodeShipmentId(999999)).toBe(encodeShipmentId(999999));
  });

  it("is injective — no two different ids in a large sample ever collide (the actual guarantee)", () => {
    const seen = new Map<string, number>();
    // Sample 200,000 ids scattered across the space (sequential ids from
    // Postgres would never collide anyway — spot-checking a spread proves
    // the permutation math holds generally, not just for one lucky range).
    // Stride chosen so 199,999 * 5000 stays safely under the real space
    // (32^6 = 1,073,741,824).
    for (let i = 0; i < 200_000; i++) {
      const id = i * 5000;
      const code = encodeShipmentId(id);
      const prior = seen.get(code);
      if (prior !== undefined) {
        throw new Error(`Collision: id ${id} and id ${prior} both produced ${code}`);
      }
      seen.set(code, id);
    }
    expect(seen.size).toBe(200_000);
  });

  it("rejects ids at or beyond the code space, rather than silently risking a collision", () => {
    expect(() => encodeShipmentId(32 ** 6)).toThrow();
    expect(() => encodeShipmentId(-1)).toThrow();
    expect(() => encodeShipmentId(1.5)).toThrow();
  });

  it("does not include visually ambiguous characters (0, O, 1, I)", () => {
    for (let i = 0; i < 50; i++) {
      expect(encodeShipmentId(i * 9973)).not.toMatch(/[01OI]/);
    }
  });
});

describe("shipment tracking validators", () => {
  it("trackShipmentParamSchema requires a non-empty trackingCode", () => {
    expect(() => trackShipmentParamSchema.parse({ trackingCode: "" })).toThrow();
    expect(trackShipmentParamSchema.parse({ trackingCode: "SHP-7K9QXR" })).toEqual({
      trackingCode: "SHP-7K9QXR",
    });
  });

  it("trackShipmentQuerySchema requires a phone number of reasonable length", () => {
    expect(() => trackShipmentQuerySchema.parse({ phone: "123" })).toThrow();
    expect(trackShipmentQuerySchema.parse({ phone: "08012345678" })).toEqual({
      phone: "08012345678",
    });
  });
});
