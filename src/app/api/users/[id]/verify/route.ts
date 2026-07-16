import { handle, ok, bad } from "@/lib/api";
import { prisma } from "@/lib/db";
import { runVerification } from "@/lib/mock/kyc";

// Mock KYC. Any docs (or none) → instantly Verified. Also supports an explicit
// toggle (body { verified: boolean }) so demos can show both states.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) return bad("User not found", 404);

    let verified: boolean;
    const body = await req.json().catch(() => ({}));
    if (typeof body.verified === "boolean") {
      verified = body.verified; // explicit demo toggle
    } else {
      verified = runVerification(body.docs).verified; // "Verify" click → always true
    }

    const docs = body.docs ? JSON.stringify(body.docs) : existing.docs;
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { verified, docs },
    });
    return ok({ user });
  });
}
