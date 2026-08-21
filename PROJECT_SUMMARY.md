# EV Fleet Booking API — My Summary

*A plain-language account of the work I did on this backend, for my own reference and to talk through at review.*

---

## 1. The big picture

I inherited a working but rough backend written in plain JavaScript. My
goal was to turn it into something I could confidently call
**TypeScript-based, tested, documented, and deployable** — the kind of
codebase a serious team would trust, and to do it by actually going
through the code carefully rather than making surface-level changes.

Here's what that meant in practice, module by module.

---

## 2. What the TypeScript conversion actually involved

Plain JavaScript lets you write almost anything without the computer
checking your work first — mistakes only show up when the code actually
runs, sometimes in front of a real user. TypeScript adds a layer that
checks your work *before* it runs, catching a whole category of bugs
early.

This wasn't a mechanical find-and-replace. Along the way, I found and
fixed several **real problems in the original code**:

### A hidden, broken login function
The original `login` code was accidentally written *twice* — once
normally, and once buried inside the error-handling code of a *different*
function (`register`). That buried copy would only ever run if
registration itself failed, which almost never happens in normal use. So
the login logic that customers actually used was disconnected from the
rest of the system's error handling and bypassed the standard process
every other function used. I found this, unified it into one correct
implementation.

### Inconsistent error handling
Every function used to have its own copy-pasted "if something goes wrong,
send back this message" code. I replaced that with one central place that
decides what the user sees when something fails, with every function just
reporting the problem to it. Consistent, and much harder to accidentally
leak sensitive error details to a user.

### Validation that existed in name only
There were files literally named "validator" that were empty — nothing
was actually checking incoming data before the app used it. I made this
real: every endpoint now checks its inputs before doing anything with
them, and rejects bad requests with a clear explanation instead of
crashing or silently doing the wrong thing.

### A framework-level bug I caught while building
While adding a filtering/search feature, I found a genuine bug in how the
newest version of Express (the underlying web framework) handles
search-query data — data that looked validated was actually being
silently discarded, because of a change in how that framework works
under the hood. I caught it, proved it with a real test, and fixed it
properly.

### Sensitive data was being printed to the server logs
Some of the original code printed sensitive data (verification codes,
full user records) to the console for debugging — which on a real
deployed server means that data sits in log files. I removed all of it.

---

## 3. Module-by-module, in plain terms

| Module | What it does | Status |
|---|---|---|
| **Auth** (login/register/OTP, plus Google/Facebook/Apple sign-in) | Signing up, logging in, verifying email/phone, password reset, social login | Done, tested |
| **Vehicles** | Managing cars in the fleet | Done, tested |
| **Drivers** | Managing drivers, optionally linked to a car | Done, tested |
| **Fleet Owners** | Company profiles that own vehicles | Done, tested |
| **Enterprises** | Business-account profiles | Done, tested |
| **Shipments** | Logistics tracking, including a public tracking code (like a courier tracking number) usable without logging in | Done, tested |
| **Notifications** | In-app alerts to users | Done, tested |
| **Wallet** | Balance + a real transaction history (fund/debit), not just an editable number | Done, tested |
| **Bank lookup** | Bank name lookup and account number confirmation | Done