import Link from "next/link";

export function VerifiedBadge({ verified }: { verified: boolean }) {
  if (verified)
    return (
      <span className="badge bg-emerald-50 text-emerald-700">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2 3.5 5.5v5.6c0 4.8 3.3 9.3 8.5 10.9 5.2-1.6 8.5-6.1 8.5-10.9V5.5L12 2Zm-1.2 13.4-3.2-3.2 1.4-1.4 1.8 1.8 4.2-4.2 1.4 1.4-5.6 5.6Z" />
        </svg>
        Verified
      </span>
    );
  return (
    <span className="badge bg-amber-50 text-amber-700">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2 1 21h22L12 2Zm1 15h-2v-2h2v2Zm0-4h-2V9h2v4Z" />
      </svg>
      Unverified
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  POSTED: "bg-slate-100 text-slate-700",
  BIDDING: "bg-brand-50 text-brand-700",
  ASSIGNED: "bg-indigo-50 text-indigo-700",
  IN_TRANSIT: "bg-amber-50 text-amber-700",
  DELIVERED: "bg-teal-50 text-teal-700",
  PAID: "bg-emerald-50 text-emerald-700",
  CLOSED: "bg-slate-100 text-slate-600",
  WON: "bg-emerald-50 text-emerald-700",
  LOST: "bg-rose-50 text-rose-600",
  OPEN: "bg-brand-50 text-brand-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export function Stars({ value, count }: { value: number; count?: number }) {
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1 text-amber-500" title={`${value} average`}>
      <span aria-hidden className="tracking-tight">
        {"★★★★★".slice(0, full)}
        <span className="text-slate-300">{"★★★★★".slice(full)}</span>
      </span>
      <span className="text-xs font-semibold text-slate-600">
        {value ? value.toFixed(1) : "New"}
        {count != null && value ? ` (${count})` : ""}
      </span>
    </span>
  );
}

export function TrustRow({
  user,
}: {
  user: { tripsCompleted: number; onTimePct: number; memberSince: Date | string };
}) {
  const since = new Date(user.memberSince).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
      <span>{user.tripsCompleted} trips</span>
      <span>{user.onTimePct}% on-time</span>
      <span>Member since {since}</span>
    </div>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <div className="text-3xl">📦</div>
      <div className="font-semibold text-ink">{title}</div>
      {hint && <div className="max-w-xs text-sm text-slate-500">{hint}</div>}
    </div>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
      {label}
    </div>
  );
}

export function ProfileLink({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={`/profile/${id}`} className="font-semibold text-ink hover:text-brand-700 hover:underline">
      {children}
    </Link>
  );
}
