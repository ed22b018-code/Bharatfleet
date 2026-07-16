"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "./Session";

// Phone-first bottom navigation. Every core action ≤2 taps away.
export default function BottomNav() {
  const { user } = useSession();
  const pathname = usePathname();
  if (!user || pathname === "/login" || pathname === "/") return null;

  const isTruck = user.role === "TRUCK_OWNER";
  const items = isTruck
    ? [
        { href: "/feed", label: "Loads", icon: "feed" },
        { href: "/trips", label: "My Trips", icon: "truck" },
        { href: `/profile/${user.id}`, label: "Profile", icon: "user" },
      ]
    : [
        { href: "/loads", label: "My Loads", icon: "feed" },
        { href: "/loads/new", label: "Post", icon: "plus" },
        { href: "/trips", label: "Trips", icon: "truck" },
        { href: `/profile/${user.id}`, label: "Profile", icon: "user" },
      ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur no-print sm:hidden">
      <div className="mx-auto flex max-w-3xl">
        {items.map((it) => {
          const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                active ? "text-brand-600" : "text-slate-500"
              }`}
            >
              <NavIcon name={it.icon} filled={it.icon === "plus"} />
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function NavIcon({ name, filled }: { name: string; filled?: boolean }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 } as const;
  if (name === "plus")
    return (
      <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-white">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </span>
    );
  if (name === "truck")
    return (
      <svg {...common}>
        <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" strokeLinejoin="round" />
      </svg>
    );
  if (name === "user")
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" />
      </svg>
    );
  // feed
  return (
    <svg {...common}>
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <rect x="3" y="10" width="18" height="4" rx="1" />
      <rect x="3" y="16" width="18" height="4" rx="1" />
    </svg>
  );
}
