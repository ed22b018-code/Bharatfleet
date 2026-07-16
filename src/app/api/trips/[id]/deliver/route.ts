import { handle, ok, bad, requireUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/mock/notifications";

// Truck owner marks the trip delivered → DELIVERED.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: { load: true, winningBid: true },
    });
    if (!trip) return bad("Trip not found", 404);
    if (trip.winningBid.truckOwnerId !== user.id) return bad("Only the assigned carrier can mark delivered", 403);
    if (trip.status !== "IN_TRANSIT") return bad("Trip is not in transit");

    const updated = await prisma.trip.update({
      where: { id: trip.id },
      data: { status: "DELIVERED", deliveredAt: new Date(), progressPct: 100 },
    });
    await prisma.load.update({ where: { id: trip.loadId }, data: { status: "DELIVERED" } });
    await notify(
      trip.load.posterId,
      "TRIP",
      `Shipment ${trip.load.pickupCity} → ${trip.load.dropCity} delivered. Please release payment.`,
      `/trips/${trip.id}`
    );
    return ok({ trip: updated });
  });
}
