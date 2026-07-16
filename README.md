# 🚚 Bharatfleet

A freight-brokerage marketplace prototype for the Indian trucking market. It connects
**Load Owners** (people with cargo to move) with **Truck Owners** (fleet operators who
bid to carry it) through **open reverse-auction bidding, in-app chat, live tracking, and
two-way ratings**.

The whole product is built around one thesis: the Indian truck-freight market is stuck
offline because moving it online fails on **trust**. So trust + transparency are
first-class here — verified parties, open bidding, live tracking, transparent commission,
and ratings.

> **This is a prototype.** Every real-world system — KYC, payments/escrow, OTP, GPS,
> SMS/WhatsApp — is **simulated to always succeed** so nothing ever blocks the demo. Each
> mock lives in a clearly named module (`src/lib/mock/*`) with a `// TODO: replace with real X`
> seam, ready to swap for a real provider later.

---

## Tech stack

| Concern      | Choice                                                    |
| ------------ | --------------------------------------------------------- |
| App          | Next.js (App Router) + TypeScript, single `npm run dev`   |
| Database     | SQLite via Prisma (file-based, zero external setup)       |
| Styling      | TailwindCSS, mobile-first                                 |
| Maps         | Leaflet + OpenStreetMap tiles (**no API key**)            |
| Realtime     | Client polling every 2–3s (chat, tracking, countdowns) — **no websockets** |
| Server truth | Next API routes + Prisma                                  |

No paid keys, no external accounts, nothing to sign up for.

---

## Run it (single command dev)

```bash
# 1. Install dependencies
npm install

# 2. Create the SQLite database + tables (this also runs the seed automatically)
npx prisma migrate dev

# 3. (Re)seed rich demo data anytime — resets to a pristine, demoable state
npm run seed

# 4. Start the app
npm run dev
```

Then open **http://localhost:3000**.

> If port 3000 is busy, start on another port: `PORT=3100 npm run dev` (macOS/Linux) or
> `$env:PORT=3100; npm run dev` (PowerShell).

**Login:** any 10-digit phone number works and the OTP is always **`123456`** (shown on
screen and pre-filled). Or use the one-tap **demo accounts** on the login screen.

### Reset the demo

Re-run `npm run seed` to wipe and reseed. To rebuild the DB from scratch:
`npx prisma migrate reset --force` (drops, remigrates, reseeds).

---

## What's seeded

- **4 truck owners** with varied ratings (3.8–4.9), fleet sizes, truck types; some verified, some not.
- **3 load owners** with businesses (Acme Steel, FreshFarm, BuildMart).
- **Open loads** across real routes: Mumbai→Delhi, Chennai→Bengaluru, Kolkata→Patna,
  Ahmedabad→Jaipur, Hyderabad→Pune, Nagpur→Indore.
- **2 loads already in BIDDING** with 2–3 ranked bids each.
- **1 trip already IN_TRANSIT** (Nagpur→Indore) so live tracking works the moment you open the app.
- **1 CLOSED trip** with reviews so profiles show real history.

---

## Key demo controls

- **Demo: Switch user** (header) — instantly become any seeded load owner or truck owner
  without logging out. Essential for demoing both sides.
- **Close auction now** (poster, on a load) — skip the countdown.
- **Start Trip / Mark Delivered** (carrier, on a trip) — drive the tracking simulation.
- **Mark Paid** (load owner) — release mock payment.
- **Verify my account / mark unverified** (your profile) — flip the mock KYC state.

Tunables live in [`src/lib/constants.ts`](src/lib/constants.ts): auction window (default 3 min),
compressed journey duration (2 min), commission % (5%), insurance %, fuel-card benefit, OTP.

---

## Trip state machine

Everything (chat, tracking, add-ons, rating prompts) is gated off this:

```
POSTED → BIDDING → ASSIGNED → IN_TRANSIT → DELIVERED → PAID → CLOSED
```

