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

  // Regression test for a real privilege-escalation bug: registerSchema
  // originally accepted ANY Role enum value, including ADMIN and
  // MASTER_AGENT — meaning anyone hitting the public /auth/register
  // endpoint could self-assign an admin role with zero restriction.
  it.each(["ADMIN", "MASTER_AGENT", "SUB_AGENT"])(
    "registerSchema rejects privileged role '%s' at public registration",
    (privilegedRole) => {
      expect(() =>
        registerSchema.parse({
          fullName: "Jane Doe",
          email: "jane@example.com",
          phone: "08012345678",
          role: privilegedRole,
        })
      ).toThrow();
    }
  );

  it.each(["FLEET_OWNER", "INDIVIDUAL_PARTNER", "ENTERPRISE_PARTNER"])(
    "registerSchema still accepts legitimate self-registerable role '%s'",
    (safeRole) => {
      const result = registerSchema.parse({
        fullName: "Jane Doe",
        email: "jane@example.com",
        phone: "08012345678",
        role: safeRole,
      });
      expect(result.role).toBe(safeRole);
    }
  );

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