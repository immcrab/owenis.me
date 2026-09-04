/**
 * Static, public documentation used by the AI assistant. This is the ONLY
 * content the assistant is given beyond the user's own message — it never
 * touches Firestore user data, so it structurally cannot leak account info.
 */
export const HELP_CONTENT = `
Q: How do I connect my Firebase project?
A: Go to Dashboard -> Connect Firebase and enter your Firebase Project ID (Project settings in the Firebase console) plus your public Web API Key and Auth Domain. No service-account private key is ever requested.

Q: Why doesn't owenis.me ask for my Firebase Admin SDK key?
A: A service-account key grants full access to a Firebase project. It's never collected. The platform stores your desired configuration and shows you what to paste into your own Firebase console, or verifies things independently (like DNS).

Q: How do email templates work?
A: Dashboard -> Email configuration -> Templates. Choose verify_email, password_reset, email_address_change, or sms_verification, fill in subject/sender/reply-to/body, use variables like %DISPLAY_NAME%, %EMAIL%, %APP_NAME%, %LINK%, preview live, save. You then copy these into Firebase console's Authentication -> Templates, since Firebase has no public API for updating templates programmatically.

Q: What is an action URL / continue URL?
A: After a user clicks a Firebase Auth email link, Firebase redirects to the configured continue URL with an oobCode. That page calls the Firebase Auth SDK (applyActionCode / confirmPasswordReset) to finish the action. Configured at Dashboard -> Email configuration -> Action URLs. owenis.me itself has a working handler at /auth/action.

Q: What DNS records do I need?
A: For a custom email domain, owenis.me generates one TXT ownership record. You add it at your DNS provider, then click Verify — that performs a real DNS lookup (via a public DNS-over-HTTPS API) from your own browser; it's never marked verified without one succeeding. DNS changes can take minutes to 48 hours.

Q: How do subdomain requests work?
A: Dashboard -> Subdomain request. Enter a name for yourname.owenis.me (lowercase letters, digits, hyphens, 3-30 chars, not reserved). It's validated and checked for duplicates, then submitted as "pending" for admin review.

Q: What do subdomain statuses mean?
A: pending = awaiting review. approved = accepted, being provisioned. denied = rejected (see admin message). needs_changes = something must be adjusted before approval.

Q: How does the AI email generator work?
A: Dashboard -> AI email generator. Pick an email type, tone, purpose, brand name, and main message. Groq drafts an editable email. Nothing is ever sent automatically — the user reviews and optionally saves the draft.

Q: What can the AI assistant see?
A: Only this public documentation. It cannot read account data, Firebase configuration, other users' information, or anything from the database, and refuses requests for user lists, emails, or private data regardless of phrasing.

Q: What shows up in the public projects directory?
A: Only what a project owner explicitly opts in to share via the admin-approved public listing: display name, chosen subdomain, and a short description. Firebase Project IDs, API keys, emails, and other account details are never shown.

Q: How is the platform secured?
A: Firebase Authentication handles sign-in. Admin access is granted via Firestore security rules checking the signed-in user's verified email — enforced by Firebase's servers, never by frontend code. The only privileged backend is a small Cloudflare Worker that proxies AI calls; it verifies each request's Firebase ID token before doing anything.

Q: Why is owenis.me a static site instead of having its own server?
A: It runs entirely on Firebase's free Spark plan (Auth + Firestore, no paid Cloud Functions) plus GitHub Pages for hosting. The one operation that needs a real secret — calling the Groq API — runs on a small Cloudflare Worker instead, so the API key never reaches the browser.
`.trim();
