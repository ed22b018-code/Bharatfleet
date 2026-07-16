// ---- MOCK KYC / VERIFICATION ---------------------------------------------
// Any upload (or none) + a "Verify" click instantly marks the user Verified.
// A demo toggle can flip verified state to show both.
// TODO: replace with real KYC (Karza / Signzy / DigiLocker / Aadhaar eKYC).

export function runVerification(_docs: unknown): { verified: boolean } {
  return { verified: true }; // always succeeds
}
