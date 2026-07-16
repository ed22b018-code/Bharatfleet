import { RATE_PER_KM_PER_TONNE, PRICE_SPREAD } from "./constants";

// Rough fair-price estimate from distance x weight x a ₹/km/tonne heuristic.
// Returns a min/max band for guidance only.
export function estimatePrice(distanceKm: number, weightTonnes: number) {
  const base = distanceKm * weightTonnes * RATE_PER_KM_PER_TONNE;
  // Small fixed handling component so tiny loads aren't ~₹0.
  const mid = Math.round(base + 1500);
  const min = Math.round(mid * (1 - PRICE_SPREAD));
  const max = Math.round(mid * (1 + PRICE_SPREAD));
  return { estMinPrice: roundTo(min, 500), estMaxPrice: roundTo(max, 500) };
}

function roundTo(n: number, step: number) {
  return Math.round(n / step) * step;
}
