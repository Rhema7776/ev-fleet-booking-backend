# Booking Module — Status Note

**Status:** Straight/Regular and Reserve modes implemented and testable. Dedicated mode is recognized but not yet built.

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
  status. A vehicle showing AVAILABLE right now could still be
  unavailable for a future date already claimed by another reservation;
  this check accounts for that.
- **Pricing**: 1.5x the base per-vehicle rate.

## An inference I want flagged, not buried

**The Reserve/Dedicated rate multiplier (1.5x / 2x) is inferred, not
confirmed.** The mode-selection screen showed "From N10,000/hr" (Straight),
"From N15,000/hr" (Reserve), "From N20,000/hr" (Dedicated) for the same
economy tier — an exact 1x/1.5x/2x ratio. I modeled Reserve's rate as a
multiplier over Vehicle.pricePerHour rather than inventing a separate
rate table, since no independent Reserve pricing source was shown
anywhere. **If Reserve/Dedicated pricing is actually meant to be set
independently (not derived from the Straight rate), this needs to change**
— it would currently produce wrong prices the moment someone updates a
vehicle's base pricePerHour expecting only Straight-mode pricing to move.

## Schema changes from the original stub

(See the previous version of this note for the full original redesign —
vehicleId -> vehicleCategory + vehicleCount, destination -> dropoffLocation,
bookingDate -> startTime/endTime + optional pickupTime/dropoffTime,
hoursBooked Int -> Decimal, totalAmount Float -> Decimal, added bookingMode/
priority/driverId.) No further schema changes were needed for Reserve —
it reuses every field Straight mode already has.

## Open items — flagged, not silently resolved

- Same two items as before, still unresolved: the startTime/endTime
  vs pickupTime/dropoffTime split, and the "2 cars" vs "1 Economy
  car" inconsistency spotted early on.
- **New**: two distinct confirmation states were shown for Reserve — a
  "pending" state before the reservation date (static progress bar) and
  an "active" state on the day (live tracking, same as Straight's
  confirmation). This is assumed to map to existing BookingStatus
  transitions (CONFIRMED -> IN_PROGRESS) rather than needing new
  fields — no new status values were added. Worth confirming this
  assumption holds once the day-of transition logic (whatever triggers
  CONFIRMED -> IN_PROGRESS) is actually built; nothing automates that
  transition yet.
- The "Rides" screen's tab is labeled "Regular" where the API/enum
  uses STRAIGHT — fine internally, just noting the naming doesn't match
  1:1 if anyone's diffing API responses against the UI copy.

## Still not built

- **Dedicated mode** ("Get your own dedicated car" — one vehicle
  permanently assigned, from N20,000/hr) — its screen flow hasn't been
  reviewed yet. Selecting bookingMode: "DEDICATED" currently returns a
  clear 501 Not Implemented, not a fake success.
- **Live map / real-time driver location** — intentionally out of scope
  for this pass. No location fields, no real-time channel. Separate
  future workstream.
- **Automatic day-of status transitions** — nothing currently flips a
  Reserve booking from CONFIRMED to IN_PROGRESS when its date
  arrives; that's a manual PUT by an admin/master-agent today, not a
  scheduled job.
