# EV Fleet Booking API — Backend

## Project status

This backend went through a full TypeScript conversion, module-by-module
audit, and Dockerization pass. For the full story in plain language, see
[`PROJECT_SUMMARY.md`](./PROJECT_SUMMARY.md).
For the current state of the Booking module specifically — two of three
booking modes are fully implemented and tested, the third is deliberately
deferred with documented reasons — see
[`BOOKING_STATUS.md`](./BOOKING_STATUS.md).

## Setup

```bash
yarn install
npx prisma generate
npx prisma migrate dev
yarn dev
```

Server runs on `http://localhost:3000` by default. Swagger docs available at `/api-docs` once running.

## Testing

```bash
yarn typecheck
yarn test
```

## Running with Docker

```bash
docker build -t ev-fleet-booking-api .
docker run --rm --env-file .env -p 3000:3000 ev-fleet-booking-api
```

The `--rm` flag automatically cleans up the container once it stops.
Requires Docker Desktop with WSL2 (Windows) or Docker Desktop (Mac/Linux)
already installed and running.

## ENVIRONMENTAL VARIABLES

Copy `.env.example` to `.env` and fill in the values below. **Never commit `.env` to git** — it's already in `.gitignore`.

### Core / Database

| Variable | Description | Where to get it |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Ask a team lead for the shared dev DB, or set up your own local Postgres instance |
| `JWT_SECRET` | Signs access tokens | Generate your own locally: `openssl rand -hex 32`. Must match across all instances hitting the same DB/users. |
| `JWT_REFRESH_SECRET` | Signs refresh tokens | Same as above, generate a **different** random string |

### Email (OTP / verification)

| Variable | Description |
|---|---|
| `EMAIL_USER` | Sending account email address |
| `EMAIL_PASS` | App-specific password (not your real account password) |

### API Base URL

| Variable | Description |
|---|---|
| `API_BASE_URL` | Public URL of this backend once deployed (e.g. `https://api-dev.yourcompany.com`). Leave commented out while testing purely locally. |

### Google Sign-In

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | OAuth Web Client ID from Google Cloud Console → APIs & Services → Credentials. Same value as frontend's `VITE_GOOGLE_CLIENT_ID`. |

### Facebook Login

| Variable | Description |
|---|---|
| `FACEBOOK_APP_ID` | From Meta for Developers → your app → Settings → Basic. Same value as frontend's `VITE_FACEBOOK_APP_ID`. |
| `FACEBOOK_APP_SECRET` | Same page as above. **Backend-only — never expose in frontend code or share outside the backend team.** |

**Meta app config checklist** (Settings → Basic / Facebook Login → Settings):
- `App Domains`: add both `localhost` and the deployed frontend domain
- `Site URL` (under Add Platform → Website): the deployed frontend URL, e.g. `https://your-frontend-domain.com`
- `Valid OAuth Redirect URIs`: only needed for the deployed URL — `localhost` is auto-allowed in Development mode, don't add it manually
- While the app is in **Development mode**, only accounts listed under **Roles** (Admins/Developers/Testers) can log in — add your test account there

### Apple Sign-In

*(Requires Apple Developer Program enrollment — $99/year, org decision pending. These stay blank until credentials exist.)*

| Variable | Description |
|---|---|
| `APPLE_TEAM_ID` | Apple Developer account → Membership |
| `APPLE_KEY_ID` | From the Key generated under Certificates, Identifiers & Profiles → Keys |
| `APPLE_PRIVATE_KEY` | Contents of the downloaded `.p8` file. Treat as a secret — never commit. If storing in `.env` directly, escape newlines as `\n` and unescape in code, or store as base64. |
| `APPLE_CLIENT_ID` | The Services ID you create (e.g. `com.thecompany.evfleet.web`) — used for the **web** flow. Same value as frontend's `VITE_APPLE_CLIENT_ID`. |
| `APPLE_BUNDLE_ID` | The App ID / Bundle ID from the **mobile** app (get this from the mobile dev once their Xcode project is set up) — used to validate tokens from the native app |

| `PAYSTACK_SECRET_KEY`Important for bank detail input .get this from your Paystack Dashboard
PAYSTACK_SECRET_KEY=your_paystack_secret_key_here

## Notes for the team

- Access tokens are short-lived (`15m` in production config). If testing locally is painful, temporarily bump `expiresIn` in `src/utils/token.ts` — **do not commit that change**.
- Role-based access: `POST /api/v1/vehicles` requires the requester to either own the fleet (`FLEET_OWNER` + ownership check) or be `ADMIN`/`MASTER_AGENT`.
- Full API spec is generated live from JSDoc comments in the route files (see `swagger.js`) — no separate export step needed, just visit `/api-docs` on a running server.