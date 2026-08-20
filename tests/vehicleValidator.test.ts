import {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleIdParamSchema,
  listVehiclesQuerySchema,
} from "../src/validators/vehicleValidator";

describe("vehicleValidator", () => {
  it("createVehicleSchema accepts valid input and defaults isElectric to true", () => {
    const result = createVehicleSchema.parse({
      name: "Tesla Model 3",
      plate: "ABC-123-XY",
      category: "EXECUTIVE",
      pricePerHour: 25,
    });
    expect(result.isElectric).toBe(true);
  });

  it("createVehicleSchema rejects a non-positive price", () => {
    expect(() =>
      createVehicleSchema.parse({
        name: "Tesla Model 3",
        plate: "ABC-123-XY",
        category: "EXECUTIVE",
        pricePerHour: 0,
      })
    ).toThrow();
  });

  it("createVehicleSchema rejects an invalid category", () => {
    expect(() =>
      createVehicleSchema.parse({
        name: "Tesla Model 3",
        plate: "ABC-123-XY",
        category: "LUXURY",
        pricePerHour: 25,
      })
    ).toThrow();
  });

  it("vehicleIdParamSchema coerces a string param to a number", () => {
    const result = vehicleIdParamSchema.parse({ id: "42" });
    expect(result.id).toBe(42);
  });

  it("vehicleIdParamSchema rejects a non-numeric id", () => {
    expect(() => vehicleIdParamSchema.parse({ id: "not-a-number" })).toThrow();
  });

  it("listVehiclesQuerySchema defaults page/limit when omitted", () => {
    const result = listVehiclesQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it("updateVehicleSchema allows a partial update", () => {
    const result = updateVehicleSchema.parse({ status: "UNAVAILABLE" });
    expect(result.status).toBe("UNAVAILABLE");
  });
});
