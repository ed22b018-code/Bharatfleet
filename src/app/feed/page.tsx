"use client";

import { useMemo, useState } from "react";
import { api } from "@/lib/client";
import { usePolling } from "@/hooks/usePolling";
import LoadCard from "@/components/LoadCard";
import { Empty, Spinner } from "@/components/ui";
import { TRUCK_TYPES, TRUCK_TYPE_LABELS, MATERIAL_TYPES } from "@/lib/constants";

export default function FeedPage() {
  const [truckType, setTruckType] = useState("");
  const [material, setMaterial] = useState("");
  const [q, setQ] = useState("");

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (truckType) p.set("truckType", truckType);
    if (material) p.set("material", material);
    if (q.trim()) p.set("q", q.trim());
    return p.toString();
  }, [truckType, material, q]);

  const { data, loading } = usePolling<{ loads: any[] }>(
    () => api(`/api/loads${query ? `?${query}` : ""}`),
    3000,
    [query]
  );

  const loads = data?.loads ?? [];

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold">Open Loads</h1>
        <p className="text-sm text-slate-500">Bid low to win — it&apos;s a reverse auction.</p>
      </div>

      <input
        className="input mb-3"
        placeholder="Search route (e.g. Mumbai, Delhi)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
        <Chip active={!truckType && !material} onClick={() => { setTruckType(""); setMaterial(""); }}>
          All
        </Chip>
        {TRUCK_TYPES.map((t) => (
          <Chip key={t} active={truckType === t} onClick={() => setTruckType(truckType === t ? "" : t)}>
            {TRUCK_TYPE_LABELS[t]}
          </Chip>
        ))}
        {MATERIAL_TYPES.map((m) => (
          <Chip key={m} active={material === m} onClick={() => setMaterial(material === m ? "" : m)}>
            {m}
          </Chip>
        ))}
      </div>

      {loading && !data ? (
        <Spinner label="Loading loads…" />
      ) : loads.length === 0 ? (
        <Empty title="No matching loads" hint="Try clearing filters — new loads appear here live." />
      ) : (
        <div className="space-y-3">
          {loads.map((l) => (
            <LoadCard key={l.id} load={l} />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
        active ? "border-brand-500 bg-brand-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
      }`}
    >
      {children}
    </button>
  );
}
