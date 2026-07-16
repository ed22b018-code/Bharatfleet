import { handle, ok, bad, requireUser } from "@/lib/api";
import { prisma } from "@/lib/db";

// Poster closes the auction now (so demos don't wait for the timer).
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const load = await prisma.load.findUnique({ where: { id: params.id } });
    if (!load) return bad("Load not found", 404);
    if (load.posterId !== user.id) return bad("Only the poster can close this auction", 403);
    const updated = await prisma.load.update({
      where: { id: params.id },
      data: { auctionClosesAt: new Date() },
    });
    return ok({ load: updated });
  });
}
