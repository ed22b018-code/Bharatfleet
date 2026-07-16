import { prisma } from "../db";

// ---- MOCK NOTIFICATIONS ---------------------------------------------------
// SMS/WhatsApp are simulated as in-app notifications (bell + toast).
// TODO: replace with real SMS/WhatsApp (Gupshup / MSG91 / WhatsApp Cloud API).

export async function notify(
  userId: string,
  type: string,
  text: string,
  link?: string
) {
  return prisma.notification.create({
    data: { userId, type, text, link },
  });
}
