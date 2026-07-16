import { DEMO_OTP } from "../constants";

// ---- MOCK AUTH ------------------------------------------------------------
// Phone + OTP, but ANY 10-digit number works and the OTP is always DEMO_OTP.
// Never blocks the user.
// TODO: replace with a real OTP provider (MSG91 / Twilio / Firebase Auth).

export function isValidPhone(phone: string): boolean {
  return /^\d{10}$/.test(phone.trim());
}

export function sendOtp(phone: string): { ok: true; hint: string } {
  // No real SMS is sent. The OTP is fixed for the demo.
  return { ok: true, hint: DEMO_OTP };
}

export function verifyOtp(_phone: string, otp: string): boolean {
  // Accept the demo OTP; also accept blank to keep demos frictionless.
  return otp.trim() === DEMO_OTP || otp.trim() === "";
}
