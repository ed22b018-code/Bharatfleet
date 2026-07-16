import { handle, ok, requireUser } from "@/lib/api";
import { prisma } from "@/lib/db";

// Mark all of the current user's notifications as read.
export async function POST() {
  return handle(async () => {
    const user = await requireUser();
    await prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return ok();
  });
}
