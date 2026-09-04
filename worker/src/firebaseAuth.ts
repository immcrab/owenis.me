import { createRemoteJWKSet, decodeJwt, jwtVerify } from "jose";

const JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

export interface VerifiedUser {
  uid: string;
  email: string | null;
}

/**
 * Verifies a Firebase Auth ID token's signature and standard claims against
 * Google's public keys. This is what stops the Worker from being an open,
 * unauthenticated proxy to Groq — only a real, currently-signed-in user of
 * this exact Firebase project can get a valid token through.
 *
 * `useEmulator` is only ever true for local `wrangler dev` against the
 * Firebase Auth emulator (set via .dev.vars, never in wrangler.toml / the
 * deployed secret) — the emulator signs tokens with a fake key that can
 * never verify against Google's real JWKS, so signature checking is skipped
 * in that mode. Standard claims (issuer/audience/subject) are still checked.
 */
export async function verifyFirebaseIdToken(
  token: string,
  projectId: string,
  useEmulator: boolean,
): Promise<VerifiedUser> {
  const expectedIssuer = `https://securetoken.google.com/${projectId}`;

  let payload: Record<string, unknown>;

  if (useEmulator) {
    payload = decodeJwt(token);
    if (payload.iss !== expectedIssuer || payload.aud !== projectId) {
      throw new Error("Token issuer/audience mismatch");
    }
    const exp = typeof payload.exp === "number" ? payload.exp : 0;
    if (exp * 1000 < Date.now()) {
      throw new Error("Token expired");
    }
  } else {
    if (!jwks) {
      jwks = createRemoteJWKSet(new URL(JWKS_URL));
    }
    const result = await jwtVerify(token, jwks, {
      issuer: expectedIssuer,
      audience: projectId,
    });
    payload = result.payload;
  }

  if (typeof payload.sub !== "string" || !payload.sub) {
    throw new Error("Token missing subject");
  }

  return {
    uid: payload.sub,
    email: typeof payload.email === "string" ? payload.email : null,
  };
}
