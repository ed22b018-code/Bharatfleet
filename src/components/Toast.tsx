"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Toast = { id: number; text: string; kind: "success" | "error" | "info" };
type ToastCtx = { push: (text: string, kind?: Toast["kind"]) => void };

const Ctx = createContext<ToastCtx>({ push: () => {} });

export function useToast() {
  return useContext(Ctx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((text: string, kind: Toast["kind"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="fixed inset-x-0 bottom-4 z-[1000] flex flex-col items-center gap-2 px-4 no-print">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-none w-full max-w-sm rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
              t.kind === "error"
                ? "bg-rose-600"
                : t.kind === "info"
                ? "bg-slate-800"
                : "bg-emerald-600"
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
