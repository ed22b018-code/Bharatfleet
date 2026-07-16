"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { usePolling } from "@/hooks/usePolling";
import { useSession } from "@/components/Session";
import { Spinner } from "@/components/ui";
import { timeOnly } from "@/lib/format";

export default function ChatPage({ params }: { params: { loadId: string; otherId: string } }) {
  const { user } = useSession();
  const [other, setOther] = useState<any>(null);
  const [load, setLoad] = useState<any>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api(`/api/users/${params.otherId}`).then((d: any) => setOther(d.user)).catch(() => {});
    api(`/api/loads/${params.loadId}`).then((d: any) => setLoad(d.load)).catch(() => {});
  }, [params.otherId, params.loadId]);

  const { data, refresh } = usePolling<{ messages: any[] }>(
    () => api(`/api/messages?loadId=${params.loadId}&otherId=${params.otherId}`),
    2000,
    [params.loadId, params.otherId]
  );
  const messages = data?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await api("/api/messages", { body: { loadId: params.loadId, receiverId: params.otherId, text } });
      setText("");
      refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!user) return <Spinner />;

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      {/* Chat header */}
      <div className="card mb-3 flex items-center justify-between p-3">
        <div>
          <div className="font-bold">{other?.name ?? "Chat"}</div>
          {load && (
            <Link href={`/loads/${load.id}`} className="text-xs text-brand-600 hover:underline">
              {load.pickupCity} → {load.dropCity}
            </Link>
          )}
        </div>
        {other && <span className="text-xs text-amber-500">{other.avgRating ? `★ ${other.avgRating.toFixed(1)}` : "New"}</span>}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto rounded-2xl bg-white p-3 shadow-sm">
        {messages.length === 0 && (
          <div className="grid h-full place-items-center text-center text-sm text-slate-400">
            Start the conversation — negotiate rates, timing, and details here.
          </div>
        )}
        {messages.map((m) => {
          const mine = m.senderId === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                  mine ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md bg-slate-100 text-ink"
                }`}
              >
                <div>{m.text}</div>
                <div className={`mt-0.5 text-[10px] ${mine ? "text-brand-100" : "text-slate-400"}`}>{timeOnly(m.createdAt)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="mt-3 flex gap-2">
        <input
          className="input"
          placeholder="Type a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button className="btn-primary" disabled={busy || !text.trim()} onClick={send}>
          Send
        </button>
      </div>
    </div>
  );
}
