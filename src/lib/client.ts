"use client";

// Tiny fetch wrapper for client components.
export async function api<T = any>(
  url: string,
  opts?: { method?: string; body?: any }
): Promise<T> {
  const res = await fetch(url, {
    method: opts?.method ?? (opts?.body ? "POST" : "GET"),
    headers: opts?.body ? { "Content-Type": "application/json" } : undefined,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Request failed");
  return data as T;
}
