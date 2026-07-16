import { handle, ok, bad, requireUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { computeBreakdown } from "@/lib/mock/payments";

// Toggle add-ons (insurance / fuel card) + set cargo value, then recompute the
// transparent price breakdown. Editable up to the point the trip starts.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: { load: true, winningBid: true },
    });
    if (!trip) return bad("Trip not found", 404);
    if (trip.load.posterId !== user.id) return bad("Only the load owner can change add-ons", 403);
    if (trip.status !== "ASSIGNED") return bad("Add-ons are locked once the trip starts");

    const b = await req.json();
    const insuranceOn = !!b.insuranceOn;
    const fuelCardOn = !!b.fuelCardOn;
    const cargoValue = Math.round(Number(b.cargoValue) || trip.cargoValue || 0);

    const breakdown = computeBreakdown({
      winningBid: trip.winningBid.amount,
      cargoValue,
      insuranceOn,
      fuelCardOn,
      commissionPct: trip.commissionPct,
    });

    const updated = await prisma.trip.update({
      where: { id: trip.id },
      data: {
        insuranceOn,
        fuelCardOn,
        cargoValue,
        addonsTotal: breakdown.addonsTotal,
        commissionAmount: breakdown.commissionAmount,
        grandTotal: breakdown.grandTotal,
      },
    });
    return ok({ trip: updated, breakdown });
  });
}
