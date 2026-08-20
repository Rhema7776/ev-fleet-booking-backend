import request from "supertest";
import app from "../src/app";

describe("app", () => {
  it("GET / returns a running message", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "EV Fleet Booking API is running" });
  });

  it("unknown routes return a 404 in the standard envelope", async () => {
    const res = await request(app).get("/api/v1/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("GET /api-docs.json serves the swagger spec", async () => {
    const res = await request(app).get("/api-docs.json");
    expect(res.status).toBe(200);
    expect(res.body.info.title).toBe("EV Fleet Booking API");
  });

  it("auth endpoints reject invalid input with a 400 (validation actually runs)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "not-an-email", password: "" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });
});
