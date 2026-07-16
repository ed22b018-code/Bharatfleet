import { cookies } from "next/headers";
import { handle, ok, bad } from "@/lib/api";
import { prisma } from "@/lib/db";
import { verifyOtp, isValidPhone } from "@/lib/mock/auth";
import { SESSION_COOKIE } from "@/lib/constants";

// Login OR signup in one step. If the phone exists, log in. Otherwise create
// a new user with the supplied role/name. Never hard-blocks.
export async function POST(req: Request) {
  return handle(async () => {
    const body = await req.json();
    const phone = String(body.phone ?? "").trim();
    if (!isValidPhone(phone)) return bad("Enter a 10-digit phone number");
    if (!verifyOtp(phone, String(body.otp ?? ""))) return bad("Invalid OTP (use 123456)");

    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      const role = body.role === "TRUCK_OWNER" ? "TRUCK_OWNER" : "LOAD_OWNER";
      user = await prisma.user.create({
        data: {
          phone,
          role,
          name: String(body.name ?? "").trim() || (role === "TRUCK_OWNER" ? "New Fleet Owner" : "New Load Owner"),
          businessName: body.businessName ? String(body.businessName) : null,
          verified: false,
        },
      });
      await prisma.notification.create({
        data: { userId: user.id, type: "WELCOME", text: "Welcome to Bharatfleet! Complete your profile to earn a Verified badge." },
      });
    }

    cookies().set(SESSION_COOKIE, user.id, { httpOnly: false, path: "/", sameSite: "lax" });
    return ok({ user });
  });
}
