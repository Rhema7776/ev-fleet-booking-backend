# Booking Module — Status Note

**Status:** Straight/Regular, Reserve, and Dedicated modes are all
implemented and testable.

## What's implemented

### Straight/Regular mode
- Books by category + count against **current live availability**
  (`Vehicle.status = AVAILABLE`).
- Rate snapshotted from the cheapest currently-available vehicle in that
  category.

### Reserve mode
Based on the "Reserve economy booking" screens:

- **Requires a future `startTime`** — enforced in the validator
  ("Reservations require a future date and time", taken directly from
  the booking-details screen).
- **Wallet balance gate**: the booking agent's wallet must hold at least
  **NGN50,000** before a reservation can be created (from the
  "Insufficient wallet balance" screen). Ties into the real `Wallet`
  module already built — no separate balance tracking invented here.
- **Availability is checked differently than Straight mode.** The
  "Your reservation is set... no availability check needed on the day"
  copy implies the guarantee is made at booking time, not re-verified at
  pickup. So Reserve checks total fleet inventory in the category **minus
  vehicles already committed to any other non-cancelled booking whose
  time window overlaps the requested slot** — not just today's live
  status.
- **Pricing**: 1.5x the base per-vehicle rate.

### Dedicated mode
Built after a full review of the "Dedicated economy booking" screens.
Genuinely two-part, matching the confirmed business model (a monthly
exclusivity fee, plus per-trip billing on top for actual usage):

- **Claiming a vehicle** (`POST /api/v1/dedicated/claim`) — a new
  `DedicatedSubscription` model tracks exclusive access to one specific,
  real vehicle (not just a category, unlike Straight/Reserve). Starts as
  `PENDING_PAYMENT`, with a real Paystack transaction initialized for a
  flat **NGN1,500,000/month** rate.
- **Payment confirmation** — a Paystack webhook
  (`POST /api/v1/dedicated/webhook/paystack`), verified via HMAC SHA512
  signature (not trusted on request alone), flips the subscription to
  `ACTIVE` and marks the vehicle's status `DEDICATED` so it's no longer
  offered to anyone else.
- **Booking actual trips** with a dedicated vehicle reuses the normal
  `POST /api/v1/bookings` endpoint with `bookingMode: "DEDICATED"` — the
  server resolves which vehicle/subscription applies automatically from
  the caller's own active subscription, not from client input. Also
  checks the specific dedicated vehicle isn't already booked for an
  overlapping time — a real risk unique to this mode, since one physical
  car is now tied to one specific person instead of a shared category
  pool.
- **Per-trip rate**: confirmed via direct Figma review at 1.5x the
  vehicle's base rate — same multiplier as Reserve, not the 2x
  originally guessed below (see the correction in the next section).

## An inference I want flagged, not buried

**~~The Reserve/Dedicated rate multiplier (1.5x / 2x) is inferred, not
confirmed~~ — CORRECTED.** Originally guessed at 1x/1.5x/2x from a
"N10k/N15k/N20k" pattern on the mode-selection screen. Direct review of
the actual Dedicated claim screen ("Make this vehicle yours?") showed
**N15,000/hr for a vehicle whose own base rate is N10,000 — that's 1.5x,
the same as Reserve, not 2x.** `MODE_RATE_MULTIPLIER.DEDICATED` has been
corrected from 2 to 1.5 in `bookingService.ts`. If this changes again
with more design confirmation, that constant is still the one place to
update.

## Schema changes from the original stub

(See earlier versions of this note for the full original redesign —
vehicleId -> vehicleCategory + vehicleCount, destination ->
dropoffLocation, bookingDate -> startTime/endTime + optional
pickupTime/dropoffTime, hoursBooked Int -> Decimal, totalAmount Float ->
Decimal, added bookingMode/priority/driverId.) Dedicated mode added two
new things beyond what Reserve needed: the `DedicatedSubscription` model
itself, and `Booking.dedicatedSubscriptionId` (optional — only set for
DEDICATED bookings, links a specific trip back to which subscription/
vehicle it used).

## Open items — flagged, not silently resolved

- Same items as before, still unresolved: the startTime/endTime vs
  pickupTime/dropoffTime split, the "2 cars" vs "1 Economy car"
  inconsistency spotted early on, and the "Rides" screen's tab labeled
  "Regular" not matching the STRAIGHT enum value 1:1.
- Reserve's two confirmation states (pending vs. day-of/live) are still
  assumed to map to existing BookingStatus transitions
  (CONFIRMED -> IN_PROGRESS) — nothing automates that transition yet;
  it's a manual PUT by an admin/master-agent today.
- **New, from Dedicated:** there's no recurring billing job. The first
  month's payment is real (Paystack transaction, webhook-confirmed), but
  `nextPaymentDate` is only ever *tracked*, not acted on — nothing
  currently charges a subscription automatically when that date arrives,
  or does anything if a renewal payment fails (no PAST_DUE transition
  logic exists yet, despite the enum value existing). A scheduled job
  (or admin-triggered renewal flow) is real, separate follow-up work,
  not something quietly assumed to be handled.
- Live map / real-time driver location remains intentionally out of
  scope — a clearly-labeled placeholder on the frontend, no location
  fields or real-time channel on the backend.