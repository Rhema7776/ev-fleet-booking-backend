import { loginSchema, registerSchema, resetPasswordSchema } from "../src/validators/authValidator";

describe("authValidator", () => {
  it("loginSchema accepts valid input and lowercases/trims email", () => {
    const result = loginSchema.parse({
      email: "  User@Example.com  ",
      password: "hunter2",
    });
    expect(result.email).toBe("user@example.com");
  });

  it("loginSchema rejects an invalid email", () => {
    expect(() =>
      loginSchema.parse({ email: "not-an-email", password: "x" })
    ).toThrow();
  });

  it("registerSchema rejects an unknown role", () => {
    expect(() =>
      registerSchema.parse({
        fullName: "Jane Doe",
        email: "jane@example.com",
        phone: "08012345678",
        role: "SUPERADMIN",
      })
    ).toThrow();
  });

  it("resetPasswordSchema rejects mismatched passwords", () => {
    expect(() =>
      resetPasswordSchema.parse({
        email: "jane@example.com",
        code: "123456",
        password: "newpassword1",
        confirmPassword: "different",
      })
    ).toThrow();
  });
});
