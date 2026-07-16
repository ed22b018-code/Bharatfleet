"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/client";

export type SessionUser = {
  id: string;
  role: string;
  name: string;
  phone: string;
  verified: boolean;
  businessName?: string | null;
  avgRating: number;
  ratingCount: number;
  tripsCompleted: number;
  onTimePct: number;
  fleetSize?: number | null;
  truckTypes?: string | null;
  memberSince: string;
};

type SessionCtx = {
  user: SessionUser | null;
  unread: number;
  loading: boolean;
  reload: () => Promise<void>;
};

const Ctx = createContext<SessionCtx>({ user: null, unread: 0, loading: true, reload: async () => {} });

export function useSession() {
  return useContext(Ctx);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const d = await api<{ user: SessionUser | null; unread: number }>("/api/me");
      setUser(d.user);
      setUnread(d.unread ?? 0);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    const id = setInterval(reload, 4000); // keep bell + role fresh
    return () => clearInterval(id);
  }, [reload]);

  return <Ctx.Provider value={{ user, unread, loading, reload }}>{children}</Ctx.Provider>;
}
