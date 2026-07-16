import { handle, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return ok({ user: null, unread: 0 });
    const unread = await prisma.notification.count({
      where: { userId: user.id, readAt: null },
    });
    return ok({ user, unread });
  });
}
