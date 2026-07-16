import { handle, ok, bad, requireUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { markPaid } from "@/lib/mock/payments";
import { notify } from "@/lib/mock/notifications";
import { inr } from "@/lib/format";

// Load owner releases (mock) payment → PAID.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: { load: true, winningBid: true },
    });
    if (!trip) return bad("Trip not found", 404);
    if (trip.load.posterId !== user.id) return bad("Only the load owner can release payment", 403);
    if (trip.status !== "DELIVERED") return bad("Trip must be delivered first");

    const paid = markPaid();
    const updated = await prisma.trip.update({
      where: { id: trip.id },
      data: { status: "PAID", paidAt: paid.paidAt },
    });
    await prisma.load.update({ where: { id: trip.loadId }, data: { status: "PAID" } });
    await notify(
      trip.winningBid.truckOwnerId,
      "PAYMENT",
      `Payment of ${inr(trip.winningBid.amount)} released for ${trip.load.pickupCity} → ${trip.load.dropCity}.`,
      `/trips/${trip.id}`
    );
    return ok({ trip: updated });
  });
}
