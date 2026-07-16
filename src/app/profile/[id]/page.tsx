"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { useSession } from "@/components/Session";
import { useToast } from "@/components/Toast";
import { VerifiedBadge, Stars, Spinner, Empty } from "@/components/ui";
import { TRUCK_TYPE_LABELS } from "@/lib/constants";
import { memberSince, dateTime } from "@/lib/format";

export default function ProfilePage({ params }: { params: { id: string } }) {
  const { user: me, reload } = useSession();
  const { push } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    const d = await api(`/api/users/${params.id}`);
    setData(d);
    setLoading(false);
  }
  useEffect(() => {
    load().catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading) return <Spinner />;
  if (!data?.user) return <Empty title="Profile not found" />;

  const u = data.user;
  const isMe = me?.id === u.id;
  const isTruck = u.role === "TRUCK_OWNER";
  const truckTypes: string[] = u.truckTypes ? u.truckTypes.split(",") : [];

  async function verify(explicit?: boolean) {
    setBusy(true);
    try {
      await api(`/api/users/${u.id}/verify`, { body: explicit === undefined ? {} : { verified: explicit } });
      push(explicit === false ? "Marked unverified (demo)" : "Verified! ✅");
      await load();
      if (isMe) reload();
    } catch (e: any) {
      push(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-start gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand-100 text-2xl font-extrabold text-brand-700">
            {u.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold">{u.name}</h1>
              <VerifiedBadge verified={u.verified} />
            </div>
            {u.businessName && <div className="text-sm text-slate-500">{u.businessName}</div>}
            <div className="mt-1"><Stars value={u.avgRating} count={u.ratingCount} /></div>
            <div className="mt-1 text-xs text-slate-500">{isTruck ? "Truck Owner" : "Load Owner"}</div>
          </div>
        </div>

        {/* Trust signals */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Trips" value={String(u.tripsCompleted)} />
          <Stat label="On-time" value={`${u.onTimePct}%`} />
          <Stat label="Member since" value={memberSince(u.memberSince)} />
        </div>

        {isTruck && (
          <div className="mt-4 border-t border-slate-100 pt-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Fleet size:</span>
              <span className="font-semibold">{u.fleetSize ?? "—"} trucks</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {truckTypes.map((t) => (
                <span key={t} className="badge bg-slate-100 text-slate-600">{TRUCK_TYPE_LABELS[t] ?? t}</span>
              ))}
              {truckTypes.length === 0 && <span className="text-xs text-slate-400">No truck types listed</span>}
            </div>
          </div>
        )}
      </div>

      {/* Documents / KYC (mocked) */}
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Verification & documents</h2>
          <VerifiedBadge verified={u.verified} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(isTruck
            ? ["RC Book", "Driving Licence", "Truck Photo", "Fleet Details"]
            : ["PAN Card", "GST Certificate", "Business Proof", "Address Proof"]
          ).map((doc) => (
            <div key={doc} className="rounded-xl border border-dashed border-slate-300 p-3 text-center">
              <div className="text-2xl">📄</div>
              <div className="mt-1 text-xs font-medium text-slate-600">{doc}</div>
              {isMe && (
                <label className="mt-1 inline-block cursor-pointer text-[11px] font-semibold text-brand-600">
                  Upload
                  <input type="file" className="hidden" onChange={() => push(`${doc} attached (mock)`, "info")} />
                </label>
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Prototype: any file (or none) is accepted — clicking Verify instantly marks you Verified.
        </p>

        {isMe && (
          <div className="mt-3 flex flex-wrap gap-2">
            {!u.verified ? (
              <button className="btn-primary flex-1" disabled={busy} onClick={() => verify()}>
                Verify my account
              </button>
            ) : (
              <button className="btn-ghost flex-1" disabled={busy} onClick={() => verify(false)}>
                Demo: mark unverified
              </button>
            )}
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="card p-5">
        <h2 className="mb-3 font-bold">Reviews ({data.reviews.length})</h2>
        {data.reviews.length === 0 ? (
          <p className="text-sm text-slate-400">No reviews yet.</p>
        ) : (
          <div className="space-y-2">
            {data.reviews.map((r: any) => (
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
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="text-sm font-bold text-ink">{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}