`CLOSED` happens once **both** parties have submitted a rating.

---

## Project structure

```
prisma/
  schema.prisma        # data model (SQLite)
  seed.ts              # rich demo seed
src/
  app/                 # pages (App Router) + /api route handlers (server = source of truth)
  components/           # Header, RoleSwitcher, NotificationBell, LoadCard, TrackMap, ui, ...
  hooks/usePolling.ts  # 2–3s polling = our "realtime"
  lib/
    constants.ts       # all tunables (auction window, commission, OTP, ...)
    cities.ts          # Indian city coordinates + haversine distance
    pricing.ts         # fair-price estimate heuristic
    format.ts          # ₹ (Indian grouping), km, tonnes, dates, countdown
    mock/              # <-- swappable seams, each with a TODO comment
      auth.ts          #   phone+OTP (any number, OTP 123456)
      kyc.ts           #   verification (always passes)
      payments.ts      #   commission / insurance / totals (no real money)
      gps.ts           #   simulated truck movement along the route
      notifications.ts #   in-app bell instead of SMS/WhatsApp
```

To go live later, replace the body of each `src/lib/mock/*` module with a real provider —
the rest of the app calls these seams and won't need to change.

---

## 📋 Demo script (the full loop, ~3 minutes)

Do this on a phone-width window to see the mobile-first design. No code edits needed.

1. **Open** http://localhost:3000 → on the login screen, tap the demo account
   **“Anita Sharma” (Acme Steel Traders)** to log in as a **Load Owner**.
   _(Or: enter any 10-digit number → Get OTP → Continue with OTP `123456`.)_

2. **Post a load.** Bottom nav → **Post**. Pick **Mumbai → Delhi**, 20 tonnes, Container.
   Watch the **auto fair-price estimate** and distance update live. Tap **Post load & start auction**.

3. You land on the **load page** with a live **auction countdown**. Note the trust signals
   on your own profile in the header (Verified badge, ★ rating).

4. **Switch sides.** Header → **Demo: Switch user** → pick a truck owner, e.g. **Singh Cargo Movers**.
   You're now on the **Load Feed** (reverse auction). Open your Mumbai → Delhi load
   (use search/filters if needed).

5. **Place a bid** — enter a quote (e.g. `85000`) and tap **Bid**. Then tap **Chat with owner**
   and send a message like _“Can pick up at 9am, ₹85,000 ok?”_.

6. **Switch back** to **Anita Sharma** (Demo: Switch user). Open the load. See the
   **notification bell** light up, and **all bids ranked lowest-first** with each bidder's
   rating, verified badge, and fleet info. Read the chat.

7. Tap **Close auction now** (skip the timer), then **Accept** on the best bid.
   In the modal, toggle **Cargo Insurance** and **Fuel Card**, set a cargo value, and watch the
   **transparent price breakdown**: winning bid + add-ons + **5% platform commission = grand total**.
   Tap **Confirm & assign trip**.

8. You're on the **Trip** page (status **ASSIGNED**). **Switch to the winning truck owner**
   and tap **🚚 Start Trip**.

9. **Watch live tracking** — the truck marker moves along the Mumbai→Delhi line on the Leaflet map,
   with **live ETA** and **% complete** (the whole journey is compressed to ~2 minutes). When it
   arrives, tap **📦 Mark Delivered**.

10. **Switch back to the load owner** → tap **💳 Mark Paid**.

11. **Both sides rate.** As the load owner, leave a ★ rating + review. **Switch to the truck owner**
    and do the same. After the second review the trip flips to **CLOSED** and both avg ratings update.

12. On the trip, open **LR / e-way-bill** → a clean, **printable** receipt (trip id, both parties,
    route, weight, full price breakdown, dates). Use **Print / Save PDF**.

✅ That's the entire loop: **post → estimate → bid → chat → close → accept + add-ons (commission) →
start → live tracking + ETA → deliver → pay → two-way ratings → generated LR/e-way-bill.**
