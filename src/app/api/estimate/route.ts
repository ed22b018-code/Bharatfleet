import { handle, ok, bad } from "@/lib/api";
import { findCity, haversineKm } from "@/lib/cities";
import { estimatePrice } from "@/lib/pricing";

// Live fair-price estimate for the post-load form.
export async function POST(req: Request) {
  return handle(async () => {
    const { pickup, drop, weightTonnes } = await req.json();
    const p = findCity(pickup ?? "");
    const d = findCity(drop ?? "");
    const w = Number(weightTonnes) || 0;
    if (!p || !d) return bad("Pick both cities from the list");
    if (w <= 0) return bad("Enter a weight");
    const distanceKm = haversineKm(p, d);
    const { estMinPrice, estMaxPrice } = estimatePrice(distanceKm, w);
    return ok({ distanceKm, estMinPrice, estMaxPrice });
  });
}
