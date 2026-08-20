# syntax=docker/dockerfile:1

# ---- Build stage: install dependencies, compile TypeScript, generate the Prisma client ----
FROM node:22-slim AS build

# OpenSSL is required by Prisma's query engine and for correct binary-target detection.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Using yarn, not npm — this project's package-lock.json isn't reliably
# kept in sync (development happened via `yarn install`/`yarn test`
# throughout), so yarn.lock is the lockfile that actually reflects what's
# been tested. --frozen-lockfile fails the build if package.json and
# yarn.lock ever drift apart, instead of silently installing something
# different than what was tested.
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Generate the Prisma client against the schema (no DB connection needed here).
COPY prisma ./prisma
RUN npx prisma generate

# Compile TypeScript (and the still-untouched .js files, via allowJs) to dist/.
COPY tsconfig.json ./
COPY src ./src
RUN yarn build

# ---- Runtime stage: minimal image that runs the compiled app ----
FROM node:22-slim AS runtime

# Prisma's query engine needs OpenSSL at runtime as well.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
# Most hosting platforms (Render, Railway, Cloud Run, etc.) inject their
# own PORT at runtime and this gets overridden automatically — the app
# already reads process.env.PORT in server.ts. This default only applies
# when running the container locally without setting PORT explicitly.
ENV PORT=8080

# Production-only dependencies for the runtime image.
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

# Prisma client must be generated again here too, against the same schema,
# so the runtime image has its own matching client rather than relying on
# whatever got copied from the build stage's node_modules.
COPY prisma ./prisma
RUN npx prisma generate

# Compiled output and swagger config from the build stage.
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node swagger.js ./swagger.js

# Run as an unprivileged user.
USER node

# Documentation only; the actual port is whatever PORT resolves to at runtime.
EXPOSE 8080

# Database migrations (`prisma migrate deploy`) are intentionally NOT run here —
# run them as a separate step in your hosting platform's deploy pipeline
# (a pre-deploy command, a one-off release job, etc.) that has DB access,
# not baked into the image itself.
CMD ["node", "dist/server.js"]