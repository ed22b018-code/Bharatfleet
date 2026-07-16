"use client";

import Link from "next/link";
import { api } from "@/lib/client";
import { usePolling } from "@/hooks/usePolling";
import { useSession } from "@/components/Session";
import LoadCard from "@/components/LoadCard";
import { Empty, Spinner } from "@/components/ui";

export default function MyLoadsPage() {
  const { user } = useSession();

  const { data, loading } = usePolling<{ loads: any[] }>(
    () => (user ? api(`/api/loads?posterId=${user.id}`) : Promise.resolve({ loads: [] })),
    3000,
    [user?.id]
  );

  const loads = data?.loads ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">My Loads</h1>
          <p className="text-sm text-slate-500">Post cargo and pick the best carrier.</p>
        </div>
        <Link href="/loads/new" className="btn-primary">
          + Post a load
        </Link>
      </div>

      {loading && !data ? (
        <Spinner />
      ) : loads.length === 0 ? (
        <Empty title="No loads yet" hint="Post your first load to start receiving bids from verified carriers." />
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
