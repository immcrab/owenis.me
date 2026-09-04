import { resolveTxt } from "node:dns/promises";

/**
 * Performs a real DNS TXT lookup and checks whether any record matches the
 * expected verification token. Never returns true without actually resolving.
 */
export async function verifyTxtRecord(host: string, expectedValue: string): Promise<boolean> {
  try {
    const records = await resolveTxt(host);
    const flat = records.map((chunks) => chunks.join(""));
    return flat.includes(expectedValue);
  } catch {
    // NXDOMAIN, no records, timeout, etc. — treat as not-yet-verified rather than erroring.
    return false;
  }
}

export function generateVerificationToken(): string {
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  return `owenis-verify=${random}`;
}
