import { handle, ok, bad, requireUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { isAuctionClosed } from "@/lib/server";
import { notify } from "@/lib/mock/notifications";
import { inr } from "@/lib/format";

// Place a bid (Truck Owner). Reverse auction — lower is more competitive.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    if (user.role !== "TRUCK_OWNER") return bad("Only truck owners can bid");

    const load = await prisma.load.findUnique({ where: { id: params.id } });
    if (!load) return bad("Load not found", 404);
    if (load.posterId === user.id) return bad("You can't bid on your own load");
    if (isAuctionClosed(load)) return bad("This auction has closed");

    const amount = Math.round(Number((await req.json()).amount));
    if (!amount || amount <= 0) return bad("Enter a valid bid amount");

    // One live bid per truck owner per load — update if they already bid.
    const existing = await prisma.bid.findFirst({
      where: { loadId: load.id, truckOwnerId: user.id, status: "OPEN" },
    });
    const bid = existing
      ? await prisma.bid.update({ where: { id: existing.id }, data: { amount } })
      : await prisma.bid.create({ data: { loadId: load.id, truckOwnerId: user.id, amount } });

    if (load.status === "POSTED") {
      await prisma.load.update({ where: { id: load.id }, data: { status: "BIDDING" } });
    }

    await notify(
      load.posterId,
      "BID",
      `${user.name} bid ${inr(amount)} on ${load.pickupCity} → ${load.dropCity}.`,
      `/loads/${load.id}`
    );

    return ok({ bid });
  });
}
