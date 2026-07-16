"use client";

import Link from "next/link";
import { api } from "@/lib/client";
import { usePolling } from "@/hooks/usePolling";
import { StatusBadge, Empty, Spinner } from "@/components/ui";
import { inr, km, tonnes } from "@/lib/format";

export default function TripsPage() {
  const { data, loading } = usePolling<{ trips: any[] }>(() => api("/api/trips"), 3000);
  const trips = data?.trips ?? [];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">My Trips</h1>
      {loading && !data ? (
        <Spinner />
      ) : trips.length === 0 ? (
        <Empty title="No trips yet" hint="Accepted bids become trips you can track here." />
      ) : (
        <div className="space-y-3">
          {trips.map((t) => (
            <Link key={t.id} href={`/trips/${t.id}`} className="card block p-4 transition hover:border-brand-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold">
                  {t.load.pickupCity}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t.load.dropCity}
                </div>
                <StatusBadge status={t.status} />
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                <span>{km(t.load.distanceKm)} · {tonnes(t.load.weightTonnes)} · {t.load.materialType}</span>
                <span className="font-semibold text-ink">{inr(t.winningBid.amount)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
