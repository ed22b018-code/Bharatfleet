import { handle, ok, bad } from "@/lib/api";
import { isValidPhone, sendOtp } from "@/lib/mock/auth";

export async function POST(req: Request) {
  return handle(async () => {
    const { phone } = await req.json();
    if (!isValidPhone(phone ?? "")) return bad("Enter a 10-digit phone number");
    const res = sendOtp(phone);
    return ok({ ok: true, hint: res.hint });
  });
}
