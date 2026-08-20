import { createBookingSchema, updateBookingSchema } from "../src/validators/bookingValidator";

describe("createBookingSchema", () => {
  const base = {
    vehicleCategory: "ECONOMY" as const,
    customerName: "Joel Idoko",
    customerPhone: "08012345678",
    pickupLocation: "Ibro Fish, 12 Fomella Avenue, Victoria Island",
    dropoffLocation: "The Victorious Church, TF Kuboye Street, Lekki",
    startTime: "2026-07-12T12:00:00Z",
    endTime: "2026-07-12T15:30:00Z",
  };

  it("accepts a valid Straight-mode booking and defaults bookingMode/vehicleCount/priority", () => {
    const result = createBookingSchema.parse(base);
    expect(result.bookingMode).toBe("STRAIGHT");
    expect(result.vehicleCount).toBe(1);
    expect(result.priority).toBe(false);
  });

  it("rejects endTime that is before or equal to startTime", () => {
    expect(() =>
      createBookingSchema.parse({ ...base, endTime: "2026-07-12T10:00:00Z" })
    ).toThrow();
    expect(() =>
      createBookingSchema.parse({ ...base, endTime: base.startTime })
    ).toThrow();
  });

  it("accepts RESERVE as a valid mode when startTime is in the future", () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days out
    const futureEnd = new Date(future.getTime() + 1000 * 60 * 60 * 4);
    const result = createBookingSchema.parse({
      ...base,
      bookingMode: "RESERVE",
      startTime: future.toISOString(),
      endTime: futureEnd.toISOString(),
    });
    expect(result.bookingMode).toBe("RESERVE");
  });

  it("rejects RESERVE mode when startTime is not in the future", () => {
    // base.startTime is a fixed past date (2026-07-12), fine for STRAIGHT
    // but should fail specifically because bookingMode is RESERVE.
    expect(() => createBookingSchema.parse({ ...base, bookingMode: "RESERVE" })).toThrow();
  });

  it("STRAIGHT mode does not require a future startTime", () => {
    // Same past date as above, but STRAIGHT (the default) — should pass.
    expect(() => createBookingSchema.parse(base)).not.toThrow();
  });

  it("rejects a vehicleCategory outside the known enum", () => {
    expect(() =>
      createBookingSchema.parse({ ...base, vehicleCategory: "LUXURY" })
    ).toThrow();
  });
});

describe("updateBookingSchema", () => {
  it("accepts a partial update with just priority", () => {
    expect(updateBookingSchema.parse({ priority: true })).toEqual({ priority: true });
  });

  it("accepts driverId as null (unassignment)", () => {
    expect(updateBookingSchema.parse({ driverId: null })).toEqual({ driverId: null });
  });
});
