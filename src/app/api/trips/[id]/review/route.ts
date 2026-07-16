import { handle, ok, bad, requireUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { recomputeRating } from "@/lib/server";
import { notify } from "@/lib/mock/notifications";

// Both parties rate each other after delivery/payment. When both have rated,
// the trip closes and trip counts update.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));

    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: { load: true, winningBid: true, reviews: true },
    });
    if (!trip) return bad("Trip not found", 404);

    const posterId = trip.load.posterId;
    const carrierId = trip.winningBid.truckOwnerId;
    if (user.id !== posterId && user.id !== carrierId) return bad("You're not part of this trip", 403);
    if (trip.status !== "DELIVERED" && trip.status !== "PAID" && trip.status !== "CLOSED")
      return bad("You can rate once the trip is delivered");

    const toUserId = user.id === posterId ? carrierId : posterId;
    if (trip.reviews.some((r) => r.fromUserId === user.id))
      return bad("You've already rated this trip");

    const stars = Math.min(5, Math.max(1, Math.round(Number(body.stars) || 0)));
    const text = String(body.text ?? "").slice(0, 500);

    await prisma.review.create({
      data: { tripId: trip.id, fromUserId: user.id, toUserId, stars, text },
    });
    await recomputeRating(toUserId);
    await notify(toUserId, "REVIEW", `${user.name} left you a ${stars}★ review.`, `/trips/${trip.id}`);

    // Both sides rated → close the trip and bump completed counts.
    const reviewCount = trip.reviews.length + 1;
    let closed = false;
    if (reviewCount >= 2) {
      await prisma.trip.update({ where: { id: trip.id }, data: { status: "CLOSED" } });
      await prisma.load.update({ where: { id: trip.loadId }, data: { status: "CLOSED" } });
      await prisma.user.update({ where: { id: posterId }, data: { tripsCompleted: { increment: 1 } } });
      await prisma.user.update({ where: { id: carrierId }, data: { tripsCompleted: { increment: 1 } } });
      closed = true;
    }

    return ok({ closed });
  });
}
