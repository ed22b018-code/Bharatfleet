import { cookies } from "next/headers";
import { prisma } from "./db";
import { SESSION_COOKIE } from "./constants";

// Simple cookie-backed session. The cookie just holds a userId.
// The demo role-switcher flips this cookie to jump between seeded users.
// TODO: replace with real auth/session (JWT, NextAuth, etc.)

export function getSessionUserId(): string | null {
  return cookies().get(SESSION_COOKIE)?.value ?? null;
}

export async function getCurrentUser() {
  const id = getSessionUserId();
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}
