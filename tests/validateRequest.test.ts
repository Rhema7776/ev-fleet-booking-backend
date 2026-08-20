import express from "express";
import request from "supertest";
import { z } from "zod";
import { validateRequest } from "../src/middleware/validateRequest";
import { errorHandler } from "../src/middleware/errorHandler";

describe("validateRequest — query coercion (Express 5)", () => {
  const schema = z.object({
    page: z.coerce.number().int().positive().default(1),
  });

  const app = express();
  app.get("/items", validateRequest(schema, "query"), (req, res) => {
    res.json({
      validatedQueryPage: req.validatedQuery,
      rawQueryPage: req.query.page,
    });
  });
  app.use(errorHandler);

  it("coerces the query string into a real number on req.validatedQuery", async () => {
    const res = await request(app).get("/items?page=3");
    expect(res.status).toBe(200);
    expect(res.body.validatedQueryPage).toEqual({ page: 3 });
    // Documents the Express 5 behavior directly: req.query itself stays a string.
    expect(res.body.rawQueryPage).toBe("3");
  });

  it("applies the schema default when the query param is missing", async () => {
    const res = await request(app).get("/items");
    expect(res.status).toBe(200);
    expect(res.body.validatedQueryPage).toEqual({ page: 1 });
  });

  it("rejects an invalid value with a 400", async () => {
    const res = await request(app).get("/items?page=not-a-number");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
