export interface HelpTopic {
  id: string;
  title: string;
  body: string;
}

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "connect-firebase",
    title: "How do I connect my Firebase project?",
    body: "Go to Dashboard → Connect Firebase and enter your Firebase Project ID (visible in Project settings in the Firebase console) along with your public Web API Key and Auth Domain — the same values used in your app's client-side firebaseConfig. We never ask for a service-account private key or any Admin SDK credential; those stay in your own backend, not ours.",
  },
  {
    id: "why-no-admin-key",
    title: "Why don't you ask for my Firebase Admin SDK key?",
    body: "A service-account private key grants full read/write access to your entire Firebase project. Pasting it into any third-party frontend would be a serious security risk, so we don't collect it. Instead, the platform stores your desired configuration (templates, action URLs, DNS) and shows you exactly what to paste into your own Firebase console, or verifies things independently (like DNS) without needing privileged access to your project.",
  },
  {
    id: "email-templates",
    title: "How do email templates work?",
    body: "Under Dashboard → Email configuration → Templates, choose which template to edit (verification, password reset, or email change), fill in the subject, sender name, reply-to, and HTML body, and use variables like %DISPLAY_NAME%, %EMAIL%, and %LINK%. A live preview shows how it will render. Saving stores the template on your account — you then copy the fields into your Firebase console's Authentication → Templates section, since Firebase doesn't currently expose a public API for programmatically updating templates.",
  },
  {
    id: "action-urls",
    title: "What is an action URL / continue URL?",
    body: "After a user clicks a Firebase Auth email link (verify email, reset password, etc.), Firebase redirects them to a 'continue URL' in your app with an oobCode in the query string. Your app reads that code and calls the Firebase Auth SDK (checkActionCode, applyActionCode, or confirmPasswordReset) to complete the action. Configure this under Dashboard → Email configuration → Action URLs.",
  },
  {
    id: "dns-records",
    title: "What DNS records do I need for a custom email domain?",
    body: "If you want to send auth emails from your own domain, we generate a TXT ownership-verification record for you to add at your DNS provider. We then perform a real DNS lookup to confirm it resolves before marking it verified — verification is never faked. We also show recommended SPF and DMARC records if you're using your own SMTP provider via a Firebase Auth email extension. DNS changes can take anywhere from a few minutes to 48 hours to propagate.",
  },
  {
    id: "subdomain-request",
    title: "How do subdomain requests work?",
    body: "Under Dashboard → Subdomain request, enter a name for yourname.owenis.me. We validate the format (lowercase letters, numbers, hyphens, 3–30 characters, not a reserved word) and check it isn't already taken before submitting. Requests start as 'pending', and our team reviews them — you'll see the status change to approved, denied, or needs changes, along with any message left for you.",
  },
  {
    id: "subdomain-status",
    title: "What do the subdomain statuses mean?",
    body: "Pending: submitted, awaiting review. Approved: your subdomain is being (or has been) provisioned. Denied: the request was rejected — check the admin message for why. Needs changes: something about the request needs adjusting before it can be approved; resubmit after reading the note.",
  },
  {
    id: "ai-email-generator",
    title: "How does the AI email generator work?",
    body: "Under Dashboard → AI email generator, choose an email type, tone, purpose, your brand name, and the main message you want to convey. Groq generates a draft you can edit before saving — nothing is ever sent automatically.",
  },
  {
    id: "ai-assistant-privacy",
    title: "What can the AI assistant see?",
    body: "The AI assistant only has access to this public documentation. It cannot read your account data, your Firebase configuration, other users' information, or anything from the database. It will refuse to answer requests for user lists, emails, or any private data, no matter how the request is phrased.",
  },
  {
    id: "public-directory",
    title: "What shows up in the public projects directory?",
    body: "Only what you explicitly opt in to share: your project's display name, chosen subdomain, and a short description. Your Firebase Project ID, API keys, email address, and any other account details are never shown publicly.",
  },
  {
    id: "account-security",
    title: "How is my account secured?",
    body: "Authentication is handled by Firebase Auth. Admin access is granted server-side via Firebase custom claims — it is never determined by anything in the frontend code, so it can't be bypassed by editing client-side state. All privileged operations (reviewing requests, managing users, changing AI settings) run through authenticated, server-verified backend functions.",
  },
];

export function searchHelpTopics(term: string): HelpTopic[] {
  const lower = term.trim().toLowerCase();
  if (!lower) return HELP_TOPICS;
  return HELP_TOPICS.filter(
    (t) => t.title.toLowerCase().includes(lower) || t.body.toLowerCase().includes(lower),
  );
}
