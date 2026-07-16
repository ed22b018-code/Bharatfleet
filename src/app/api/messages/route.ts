import { handle, ok, bad, requireUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { threadId } from "@/lib/server";
import { notify } from "@/lib/mock/notifications";

// GET thread between current user and ?otherId= on ?loadId=. Marks incoming
// messages as read.
export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const sp = new URL(req.url).searchParams;
    const loadId = sp.get("loadId");
    const otherId = sp.get("otherId");
    if (!loadId || !otherId) return bad("loadId and otherId are required");

    const tid = threadId(loadId, user.id, otherId);
    await prisma.message.updateMany({
      where: { threadId: tid, receiverId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    const messages = await prisma.message.findMany({
      where: { threadId: tid },
      orderBy: { createdAt: "asc" },
    });
    return ok({ messages });
  });
}

// POST a new message.
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const { loadId, receiverId, text } = await req.json();
    if (!loadId || !receiverId || !String(text ?? "").trim())
      return bad("Message can't be empty");

    const load = await prisma.load.findUnique({ where: { id: loadId } });
    if (!load) return bad("Load not found", 404);

    const msg = await prisma.message.create({
      data: {
        threadId: threadId(loadId, user.id, receiverId),
        loadId,
        senderId: user.id,
        receiverId,
        text: String(text).trim(),
      },
    });
    await notify(
      receiverId,
      "CHAT",
      `${user.name}: ${String(text).trim().slice(0, 60)}`,
      `/chat/${loadId}/${user.id}`
    );
    return ok({ message: msg });
  });
}
