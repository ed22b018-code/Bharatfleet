"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "./Session";
import { api } from "@/lib/client";
import NotificationBell from "./NotificationBell";
import RoleSwitcher from "./RoleSwitcher";
import { VerifiedBadge } from "./ui";

export default function Header() {
  const { user, loading } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // Hide the chrome on the login screen.
  if (pathname === "/login" || pathname === "/") return null;

  async function logout() {
    await api("/api/auth/logout", { body: {} });
    router.push("/login");
    router.refresh();
  }

  const isTruck = user?.role === "TRUCK_OWNER";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur no-print">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5">
        <Link href={isTruck ? "/feed" : "/loads"} className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 6a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v2h3.6a1 1 0 0 1 .8.4l2.4 3.2a1 1 0 0 1 .2.6V17a1 1 0 0 1-1 1h-1a2.5 2.5 0 0 1-5 0H9a2.5 2.5 0 0 1-5 0H4a1 1 0 0 1-1-1V6Zm11 4v5h1.05a2.5 2.5 0 0 1 3.9 0H20v-3.3L18.1 10H14Z" />
            </svg>
          </span>
          <span className="text-lg font-extrabold tracking-tight text-ink">
            Bharat<span className="text-brand-600">fleet</span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {!loading && user && (
            <>
              <RoleSwitcher />
              <NotificationBell />
              <div className="hidden items-center gap-2 sm:flex">
                <div className="text-right leading-tight">
                  <Link href={`/profile/${user.id}`} className="block text-sm font-semibold hover:underline">
                    {user.name}
                  </Link>
                  <div className="flex items-center justify-end gap-1.5 text-xs text-slate-500">
                    <span>{isTruck ? "Truck Owner" : "Load Owner"}</span>
                    <span>·</span>
                    <span className="text-amber-500">
                      {user.avgRating ? `★ ${user.avgRating.toFixed(1)}` : "New"}
                    </span>
                  </div>
                </div>
                <VerifiedBadge verified={user.verified} />
              </div>
              <button onClick={logout} className="rounded-full p-2 hover:bg-slate-100" aria-label="Log out" title="Log out">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
