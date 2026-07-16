import { handle, ok, bad } from "@/lib/api";
import { prisma } from "@/lib/db";
import { computeBreakdown } from "@/lib/mock/payments";
import { progressFor, interpolate, etaText } from "@/lib/mock/gps";

// Trip detail with LIVE simulated progress/position computed from startedAt.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: {
        load: { include: { poster: true } },
        winningBid: { include: { truckOwner: true } },
        reviews: { include: { fromUser: { select: { id: true, name: true } } } },
      },
    });
    if (!trip) return bad("Trip not found", 404);

    // While in transit, derive progress from elapsed (compressed) time.
    let progressPct = trip.progressPct;
    if (trip.status === "IN_TRANSIT") {
      progressPct = Math.max(trip.progressPct, progressFor(trip.startedAt));
      if (progressPct !== trip.progressPct) {
        await prisma.trip.update({ where: { id: trip.id }, data: { progressPct } });
      }
    }

    const load = trip.load;
    const pos = interpolate(
      { lat: load.pickupLat, lng: load.pickupLng },
      { lat: load.dropLat, lng: load.dropLng },
      progressPct
    );

    const breakdown = computeBreakdown({
      winningBid: trip.winningBid.amount,
      cargoValue: trip.cargoValue,
      insuranceOn: trip.insuranceOn,
      fuelCardOn: trip.fuelCardOn,
      commissionPct: trip.commissionPct,
    });

    return ok({
      trip: { ...trip, progressPct },
      position: pos,
      eta: etaText(trip.startedAt, progressPct),
      breakdown,
    });
  });
}
