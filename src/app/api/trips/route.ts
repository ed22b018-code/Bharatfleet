import { handle, ok, requireUser } from "@/lib/api";
import { prisma } from "@/lib/db";

// All trips the current user is part of (as load owner or as carrier).
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const trips = await prisma.trip.findMany({
      where: {
        OR: [{ load: { posterId: user.id } }, { winningBid: { truckOwnerId: user.id } }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        load: { select: { pickupCity: true, dropCity: true, distanceKm: true, weightTonnes: true, materialType: true } },
        winningBid: { select: { amount: true, truckOwnerId: true, truckOwner: { select: { name: true } } } },
      },
    });
    return ok({ trips });
  });
}
