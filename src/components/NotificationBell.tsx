"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { useSession } from "./Session";
import { dateTime } from "@/lib/format";

export default function NotificationBell() {
  const { unread, reload } = useSession();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const router = useRouter();

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      const d = await api<{ notifications: any[] }>("/api/notifications");
      setItems(d.notifications);
      await api("/api/notifications/read", { body: {} });
      reload();
    }
  }

  return (
    <div className="relative">
      <button onClick={toggle} className="relative rounded-full p-2 hover:bg-slate-100" aria-label="Notifications">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">Notifications</div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-400">No notifications yet</div>
              )}
              {items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setOpen(false);
                    if (n.link) router.push(n.link);
                  }}
                  className="block w-full border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50"
                >
                  <div className="text-sm text-ink">{n.text}</div>
                  <div className="mt-0.5 text-xs text-slate-400">{dateTime(n.createdAt)}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
