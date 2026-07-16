// Indian-locale formatting helpers (₹ with lakh/crore comma grouping).

export function inr(amount: number): string {
  const n = Math.round(amount || 0);
  return "₹" + n.toLocaleString("en-IN");
}

export function km(n: number): string {
  return `${Math.round(n).toLocaleString("en-IN")} km`;
}

export function tonnes(n: number): string {
  return `${n} T`;
}

export function shortDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function dateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeOnly(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function memberSince(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

// mm:ss countdown from a target time; returns "Closed" once elapsed.
export function countdown(target: Date | string): string {
  const t = typeof target === "string" ? new Date(target) : target;
  const ms = t.getTime() - Date.now();
  if (ms <= 0) return "Closed";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
