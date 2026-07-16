import { cookies } from "next/headers";
import { handle, ok } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/constants";

export async function POST() {
  return handle(async () => {
    cookies().delete(SESSION_COOKIE);
    return ok();
  });
}
