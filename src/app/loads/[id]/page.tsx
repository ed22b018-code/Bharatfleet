"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { usePolling } from "@/hooks/usePolling";
import { useSession } from "@/components/Session";
import { useToast } from "@/components/Toast";
import { StatusBadge, VerifiedBadge, Stars, ProfileLink, Spinner, Empty } from "@/components/ui";
import { inr, km, tonnes, countdown, dateTime } from "@/lib/format";
import { TRUCK_TYPE_LABELS } from "@/lib/constants";
import { computeBreakdown } from "@/lib/mock/payments";

export default function LoadDetailPage({ params }: { params: { id: string } }) {
  const { user } = useSession();
  const { push } = useToast();
  const router = useRouter();

  const { data, loading, refresh } = usePolling<{ load: any; auctionClosed: boolean }>(
    () => api(`/api/loads/${params.id}`),
    2500,
    [params.id]
  );

  const [bidAmount, setBidAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [acceptBid, setAcceptBid] = useState<any | null>(null);

  if (loading && !data) return <Spinner />;
  if (!data?.load) return <Empty title="Load not found" />;

  const load = data.load;
  const closed = data.auctionClosed || countdown(load.auctionClosesAt) === "Closed";
  const isPoster = user?.id === load.posterId;
  const isTruck = user?.role === "TRUCK_OWNER";
  const myBid = load.bids.find((b: any) => b.truckOwnerId === user?.id);

  async function placeBid() {
    setBusy(true);
    try {
      await api(`/api/loads/${params.id}/bids`, { body: { amount: Number(bidAmount) } });
      push("Bid placed!");
      setBidAmount("");
      refresh();
    } catch (e: any) {
      push(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function closeAuction() {
    setBusy(true);
    try {
      await api(`/api/loads/${params.id}/close-auction`, { body: {} });
      push("Auction closed. Pick a bid to accept.", "info");
      refresh();
    } catch (e: any) {
      push(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Route + meta */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-xl font-extrabold">
            {load.pickupCity}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {load.dropCity}
          </div>
          <StatusBadge status={load.status} />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Meta label="Distance" value={km(load.distanceKm)} />
          <Meta label="Weight" value={tonnes(load.weightTonnes)} />
          <Meta label="Truck" value={TRUCK_TYPE_LABELS[load.truckType] ?? load.truckType} />
          <Meta label="Material" value={load.materialType} />
          <Meta label="Pickup" value={dateTime(load.pickupAt)} />
          <Meta label="Deliver by" value={dateTime(load.deliverBy)} />
          <Meta label="Trucks" value={String(load.numTrucks)} />
          <Meta label="Loading" value={load.loadingResponsibility} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-800">
            Est. {inr(load.estMinPrice)}–{inr(load.estMaxPrice)}
          </span>
          {load.fragile && <span className="badge bg-rose-50 text-rose-600">Fragile</span>}
          <span className={`badge ${closed ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-700"}`}>
            {closed ? "Auction closed" : `⏱ ${countdown(load.auctionClosesAt)} left`}
          </span>
        </div>

        {load.notes && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">“{load.notes}”</p>}

        <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 text-sm">
          <span className="text-slate-500">Posted by</span>
          <ProfileLink id={load.poster.id}>{load.poster.businessName || load.poster.name}</ProfileLink>
          <VerifiedBadge verified={load.poster.verified} />
          <Stars value={load.poster.avgRating} count={load.poster.ratingCount} />
        </div>
      </div>

      {/* Trip link if accepted */}
      {load.trip && (
        <Link href={`/trips/${load.trip.id}`} className="btn-primary w-full">
          View trip & live tracking →
        </Link>
      )}

      {/* Truck owner: place a bid */}
      {isTruck && !isPoster && !load.trip && (
        <div className="card p-5">
          <h2 className="mb-1 font-bold">{myBid ? "Update your bid" : "Place your bid"}</h2>
          <p className="mb-3 text-xs text-slate-500">Reverse auction — the lowest competitive bid wins.</p>
          {closed ? (
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">This auction has closed for new bids.</div>
          ) : (
            <div className="flex gap-2">
              <div className="flex flex-1 items-center rounded-xl border border-slate-300 px-3">
                <span className="text-slate-500">₹</span>
                <input
                  className="w-full bg-transparent px-2 py-2.5 text-sm outline-none"
                  inputMode="numeric"
                  placeholder={myBid ? String(myBid.amount) : "Your quote"}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <button className="btn-primary" disabled={busy || !bidAmount} onClick={placeBid}>
                {myBid ? "Update" : "Bid"}
              </button>
            </div>
          )}
          {myBid && (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm">
              <span className="text-emerald-700">Your current bid: <b>{inr(myBid.amount)}</b></span>
              <Link href={`/chat/${load.id}/${load.posterId}`} className="font-semibold text-brand-700 hover:underline">
                Chat with owner
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Bids list — poster sees ranked bids w/ accept; others see the leaderboard */}
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Bids ({load.bids.length})</h2>
          {isPoster && !closed && !load.trip && (
            <button className="btn-ghost text-xs" disabled={busy} onClick={closeAuction}>
              Close auction now
            </button>
          )}
        </div>

        {load.bids.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No bids yet — they&apos;ll appear here live.</p>
        ) : (
          <div className="space-y-2">
            {load.bids.map((b: any, i: number) => (
              <div
                key={b.id}
                className={`rounded-xl border p-3 ${
                  b.status === "WON" ? "border-emerald-300 bg-emerald-50" : i === 0 ? "border-brand-200 bg-brand-50/40" : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-extrabold text-ink">{inr(b.amount)}</span>
                    {i === 0 && b.status === "OPEN" && <span className="badge bg-brand-100 text-brand-700">Lowest</span>}
                    {b.status === "WON" && <span className="badge bg-emerald-100 text-emerald-700">Accepted</span>}
                    {b.status === "LOST" && <span className="badge bg-slate-100 text-slate-500">Lost</span>}
                  </div>
                  {b.truckOwnerId === user?.id && <span className="text-xs font-semibold text-brand-600">You</span>}
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <ProfileLink id={b.truckOwner.id}>{b.truckOwner.name}</ProfileLink>
                  <VerifiedBadge verified={b.truckOwner.verified} />
                  <Stars value={b.truckOwner.avgRating} count={b.truckOwner.ratingCount} />
                  <span>· {b.truckOwner.fleetSize ?? "—"} trucks</span>
                  <span>· {b.truckOwner.tripsCompleted} trips</span>
                  <span>· {b.truckOwner.onTimePct}% on-time</span>
                </div>

                {isPoster && !load.trip && (
                  <div className="mt-2 flex gap-2">
                    <Link href={`/chat/${load.id}/${b.truckOwner.id}`} className="btn-ghost flex-1 text-xs">
                      Chat
                    </Link>
                    <button className="btn-primary flex-1 text-xs" onClick={() => setAcceptBid(b)}>
                      Accept
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {acceptBid && (
        <AcceptModal
          load={load}
          bid={acceptBid}
          onClose={() => setAcceptBid(null)}
          onDone={(tripId) => {
            push("Bid accepted — trip created!");
            router.push(`/trips/${tripId}`);
          }}
        />
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="font-medium text-ink">{value}</div>
    </div>
  );
}

function AcceptModal({
  load,
  bid,
  onClose,
  onDone,
}: {
  load: any;
  bid: any;
  onClose: () => void;
  onDone: (tripId: string) => void;
}) {
  const { push } = useToast();
  const [insuranceOn, setInsuranceOn] = useState(true);
  const [fuelCardOn, setFuelCardOn] = useState(false);
  const [cargoValue, setCargoValue] = useState("500000");
  const [busy, setBusy] = useState(false);

  const breakdown = computeBreakdown({
    winningBid: bid.amount,
    cargoValue: Number(cargoValue) || 0,
    insuranceOn,
    fuelCardOn,
  });

  async function confirm() {
    setBusy(true);
    try {
      const d = await api<{ trip: any }>(`/api/loads/${load.id}/accept`, {
        body: { bidId: bid.id, insuranceOn, fuelCardOn, cargoValue: Number(cargoValue) || 0 },
      });
      onDone(d.trip.id);
    } catch (e: any) {
      push(e.message, "error");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold">Accept bid & create trip</h3>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100">✕</button>
        </div>

        <div className="mb-3 rounded-xl bg-slate-50 p-3 text-sm">
          Carrier <b>{bid.truckOwner.name}</b> · winning bid <b>{inr(bid.amount)}</b>
        </div>

        <label className="label">Declared cargo value (for insurance)</label>
        <div className="mb-3 flex items-center rounded-xl border border-slate-300 px-3">
          <span className="text-slate-500">₹</span>
          <input
            className="w-full bg-transparent px-2 py-2.5 text-sm outline-none"
            inputMode="numeric"
            value={cargoValue}
            onChange={(e) => setCargoValue(e.target.value.replace(/\D/g, ""))}
          />
        </div>

        <div className="space-y-2">
          <Toggle
            label="Cargo Insurance"
            sub={`Mock premium ${insuranceOn ? inr(breakdown.insurance) : "—"} (1.5% of value)`}
            on={insuranceOn}
            onChange={setInsuranceOn}
          />
          <Toggle
            label="Fuel Card"
            sub="Coming soon · mock ₹2,000 benefit"
            on={fuelCardOn}
            onChange={setFuelCardOn}
            badge="coming soon"
          />
        </div>

        {/* Transparent price breakdown */}
        <div className="mt-4 space-y-1.5 rounded-xl border border-slate-200 p-3 text-sm">
          <Row label="Winning bid" value={inr(breakdown.winningBid)} />
          {insuranceOn && <Row label="Insurance premium" value={inr(breakdown.insurance)} />}
          {fuelCardOn && <Row label="Fuel card benefit" value={`− ${inr(Math.abs(breakdown.fuelCard))}`} muted />}
          <Row label={`Platform commission (${breakdown.commissionPct}%)`} value={inr(breakdown.commissionAmount)} muted />
          <div className="my-1 border-t border-dashed border-slate-200" />
          <Row label="Grand total" value={inr(breakdown.grandTotal)} bold />
        </div>

        <button className="btn-primary mt-4 w-full" disabled={busy} onClick={confirm}>
          Confirm & assign trip
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  sub,
  on,
  onChange,
  badge,
}: {
  label: string;
  sub: string;
  on: boolean;
  onChange: (v: boolean) => void;
  badge?: string;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${
        on ? "border-brand-400 bg-brand-50" : "border-slate-200"
      }`}
    >
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold">
          {label}
          {badge && <span className="badge bg-amber-100 text-amber-700">{badge}</span>}
        </div>
        <div className="text-xs text-slate-500">{sub}</div>
      </div>
      <span className={`relative h-6 w-11 rounded-full transition ${on ? "bg-brand-600" : "bg-slate-300"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${on ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "text-base font-extrabold" : ""} ${muted ? "text-slate-500" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
