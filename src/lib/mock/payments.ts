import { COMMISSION_PCT, INSURANCE_PCT, FUEL_CARD_BENEFIT } from "../constants";

// ---- MOCK PAYMENTS / ESCROW / COMMISSION ---------------------------------
// No real money. Produces line items, totals and a commission figure.
// TODO: replace with a real PSP + escrow (Razorpay Route / Cashfree / bank escrow).

export type PriceBreakdown = {
  winningBid: number;
  insurance: number;
  fuelCard: number; // shown as a benefit (negative to the payer), "coming soon"
  addonsTotal: number;
  commissionPct: number;
  commissionAmount: number;
  grandTotal: number;
};

export function computeBreakdown(opts: {
  winningBid: number;
  cargoValue: number;
  insuranceOn: boolean;
  fuelCardOn: boolean;
  commissionPct?: number;
}): PriceBreakdown {
  const commissionPct = opts.commissionPct ?? COMMISSION_PCT;
  const insurance = opts.insuranceOn
    ? Math.round((opts.cargoValue * INSURANCE_PCT) / 100)
    : 0;
  // Fuel card is a mock benefit ("coming soon") — a discount line item.
  const fuelCard = opts.fuelCardOn ? -FUEL_CARD_BENEFIT : 0;
  const addonsTotal = insurance + fuelCard;
  const commissionAmount = Math.round((opts.winningBid * commissionPct) / 100);
  const grandTotal = opts.winningBid + addonsTotal + commissionAmount;
  return {
    winningBid: opts.winningBid,
    insurance,
    fuelCard,
    addonsTotal,
    commissionPct,
    commissionAmount,
    grandTotal,
  };
}

export function markPaid(): { status: "PAID"; paidAt: Date } {
  return { status: "PAID", paidAt: new Date() };
}
