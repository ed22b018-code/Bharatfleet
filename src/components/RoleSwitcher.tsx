"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { useSession } from "./Session";
import { useToast } from "./Toast";

// DEMO control: instantly become any seeded user to show both sides.
export default function RoleSwitcher() {
  const { user, reload } = useSession();
  const { push } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    api<{ users: any[] }>("/api/users").then((d) => setUsers(d.users)).catch(() => {});
  }, []);

  async function switchTo(u: any) {
    await api("/api/session/switch", { body: { userId: u.id } });
    setOpen(false);
    await reload();
    push(`Now viewing as ${u.name}`, "info");
    router.push(u.role === "TRUCK_OWNER" ? "/feed" : "/loads");
    router.refresh();
  }

  const loadOwners = users.filter((u) => u.role === "LOAD_OWNER");
  const truckOwners = users.filter((u) => u.role === "TRUCK_OWNER");

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
      >
        <span className="hidden sm:inline">Demo:</span> Switch user
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-72 max-w-[90vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <Group title="Load Owners" users={loadOwners} currentId={user?.id} onPick={switchTo} />
            <Group title="Truck Owners" users={truckOwners} currentId={user?.id} onPick={switchTo} />
          </div>
        </>
      )}
    </div>
  );
}

function Group({
  title,
  users,
  currentId,
  onPick,
}: {
  title: string;
  users: any[];
  currentId?: string;
  onPick: (u: any) => void;
}) {
  return (
    <div>
      <div className="bg-slate-50 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {title}
      </div>
      {users.map((u) => (
        <button
          key={u.id}
          onClick={() => onPick(u)}
          className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-brand-50 ${
            u.id === currentId ? "bg-brand-50/60" : ""
          }`}
        >
          <span>
            <span className="font-medium text-ink">{u.name}</span>
            {u.businessName && <span className="block text-xs text-slate-400">{u.businessName}</span>}
          </span>
          <span className="flex items-center gap-1 text-xs text-amber-500">
            {u.avgRating ? `★ ${u.avgRating.toFixed(1)}` : "New"}
          </span>
        </button>
      ))}
    </div>
  );
}
