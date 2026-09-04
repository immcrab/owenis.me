/**
 * Thin client for the Identity Toolkit Admin API v2 (the real Google API
 * behind Firebase Auth's project settings). Called directly from the
 * browser using the user's own delegated OAuth access token — this is a
 * genuine write to their real Firebase project, not a simulation.
 */

interface IdentityToolkitConfig {
  authorizedDomains?: string[];
}

async function request<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v2/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = body?.error?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export function getAuthorizedDomains(projectId: string, accessToken: string): Promise<string[]> {
  return request<IdentityToolkitConfig>(`projects/${projectId}/config`, accessToken).then(
    (config) => config.authorizedDomains ?? [],
  );
}

export function updateAuthorizedDomains(
  projectId: string,
  accessToken: string,
  authorizedDomains: string[],
): Promise<string[]> {
  return request<IdentityToolkitConfig>(
    `projects/${projectId}/config?updateMask=authorizedDomains`,
    accessToken,
    {
      method: "PATCH",
      body: JSON.stringify({ authorizedDomains }),
    },
  ).then((config) => config.authorizedDomains ?? []);
}
