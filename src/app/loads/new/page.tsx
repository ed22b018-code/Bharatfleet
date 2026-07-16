"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { useToast } from "@/components/Toast";
import { CITIES } from "@/lib/cities";
import { MATERIAL_TYPES, TRUCK_TYPES, TRUCK_TYPE_LABELS } from "@/lib/constants";
import { inr, km } from "@/lib/format";

function inDays(d: number) {
  const dt = new Date(Date.now() + d * 86400000);
  return dt.toISOString().slice(0, 16);
}

export default function NewLoadPage() {
  const router = useRouter();
  const { push } = useToast();

  const [f, setF] = useState({
    pickupCity: "Mumbai",
    dropCity: "Delhi",
    pickupAt: inDays(1),
    deliverBy: inDays(4),
    weightTonnes: "20",
    materialType: "General Goods",
    truckType: "container",
    numTrucks: "1",
    fragile: false,
    loadingResponsibility: "Load Owner",
    notes: "",
  });
  const [est, setEst] = useState<{ distanceKm: number; estMinPrice: number; estMaxPrice: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: string, v: any) => setF((s) => ({ ...s, [k]: v }));

  // Recompute the live fair-price estimate whenever route/weight changes.
  useEffect(() => {
    let alive = true;
    api("/api/estimate", { body: { pickup: f.pickupCity, drop: f.dropCity, weightTonnes: Number(f.weightTonnes) } })
      .then((d: any) => alive && setEst(d))
      .catch(() => alive && setEst(null));
    return () => {
      alive = false;
    };
  }, [f.pickupCity, f.dropCity, f.weightTonnes]);

  async function submit() {
    setBusy(true);
    try {
      const d = await api<{ load: any }>("/api/loads", {
        body: { ...f, weightTonnes: Number(f.weightTonnes), numTrucks: Number(f.numTrucks) },
      });
      push("Load posted — auction is live!");
      router.push(`/loads/${d.load.id}`);
      router.refresh();
    } catch (e: any) {
      push(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-xl font-bold">Post a load</h1>
      <p className="mb-4 text-sm text-slate-500">Verified carriers will bid to move your cargo.</p>

      <div className="card space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Pickup city</label>
            <select className="input" value={f.pickupCity} onChange={(e) => set("pickupCity", e.target.value)}>
              {CITIES.map((c) => (
                <option key={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Drop city</label>
            <select className="input" value={f.dropCity} onChange={(e) => set("dropCity", e.target.value)}>
              {CITIES.map((c) => (
                <option key={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Auto price estimate */}
        <div className="rounded-xl border border-brand-100 bg-brand-50 p-3">
          {est ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-brand-700">Fair price estimate</div>
                <div className="text-lg font-bold text-brand-800">
                  {inr(est.estMinPrice)} – {inr(est.estMaxPrice)}
                </div>
              </div>
              <div className="text-right text-xs text-brand-700">
                <div className="font-semibold">{km(est.distanceKm)}</div>
                <div>straight-line</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-brand-700">Pick two different cities to see an estimate.</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Pickup date/time</label>
            <input type="datetime-local" className="input" value={f.pickupAt} onChange={(e) => set("pickupAt", e.target.value)} />
          </div>
          <div>
            <label className="label">Deliver by</label>
            <input type="datetime-local" className="input" value={f.deliverBy} onChange={(e) => set("deliverBy", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Weight (tonnes)</label>
            <input type="number" min="0.5" step="0.5" className="input" value={f.weightTonnes} onChange={(e) => set("weightTonnes", e.target.value)} />
          </div>
          <div>
            <label className="label"># Trucks needed</label>
            <input type="number" min="1" className="input" value={f.numTrucks} onChange={(e) => set("numTrucks", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Material type</label>
            <select className="input" value={f.materialType} onChange={(e) => set("materialType", e.target.value)}>
              {MATERIAL_TYPES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Truck type</label>
            <select className="input" value={f.truckType} onChange={(e) => set("truckType", e.target.value)}>
              {TRUCK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TRUCK_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Loading / unloading responsibility</label>
          <select className="input" value={f.loadingResponsibility} onChange={(e) => set("loadingResponsibility", e.target.value)}>
            <option>Load Owner</option>
            <option>Truck Owner</option>
            <option>Shared</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 rounded" checked={f.fragile} onChange={(e) => set("fragile", e.target.checked)} />
          Fragile / delicate cargo
        </label>

        <div>
          <label className="label">Notes (optional)</label>
          <textarea className="input" rows={2} placeholder="Anything the carrier should know" value={f.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>

        <button className="btn-primary w-full" disabled={busy} onClick={submit}>
          Post load & start auction
        </button>
      </div>
    </div>
  );
}
