import { handle, ok, requireUser } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    const unread = notifications.filter((n) => !n.readAt).length;
    return ok({ notifications, unread });
  });
}
