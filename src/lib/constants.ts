// Bharatfleet — central tunables. Change these to reconfigure the demo.

export const ROLES = {
  LOAD_OWNER: "LOAD_OWNER",
  TRUCK_OWNER: "TRUCK_OWNER",
} as const;
export type Role = keyof typeof ROLES;

// Trip lifecycle (single source of truth for the state machine).
export const TRIP_STATES = [
  "POSTED",
  "BIDDING",
  "ASSIGNED",
  "IN_TRANSIT",
  "DELIVERED",
  "PAID",
  "CLOSED",
] as const;
export type TripState = (typeof TRIP_STATES)[number];

export const MATERIAL_TYPES = [
  "General Goods",
  "Perishables",
  "Machinery",
  "Chemicals",
  "Vehicles",
  "Other",
] as const;

export const TRUCK_TYPES = ["open", "container", "trailer", "reefer"] as const;
export type TruckType = (typeof TRUCK_TYPES)[number];

export const TRUCK_TYPE_LABELS: Record<string, string> = {
  open: "Open Body",
  container: "Container",
  trailer: "Trailer",
  reefer: "Reefer (Refrigerated)",
};

// ---- Demo tunables --------------------------------------------------------

// Auction window. SHORT by default so demos don't wait. (3 minutes)
export const AUCTION_WINDOW_MS = 3 * 60 * 1000;

// Whole simulated journey compressed to this duration for demo. (2 minutes)
export const TRIP_DURATION_MS = 2 * 60 * 1000;

// Platform commission — how Bharatfleet earns. Shown transparently.
export const COMMISSION_PCT = 5;

// Mock insurance premium as % of declared cargo value.
export const INSURANCE_PCT = 1.5;

// Mock flat fuel-card benefit (₹).
export const FUEL_CARD_BENEFIT = 2000;

// Pricing heuristic for the auto fair-price estimate.
export const RATE_PER_KM_PER_TONNE = 3.2; // ₹ / km / tonne (rough)
export const PRICE_SPREAD = 0.18; // ± band around the midpoint estimate

// OTP is always this in the prototype.
export const DEMO_OTP = "123456";

export const SESSION_COOKIE = "bf_uid";
