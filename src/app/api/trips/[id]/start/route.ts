import { handle, ok, bad, requireUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/mock/notifications";

// Truck owner starts the trip → IN_TRANSIT, movement begins.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: { load: true, winningBid: true },
    });
    if (!trip) return bad("Trip not found", 404);
    if (trip.winningBid.truckOwnerId !== user.id) return bad("Only the assigned carrier can start", 403);
    if (trip.status !== "ASSIGNED") return bad("Trip already started");

    const updated = await prisma.trip.update({
      where: { id: trip.id },
      data: { status: "IN_TRANSIT", startedAt: new Date(), progressPct: 0 },
    });
    await prisma.load.update({ where: { id: trip.loadId }, data: { status: "IN_TRANSIT" } });
    await notify(
      trip.load.posterId,
      "TRIP",
      `Your shipment ${trip.load.pickupCity} → ${trip.load.dropCity} is on the way. Track it live.`,
      `/trips/${trip.id}`
    );
    return ok({ trip: updated });
  });
}
