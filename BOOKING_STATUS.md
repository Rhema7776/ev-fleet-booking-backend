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
vehicle's base pricePerHour