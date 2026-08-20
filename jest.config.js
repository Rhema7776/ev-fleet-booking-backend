/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  clearMocks: true,
  // Jest's default `transformIgnorePatterns: ["/node_modules/"]` skips
  // transforming anything inside node_modules — fine for CommonJS
  // packages, but breaks on ESM-only ones (raw `export`/`import` syntax
  // Jest can't parse without transforming first). `jose` (pulled in by
  // jwks-rsa, used for Apple Sign-In JWT verification) is ESM-only.
  // This pattern un-ignores just that package so it gets transformed too.
  // If another ESM-only package surfaces the same error later, add its
  // name here with the same `|pattern` syntax.
  transformIgnorePatterns: ["/node_modules/(?!(jose)/)"],
  // Broadened from ts-jest's default .ts(x)-only transform to also cover
  // .js — needed so the now-un-ignored jose files actually get processed
  // (ts-jest handles plain JS fine too, since tsconfig has allowJs: true).
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": "ts-jest",
  },
};