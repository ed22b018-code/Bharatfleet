import { handle, ok, bad, requireUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { findCity, haversineKm } from "@/lib/cities";
import { estimatePrice } from "@/lib/pricing";
import { AUCTION_WINDOW_MS } from "@/lib/constants";

// GET /api/loads — feed for truck owners (filters) OR a poster's own loads.
export async function GET(req: Request) {
  return handle(async () => {
    const sp = new URL(req.url).searchParams;
    const posterId = sp.get("posterId") ?? undefined;
    const truckType = sp.get("truckType") ?? undefined;
    const material = sp.get("material") ?? undefined;
    const q = (sp.get("q") ?? "").trim().toLowerCase();

    const where: any = {};
    if (posterId) {
      where.posterId = posterId; // "my loads"
    } else {
      where.status = { in: ["POSTED", "BIDDING"] }; // open feed
    }
    if (truckType) where.truckType = truckType;
    if (material) where.materialType = material;

    let loads = await prisma.load.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        poster: {
          select: { id: true, name: true, businessName: true, verified: true, avgRating: true, ratingCount: true },
        },
        bids: { select: { amount: true } },
        trip: { select: { id: true, status: true } },
      },
    });

    if (q) {
      loads = loads.filter(
        (l) =>
          l.pickupCity.toLowerCase().includes(q) ||
          l.dropCity.toLowerCase().includes(q)
      );
    }

    const result = loads.map((l) => {
      const amounts = l.bids.map((b) => b.amount);
      return {
        ...l,
        bids: undefined,
        bidCount: amounts.length,
        lowestBid: amounts.length ? Math.min(...amounts) : null,
      };
    });

    return ok({ loads: result });
  });
}

// POST /api/loads — create a new load (Load Owner).
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const b = await req.json();

    const p = findCity(b.pickupCity ?? "");
    const d = findCity(b.dropCity ?? "");
    if (!p || !d) return bad("Pick both pickup and drop cities from the list");

    const weightTonnes = Number(b.weightTonnes) || 1;
    const distanceKm = haversineKm(p, d);
    const { estMinPrice, estMaxPrice } = estimatePrice(distanceKm, weightTonnes);

    const load = await prisma.load.create({
      data: {
        posterId: user.id,
        pickupCity: p.name,
        dropCity: d.name,
        pickupLat: p.lat,
        pickupLng: p.lng,
        dropLat: d.lat,
        dropLng: d.lng,
        distanceKm,
        pickupAt: b.pickupAt ? new Date(b.pickupAt) : new Date(Date.now() + 24 * 3600 * 1000),
        deliverBy: b.deliverBy ? new Date(b.deliverBy) : new Date(Date.now() + 3 * 24 * 3600 * 1000),
        weightTonnes,
        materialType: b.materialType || "General Goods",
        truckType: b.truckType || "open",
        numTrucks: Number(b.numTrucks) || 1,
        fragile: !!b.fragile,
        loadingResponsibility: b.loadingResponsibility || "Load Owner",
        notes: b.notes || "",
        estMinPrice,
        estMaxPrice,
        status: "BIDDING", // open for bids immediately
        auctionClosesAt: new Date(Date.now() + AUCTION_WINDOW_MS),
      },
    });

    return ok({ load });
  });
}
