import { TRIP_DURATION_MS } from "../constants";

// ---- MOCK GPS / LIVE TRACKING --------------------------------------------
// No real device location. Position is interpolated along the straight line
// between pickup and drop, using elapsed time since the trip started.
// The whole journey is compressed to TRIP_DURATION_MS for the demo.
// TODO: replace with real telematics / driver-app GPS pings.

export type LatLng = { lat: number; lng: number };

export function progressFor(startedAt: Date | null): number {
  if (!startedAt) return 0;
  const elapsed = Date.now() - new Date(startedAt).getTime();
  const pct = Math.min(1, Math.max(0, elapsed / TRIP_DURATION_MS));
  return Math.round(pct * 100);
}

export function interpolate(a: LatLng, b: LatLng, pct: number): LatLng {
  const t = Math.min(1, Math.max(0, pct / 100));
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };
}

// Estimated time remaining (in the real-world compressed clock) as a string.
export function etaText(startedAt: Date | null, progressPct: number): string {
  if (!startedAt) return "Not started";
  if (progressPct >= 100) return "Arrived";
  const remainingMs = ((100 - progressPct) / 100) * TRIP_DURATION_MS;
  const mins = Math.ceil(remainingMs / 1000 / 60);
  const secs = Math.ceil(remainingMs / 1000);
  if (secs < 90) return `~${secs}s to drop (demo time)`;
  return `~${mins} min to drop (demo time)`;
}
