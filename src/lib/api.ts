import { NextResponse } from "next/server";
import { getCurrentUser } from "./session";

export function ok(data: unknown = { ok: true }) {
  return NextResponse.json(data);
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Returns the current user or throws a Response to short-circuit the handler.
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw bad("Not logged in", 401);
  return user;
}

// Wrap a handler so thrown Responses become the response.
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return bad("Something went wrong", 500);
  }
}
