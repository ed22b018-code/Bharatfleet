import { cookies } from "next/headers";
import { handle, ok, bad } from "@/lib/api";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/constants";

// DEMO role-switcher: instantly become another seeded user.
// TODO: remove for production — this exists only to demo both sides quickly.
export async function POST(req: Request) {
  return handle(async () => {
    const { userId } = await req.json();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return bad("User not found", 404);
    cookies().set(SESSION_COOKIE, user.id, { httpOnly: false, path: "/", sameSite: "lax" });
    return ok({ user });
  });
}
