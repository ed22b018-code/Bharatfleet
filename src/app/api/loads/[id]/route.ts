import { handle, ok, bad } from "@/lib/api";
import { prisma } from "@/lib/db";
import { isAuctionClosed } from "@/lib/server";

// Load detail with ranked bids (lowest-first), poster, and trip if any.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const load = await prisma.load.findUnique({
      where: { id: params.id },
      include: {
        poster: true,
        bids: {
          orderBy: { amount: "asc" }, // reverse auction: lowest is best
          include: {
            truckOwner: {
              select: {
                id: true,
                name: true,
                verified: true,
                avgRating: true,
                ratingCount: true,
                fleetSize: true,
                truckTypes: true,
                tripsCompleted: true,
                onTimePct: true,
              },
            },
          },
        },
        trip: true,
      },
    });
    if (!load) return bad("Load not found", 404);
    return ok({ load, auctionClosed: isAuctionClosed(load) });
  });
}
