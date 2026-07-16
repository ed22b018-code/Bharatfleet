"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBadge, VerifiedBadge, Stars } from "./ui";
import { inr, km, tonnes } from "@/lib/format";
import { countdown } from "@/lib/format";
import { TRUCK_TYPE_LABELS } from "@/lib/constants";

export default function LoadCard({ load }: { load: any }) {
  // Live-updating countdown label.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const closed = countdown(load.auctionClosesAt) === "Closed";
  const poster = load.poster;

  return (
    <Link href={`/loads/${load.id}`} className="card block p-4 transition hover:border-brand-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-base font-bold text-ink">
            <span className="truncate">{load.pickupCity}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-slate-400">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="truncate">{load.dropCity}</span>
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            {km(load.distanceKm)} · {tonnes(load.weightTonnes)} · {load.materialType}
          </div>
        </div>
        <StatusBadge status={load.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="font-semibold text-ink">
          {inr(load.estMinPrice)}–{inr(load.estMaxPrice)}
          <span className="ml-1 text-xs font-normal text-slate-400">est.</span>
        </span>
        <span className="badge bg-slate-100 text-slate-600">{TRUCK_TYPE_LABELS[load.truckType] ?? load.truckType}</span>
        {load.fragile && <span className="badge bg-rose-50 text-rose-600">Fragile</span>}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2 text-xs">
          {poster && (
            <>
              <span className="font-medium text-slate-600">{poster.businessName || poster.name}</span>
              <VerifiedBadge verified={poster.verified} />
              <Stars value={poster.avgRating} />
            </>
          )}
        </div>
        <div className="text-right">
          {typeof load.bidCount === "number" && (
            <div className="text-xs text-slate-500">
              {load.bidCount} bid{load.bidCount === 1 ? "" : "s"}
              {load.lowestBid != null && <span className="font-semibold text-emerald-600"> · low {inr(load.lowestBid)}</span>}
            </div>
          )}
          <div className={`text-xs font-semibold ${closed ? "text-slate-400" : "text-brand-600"}`}>
            {closed ? "Auction closed" : `⏱ ${countdown(load.auctionClosesAt)}`}
          </div>
        </div>
      </div>
    </Link>
  );
}
