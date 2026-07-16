import { prisma } from "./db";

// Deterministic 1-to-1 thread id for a (load, userA, userB) pair.
export function threadId(loadId: string, a: string, b: string) {
  const [x, y] = [a, b].sort();
  return `${loadId}:${x}:${y}`;
}

// Recompute a user's average rating from all reviews addressed to them.
export async function recomputeRating(userId: string) {
  const agg = await prisma.review.aggregate({
    where: { toUserId: userId },
    _avg: { stars: true },
    _count: { stars: true },
  });
  await prisma.user.update({
    where: { id: userId },
    data: {
      avgRating: Math.round((agg._avg.stars ?? 0) * 10) / 10,
      ratingCount: agg._count.stars,
    },
  });
}

// Whether a load's auction window has elapsed.
export function isAuctionClosed(load: { auctionClosesAt: Date; status: string }) {
  const biddingPhase = load.status === "POSTED" || load.status === "BIDDING";
  return !biddingPhase || Date.now() > new Date(load.auctionClosesAt).getTime();
}
