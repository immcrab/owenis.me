export interface Env {
  RATE_LIMIT: KVNamespace;
  GROQ_API_KEY: string;
  FIREBASE_PROJECT_ID: string;
  /** Dev-only — see firebaseAuth.ts. Never set in wrangler.toml or as a deployed secret. */
  FIREBASE_AUTH_EMULATOR?: string;
}

const DAY_SECONDS = 60 * 60 * 24;

/**
 * Increments today's call count for a uid and returns whether the caller is
 * still under the limit. Uses a UTC-day key so it resets naturally — no
 * separate cron/reset job needed.
 */
export async function checkAndIncrement(env: Env, uid: string, dailyLimit: number): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10);
  const key = `${uid}:${day}`;

  const current = Number((await env.RATE_LIMIT.get(key)) ?? "0");
  if (current >= dailyLimit) return false;

  await env.RATE_LIMIT.put(key, String(current + 1), { expirationTtl: DAY_SECONDS * 2 });
  return true;
}
