import { handle, ok } from "@/lib/api";
import { prisma } from "@/lib/db";

// List users (used by the demo role-switcher). Optional ?role= filter.
export async function GET(req: Request) {
  return handle(async () => {
    const role = new URL(req.url).searchParams.get("role") ?? undefined;
    const users = await prisma.user.findMany({
      where: role ? { role } : undefined,
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });
    return ok({ users });
  });
}
