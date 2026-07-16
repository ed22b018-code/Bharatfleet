"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { useSession } from "@/components/Session";
import { useToast } from "@/components/Toast";
import { DEMO_OTP } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const { reload } = useSession();
  const { push } = useToast();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [role, setRole] = useState("LOAD_OWNER");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [busy, setBusy] = useState(false);
  const [demoUsers, setDemoUsers] = useState<any[]>([]);

  useEffect(() => {
    api<{ users: any[] }>("/api/users").then((d) => setDemoUsers(d.users)).catch(() => {});
  }, []);

  async function sendOtp() {
    setBusy(true);
    try {
      const d = await api<{ hint: string }>("/api/auth/send-otp", { body: { phone } });
      setOtpSent(true);
      setOtp(d.hint); // pre-fill for a frictionless demo
      push(`OTP sent. Use ${d.hint}`, "info");
    } catch (e: any) {
      push(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    try {
      const d = await api<{ user: any }>("/api/auth/verify", {
        body: { phone, otp, role, name, businessName },
      });
      await reload();
      push(`Welcome, ${d.user.name}!`);
      router.push(d.user.role === "TRUCK_OWNER" ? "/feed" : "/loads");
      router.refresh();
    } catch (e: any) {
      push(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function quickLogin(u: any) {
    setBusy(true);
    try {
      await api("/api/session/switch", { body: { userId: u.id } });
      await reload();
      router.push(u.role === "TRUCK_OWNER" ? "/feed" : "/loads");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-6">
      <div className="mb-6 text-center">
        <div className="mb-2 inline-flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">🚚</span>
          Bharat<span className="-ml-2 text-brand-600">fleet</span>
        </div>
        <p className="text-sm text-slate-500">
          Trusted freight, moved online. Verified parties, open bidding, live tracking.
        </p>
      </div>

      <div className="card p-5">
        <h1 className="mb-1 text-lg font-bold">Log in or sign up</h1>
        <p className="mb-4 text-sm text-slate-500">
          Any 10-digit number works · OTP is always <span className="font-semibold text-brand-700">{DEMO_OTP}</span>
        </p>

        <label className="label">Phone number</label>
        <div className="flex gap-2">
          <span className="flex items-center rounded-xl border border-slate-300 px-3 text-sm text-slate-500">+91</span>
          <input
            className="input"
            inputMode="numeric"
            maxLength={10}
            placeholder="10-digit mobile"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
          />
        </div>

        {!otpSent ? (
          <button className="btn-primary mt-4 w-full" disabled={busy || phone.length !== 10} onClick={sendOtp}>
            Get OTP
          </button>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-700">
              Demo OTP is <b>{DEMO_OTP}</b> (already filled in).
            </div>
            <div>
              <label className="label">Enter OTP</label>
              <input
                className="input tracking-[0.4em]"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <div className="mb-2 text-xs font-semibold text-slate-500">New here? Pick a role (ignored if you already have an account)</div>
              <div className="grid grid-cols-2 gap-2">
                <RoleCard label="I have cargo" sub="Load Owner" active={role === "LOAD_OWNER"} onClick={() => setRole("LOAD_OWNER")} />
                <RoleCard label="I have trucks" sub="Truck Owner" active={role === "TRUCK_OWNER"} onClick={() => setRole("TRUCK_OWNER")} />
              </div>
              <input className="input mt-3" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
              {role === "LOAD_OWNER" && (
                <input className="input mt-2" placeholder="Business name (optional)" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              )}
            </div>

            <button className="btn-primary w-full" disabled={busy} onClick={verify}>
              Continue
            </button>
          </div>
        )}
      </div>

      {demoUsers.length > 0 && (
        <div className="card mt-5 p-5">
          <div className="mb-1 text-sm font-bold">Or jump straight in (demo accounts)</div>
          <p className="mb-3 text-xs text-slate-500">One tap to explore either side instantly.</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {demoUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => quickLogin(u)}
                disabled={busy}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-left text-sm hover:border-brand-300 hover:bg-brand-50"
              >
                <span>
                  <span className="font-semibold">{u.name}</span>
                  <span className="block text-xs text-slate-400">
                    {u.role === "TRUCK_OWNER" ? "Truck Owner" : u.businessName || "Load Owner"}
                  </span>
                </span>
                <span className="text-xs text-amber-500">{u.avgRating ? `★ ${u.avgRating.toFixed(1)}` : "New"}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RoleCard({ label, sub, active, onClick }: { label: string; sub: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border px-3 py-3 text-left transition ${
        active ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100" : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-xs text-slate-500">{sub}</div>
    </button>
  );
}
