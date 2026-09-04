const IDENTITY_TOOLKIT_SCOPE = "https://www.googleapis.com/auth/identitytoolkit";

export const googleOAuthConfigured = Boolean(import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID);

/**
 * Requests a short-lived Google OAuth access token, scoped to the Identity
 * Toolkit Admin API, directly from the user's browser via Google Identity
 * Services (no backend involved — this is the user's own delegated
 * credential for their own Google account, good for ~1 hour, never
 * persisted). The resulting token can only do what the signed-in Google
 * account itself is allowed to do, e.g. it can only manage a Firebase
 * project that account actually owns/edits.
 */
export function requestIdentityToolkitToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error("Google sign-in hasn't finished loading yet. Try again in a moment."));
      return;
    }
    const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
    if (!clientId) {
      reject(new Error("Google OAuth isn't configured for this deployment."));
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: IDENTITY_TOOLKIT_SCOPE,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        resolve(response.access_token);
      },
      error_callback: (error) => {
        reject(new Error(error.type === "popup_closed" ? "Sign-in was cancelled." : "Google sign-in failed."));
      },
    });

    client.requestAccessToken();
  });
}
