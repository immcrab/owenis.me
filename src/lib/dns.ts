export function generateVerificationToken(): string {
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  return `owenis-verify=${random}`;
}

/**
 * Performs a real DNS TXT lookup via Google's public DNS-over-HTTPS JSON API
 * (CORS-enabled, no key needed) and checks whether any record matches the
 * expected verification token. Runs entirely in the browser — no backend.
 */
export async function verifyTxtRecord(host: string, expectedValue: string): Promise<boolean> {
  try {
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(host)}&type=TXT`);
    if (!res.ok) return false;
    const data = (await res.json()) as { Answer?: { data: string }[] };
    const records = (data.Answer ?? []).map((a) => a.data.replace(/^"|"$/g, ""));
    return records.includes(expectedValue);
  } catch {
    return false;
  }
}
