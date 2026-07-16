import { handle, ok, bad, requireUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { computeBreakdown } from "@/lib/mock/payments";
import { notify } from "@/lib/mock/notifications";
import { COMMISSION_PCT } from "@/lib/constants";
import { inr } from "@/lib/format";

// Load owner accepts one bid → Trip is created, other bids marked lost.
// Add-ons (insurance / fuel card) + commission are computed transparently.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const b = await req.json();

    const load = await prisma.load.findUnique({
      where: { id: params.id },
      include: { trip: true },
    });
    if (!load) return bad("Load not found", 404);
    if (load.posterId !== user.id) return bad("Only the poster can accept a bid", 403);
    if (load.trip) return bad("A bid has already been accepted for this load");

    const bid = await prisma.bid.findUnique({ where: { id: b.bidId } });
    if (!bid || bid.loadId !== load.id) return bad("Bid not found", 404);

    const insuranceOn = !!b.insuranceOn;
    const fuelCardOn = !!b.fuelCardOn;
    const cargoValue = Math.round(Number(b.cargoValue) || 0);

    const breakdown = computeBreakdown({
      winningBid: bid.amount,
      cargoValue,
      insuranceOn,
      fuelCardOn,
      commissionPct: COMMISSION_PCT,
    });

    // Mark winner/losers.
    await prisma.bid.update({ where: { id: bid.id }, data: { status: "WON" } });
    await prisma.bid.updateMany({
      where: { loadId: load.id, id: { not: bid.id } },
      data: { status: "LOST" },
    });

    const trip = await prisma.trip.create({
      data: {
        loadId: load.id,
        winningBidId: bid.id,
        status: "ASSIGNED",
        insuranceOn,
        fuelCardOn,
        cargoValue,
        commissionPct: COMMISSION_PCT,
        commissionAmount: breakdown.commissionAmount,
        addonsTotal: breakdown.addonsTotal,
        grandTotal: breakdown.grandTotal,
      },
    });

    await prisma.load.update({ where: { id: load.id }, data: { status: "ASSIGNED" } });

    await notify(
      bid.truckOwnerId,
      "WON",
      `You won the bid for ${load.pickupCity} → ${load.dropCity} at ${inr(bid.amount)}!`,
      `/trips/${trip.id}`
    );

    return ok({ trip });
  });
}
