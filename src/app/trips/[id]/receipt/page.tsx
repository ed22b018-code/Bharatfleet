"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { Spinner, Empty } from "@/components/ui";
import { inr, km, tonnes, shortDate, dateTime } from "@/lib/format";
import { TRUCK_TYPE_LABELS } from "@/lib/constants";

export default function ReceiptPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api(`/api/trips/${params.id}`).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <Spinner />;
  if (!data?.trip) return <Empty title="Trip not found" />;

  const { trip, breakdown } = data;
  const load = trip.load;
  const carrier = trip.winningBid.truckOwner;
  const poster = load.poster;
  const lr = `BF-LR-${trip.id.slice(-8).toUpperCase()}`;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between no-print">
        <a href={`/trips/${trip.id}`} className="btn-ghost text-sm">← Back to trip</a>
        <button className="btn-primary text-sm" onClick={() => window.print()}>Print / Save PDF</button>
      </div>

      <div className="card p-6 print:border-0 print:shadow-none">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <div className="text-2xl font-extrabold">Bharat<span className="text-brand-600">fleet</span></div>
            <div className="text-xs text-slate-500">Lorry Receipt (LR) cum e-Way Bill — Prototype</div>
          </div>
          <div className="text-right text-sm">
            <div className="font-bold">{lr}</div>
            <div className="text-xs text-slate-500">Issued {shortDate(new Date())}</div>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-4 border-b border-slate-200 py-4 text-sm">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400">Consignor (Load Owner)</div>
            <div className="font-semibold">{poster.businessName || poster.name}</div>
            <div className="text-slate-500">{poster.name}</div>
            {poster.gst && <div className="text-xs text-slate-500">GSTIN: {poster.gst}</div>}
            {poster.pan && <div className="text-xs text-slate-500">PAN: {poster.pan}</div>}
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400">Carrier (Truck Owner)</div>
            <div className="font-semibold">{carrier.name}</div>
            <div className="text-xs text-slate-500">Fleet: {carrier.fleetSize ?? "—"} trucks</div>
            <div className="text-xs text-slate-500">Rating: ★ {carrier.avgRating?.toFixed(1) ?? "New"}</div>
          </div>
        </div>

        {/* Consignment */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-b border-slate-200 py-4 text-sm sm:grid-cols-3">
          <Field label="From" value={load.pickupCity} />
          <Field label="To" value={load.dropCity} />
          <Field label="Distance" value={km(load.distanceKm)} />
          <Field label="Weight" value={tonnes(load.weightTonnes)} />
          <Field label="Material" value={load.materialType} />
          <Field label="Truck type" value={TRUCK_TYPE_LABELS[load.truckType] ?? load.truckType} />
          <Field label="Pickup" value={dateTime(load.pickupAt)} />
          <Field label="Deliver by" value={dateTime(load.deliverBy)} />
          <Field label="Declared value" value={inr(trip.cargoValue)} />
          <Field label="Started" value={trip.startedAt ? dateTime(trip.startedAt) : "—"} />
          <Field label="Delivered" value={trip.deliveredAt ? dateTime(trip.deliveredAt) : "—"} />
          <Field label="Status" value={trip.status.replace("_", " ")} />
        </div>

        {/* Charges */}
        <div className="py-4 text-sm">
          <div className="mb-2 text-[11px] uppercase tracking-wide text-slate-400">Freight charges</div>
          <table className="w-full">
            <tbody>
              <Line label="Freight (winning bid)" value={inr(breakdown.winningBid)} />
              {trip.insuranceOn && <Line label="Cargo insurance (1.5%)" value={inr(breakdown.insurance)} />}
              {trip.fuelCardOn && <Line label="Fuel card benefit" value={`− ${inr(Math.abs(breakdown.fuelCard))}`} />}
              <Line label={`Platform commission (${breakdown.commissionPct}%)`} value={inr(breakdown.commissionAmount)} />
              <tr className="border-t-2 border-slate-300">
                <td className="py-2 text-base font-extrabold">Grand total</td>
                <td className="py-2 text-right text-base font-extrabold">{inr(breakdown.grandTotal)}</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-2 text-xs text-slate-400">
            Payment status: {trip.paidAt ? `Paid on ${shortDate(trip.paidAt)}` : "Pending"} · Mocked for prototype (no real money moves).
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-slate-200 pt-6 text-xs text-slate-400">
          <div>
            <div className="mb-6">Consignor signature</div>
            <div className="w-40 border-t border-slate-300 pt-1">{poster.name}</div>
          </div>
          <div className="text-right">
            <div className="mb-6">Carrier signature</div>
            <div className="w-40 border-t border-slate-300 pt-1">{carrier.name}</div>
          </div>
        </div>
        <div className="mt-4 text-center text-[10px] text-slate-400">
          This is a computer-generated prototype document. Not valid for statutory / taxation use.
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-1 text-slate-600">{label}</td>
      <td className="py-1 text-right">{value}</td>
    </tr>
  );
}
