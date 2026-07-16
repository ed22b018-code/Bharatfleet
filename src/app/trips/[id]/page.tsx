"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { api } from "@/lib/client";
import { usePolling } from "@/hooks/usePolling";
import { useSession } from "@/components/Session";
import { useToast } from "@/components/Toast";
import { StatusBadge, VerifiedBadge, Stars, ProfileLink, Spinner, Empty } from "@/components/ui";
import { inr, km, tonnes, dateTime } from "@/lib/format";

const TrackMap = dynamic(() => import("@/components/TrackMap"), {
  ssr: false,
  loading: () => <div className="grid h-72 w-full place-items-center rounded-xl bg-slate-100 text-sm text-slate-400 sm:h-96">Loading map…</div>,
});

export default function TripPage({ params }: { params: { id: string } }) {
  const { user } = useSession();
  const { push } = useToast();

  const { data, loading, refresh } = usePolling<any>(() => api(`/api/trips/${params.id}`), 2000, [params.id]);
  const [busy, setBusy] = useState(false);

  if (loading && !data) return <Spinner />;
  if (!data?.trip) return <Empty title="Trip not found" />;

  const { trip, position, eta, breakdown } = data;
  const load = trip.load;
  const carrier = trip.winningBid.truckOwner;
  const poster = load.poster;
  const isPoster = user?.id === poster.id;
  const isCarrier = user?.id === carrier.id;
  const myReview = trip.reviews.find((r: any) => r.fromUserId === user?.id);
  const showTracking = ["IN_TRANSIT", "DELIVERED", "PAID", "CLOSED"].includes(trip.status);
  const canRate = ["DELIVERED", "PAID", "CLOSED"].includes(trip.status) && (isPoster || isCarrier) && !myReview;

  async function act(path: string, msg: string) {
    setBusy(true);
    try {
      await api(`/api/trips/${params.id}/${path}`, { body: {} });
      push(msg);
      refresh();
    } catch (e: any) {
      push(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-xl font-extrabold">
            {load.pickupCity}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {load.dropCity}
          </div>
          <StatusBadge status={trip.status} />
        </div>
        <div className="mt-2 text-sm text-slate-500">
          {km(load.distanceKm)} · {tonnes(load.weightTonnes)} · {load.materialType} · Trip #{trip.id.slice(-6).toUpperCase()}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-sm">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400">Load Owner</div>
            <ProfileLink id={poster.id}>{poster.businessName || poster.name}</ProfileLink>
            <div className="mt-0.5 flex items-center gap-1.5"><VerifiedBadge verified={poster.verified} /><Stars value={poster.avgRating} /></div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400">Carrier</div>
            <ProfileLink id={carrier.id}>{carrier.name}</ProfileLink>
            <div className="mt-0.5 flex items-center gap-1.5"><VerifiedBadge verified={carrier.verified} /><Stars value={carrier.avgRating} /></div>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <Link href={`/chat/${load.id}/${isPoster ? carrier.id : poster.id}`} className="btn-ghost flex-1">
            Chat
          </Link>
          {["DELIVERED", "PAID", "CLOSED"].includes(trip.status) && (
            <Link href={`/trips/${trip.id}/receipt`} className="btn-ghost flex-1">
              LR / e-way-bill
            </Link>
          )}
        </div>
      </div>

      {/* Status controls driven by the state machine */}
      <div className="card p-5">
        <h2 className="mb-3 font-bold">Trip controls</h2>
        <div className="flex flex-wrap gap-2">
          {isCarrier && trip.status === "ASSIGNED" && (
            <button className="btn-primary flex-1" disabled={busy} onClick={() => act("start", "Trip started — you're rolling!")}>
              🚚 Start Trip
            </button>
          )}
          {isCarrier && trip.status === "IN_TRANSIT" && (
            <button className="btn-primary flex-1" disabled={busy} onClick={() => act("deliver", "Marked delivered!")}>
              📦 Mark Delivered
            </button>
          )}
          {isPoster && trip.status === "DELIVERED" && (
            <button className="btn-primary flex-1" disabled={busy} onClick={() => act("pay", "Payment released!")}>
              💳 Mark Paid
            </button>
          )}
          {trip.status === "ASSIGNED" && isPoster && (
            <p className="text-sm text-slate-500">Waiting for the carrier to start the trip. You can adjust add-ons below.</p>
          )}
          {trip.status === "CLOSED" && <p className="text-sm text-emerald-600">Trip complete and closed. 🎉</p>}
        </div>
      </div>

      {/* Add-ons editor (poster, before start) */}
      {isPoster && trip.status === "ASSIGNED" && <AddonsEditor trip={trip} onSaved={refresh} />}

      {/* Live tracking */}
      {showTracking && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4">
            <h2 className="font-bold">Live tracking</h2>
            <span className="text-sm font-semibold text-brand-600">{eta}</span>
          </div>
          <div className="px-5 pb-3 pt-2">
            <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
              <span>{load.pickupCity}</span>
              <span>{trip.progressPct}% complete</span>
              <span>{load.dropCity}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-brand-600 transition-all duration-1000" style={{ width: `${trip.progressPct}%` }} />
            </div>
          </div>
          <div className="px-3 pb-3">
            <TrackMap
              pickup={{ lat: load.pickupLat, lng: load.pickupLng }}
              drop={{ lat: load.dropLat, lng: load.dropLng }}
              truck={position}
              pickupLabel={load.pickupCity}
              dropLabel={load.dropCity}
            />
          </div>
        </div>
      )}

      {/* Price breakdown */}
      <div className="card p-5">
        <h2 className="mb-3 font-bold">Price breakdown</h2>
        <div className="space-y-1.5 text-sm">
          <Row label="Winning bid" value={inr(breakdown.winningBid)} />
          {trip.insuranceOn && <Row label="Cargo insurance (1.5%)" value={inr(breakdown.insurance)} />}
          {trip.fuelCardOn && <Row label="Fuel card benefit" value={`− ${inr(Math.abs(breakdown.fuelCard))}`} muted />}
          <Row label={`Platform commission (${breakdown.commissionPct}%)`} value={inr(breakdown.commissionAmount)} muted />
          <div className="my-1 border-t border-dashed border-slate-200" />
          <Row label="Grand total" value={inr(breakdown.grandTotal)} bold />
        </div>
        <p className="mt-2 text-xs text-slate-400">Commission is how Bharatfleet earns — shown transparently.</p>
      </div>

      {/* Ratings */}
      {["DELIVERED", "PAID", "CLOSED"].includes(trip.status) && (
        <div className="card p-5">
          <h2 className="mb-3 font-bold">Ratings & reviews</h2>
          {canRate && (
            <RatingForm
              tripId={trip.id}
              toName={isPoster ? carrier.name : poster.businessName || poster.name}
              onDone={() => {
                push("Thanks for your review!");
                refresh();
              }}
            />
          )}
          {myReview && !canRate && (
            <div className="mb-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">You rated this trip {myReview.stars}★.</div>
          )}
          <div className="space-y-2">
            {trip.reviews.length === 0 && <p className="text-sm text-slate-400">No reviews yet — both parties rate after delivery.</p>}
            {trip.reviews.map((r: any) => (
              <div key={r.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{r.fromUser.name}</span>
                  <span className="text-amber-500">{"★".repeat(r.stars)}<span className="text-slate-300">{"★".repeat(5 - r.stars)}</span></span>
                </div>
                {r.text && <p className="mt-1 text-sm text-slate-600">{r.text}</p>}
                <div className="mt-1 text-xs text-slate-400">{dateTime(r.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AddonsEditor({ trip, onSaved }: { trip: any; onSaved: () => void }) {
  const { push } = useToast();
  const [insuranceOn, setInsuranceOn] = useState(trip.insuranceOn);
  const [fuelCardOn, setFuelCardOn] = useState(trip.fuelCardOn);
  const [cargoValue, setCargoValue] = useState(String(trip.cargoValue || 0));
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await api(`/api/trips/${trip.id}/addons`, { body: { insuranceOn, fuelCardOn, cargoValue: Number(cargoValue) || 0 } });
      push("Add-ons updated");
      onSaved();
    } catch (e: any) {
      push(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-5">
      <h2 className="mb-3 font-bold">Add-ons</h2>
      <label className="label">Declared cargo value</label>
      <div className="mb-3 flex items-center rounded-xl border border-slate-300 px-3">
        <span className="text-slate-500">₹</span>
        <input className="w-full bg-transparent px-2 py-2.5 text-sm outline-none" inputMode="numeric" value={cargoValue} onChange={(e) => setCargoValue(e.target.value.replace(/\D/g, ""))} />
      </div>
      <div className="space-y-2">
        <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
          <span>Cargo Insurance <span className="text-slate-400">(1.5% of value)</span></span>
          <input type="checkbox" className="h-5 w-5" checked={insuranceOn} onChange={(e) => setInsuranceOn(e.target.checked)} />
        </label>
        <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
          <span>Fuel Card <span className="badge bg-amber-100 text-amber-700">coming soon</span></span>
          <input type="checkbox" className="h-5 w-5" checked={fuelCardOn} onChange={(e) => setFuelCardOn(e.target.checked)} />
        </label>
      </div>
      <button className="btn-ghost mt-3 w-full" disabled={busy} onClick={save}>
        Save add-ons
      </button>
    </div>
  );
}

function RatingForm({ tripId, toName, onDone }: { tripId: string; toName: string; onDone: () => void }) {
  const { push } = useToast();
  const [stars, setStars] = useState(5);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await api(`/api/trips/${tripId}/review`, { body: { stars, text } });
      onDone();
    } catch (e: any) {
      push(e.message, "error");
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50/50 p-4">
      <div className="mb-2 text-sm font-semibold">Rate {toName}</div>
      <div className="mb-2 flex gap-1 text-2xl">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setStars(n)} className={n <= stars ? "text-amber-500" : "text-slate-300"}>
            ★
          </button>
        ))}
      </div>
      <textarea className="input mb-2" rows={2} placeholder="How was the experience?" value={text} onChange={(e) => setText(e.target.value)} />
      <button className="btn-primary w-full" disabled={busy} onClick={submit}>
        Submit review
      </button>
    </div>
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
