import { handle, ok, bad } from "@/lib/api";
import { prisma } from "@/lib/db";

// Public profile with reviews received.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) return bad("User not found", 404);
    const reviews = await prisma.review.findMany({
      where: { toUserId: user.id },
      orderBy: { createdAt: "desc" },
      include: { fromUser: { select: { id: true, name: true, role: true } } },
    });
    return ok({ user, reviews });
  });
}
