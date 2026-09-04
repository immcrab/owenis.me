# owenis.me — Firebase Email Management Platform

A dashboard for connecting a Firebase project, configuring its Auth email
templates and action URLs, verifying a custom sending domain, and requesting
a free `*.owenis.me` subdomain — plus a Groq-powered AI email generator and
a documentation-grounded AI assistant, and a full admin back office.

This is a real, working application: authentication, database, security
rules, and privileged operations are all implemented and enforced
server-side. Nothing here is a mockup — see [What's genuinely real vs. what's
intentionally limited](#whats-genuinely-real-vs-whats-intentionally-limited)
for the honest boundaries of what a third-party platform can and can't do to
someone else's Firebase project.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 19 + TypeScript + Vite | Fast dev loop, standard, no framework lock-in needed for a dashboard app |
| Styling | Tailwind CSS v4 | Design tokens as CSS variables (`src/index.css`), utility classes everywhere else |
| Routing | React Router v7 | Client-side routing across public / dashboard / admin route trees |
| Animation | Framer Motion | Page transitions, sidebar collapse, modals, toasts — all respect `prefers-reduced-motion` |
| Auth + DB | Firebase Authentication + **Firestore** | See below |
| Backend | Firebase Cloud Functions (2nd gen, Node 20, TypeScript) | The only place secrets and privileged writes live |
| AI | Groq API (`groq-sdk`), called only from Cloud Functions | Key never touches the client |

### Why Firestore over Realtime Database

Firestore was chosen (matching the brief's preference) because:

- The data is naturally **document/collection shaped** (users, projects, one
  project per user, subcollections for templates and drafts) rather than one
  big JSON tree.
- **Security rules** can express per-field and per-owner constraints
  (`request.resource.data.diff(...)`, custom-claim checks) far more
  precisely than RTDB's rule language.
- Compound queries (`where("userId","==",uid).orderBy("createdAt","desc")`)
  used throughout the dashboard and admin panel are first-class in Firestore.
- RTDB's advantage — very low-latency realtime sync for high-frequency data
  (e.g. presence, live cursors) — isn't needed here; the data changes at
  human speed (a form save, an admin review).

## What's genuinely real vs. what's intentionally limited

The brief is explicit: don't invent that something works if it doesn't. Here's
the honest breakdown.

**Fully real, end-to-end:**
- Firebase Authentication (sign up, sign in, sign out, password reset, email
  verification) and Firestore reads/writes.
- Admin authorization via **Firebase custom claims**, set only by Cloud
  Functions using the Admin SDK — never trusted from the client, never
  hardcoded as a frontend-only check. `/auth/action` is a real, working
  handler for Firebase's `verifyEmail` and `resetPassword` action links.
- Every write to `projects`, `emailTemplates`, `subdomainRequests`,
  `activityLogs`, and `aiSettings` goes through an authenticated Cloud
  Function that validates input (Zod) and enforces authorization —
  Firestore rules additionally deny all direct client writes to those
  collections as defense in depth.
- Custom domain **ownership verification**: a real DNS TXT record is
  generated per project, and "verified" only flips to `true` after a live
  `dns.promises.resolveTxt()` lookup from the Cloud Function actually finds
  it. It is never faked or optimistically marked green.
- The Groq integration (email generator + AI assistant) calls the real Groq
  API from a Cloud Function, with the API key as a Firebase **secret**
  (never shipped to the browser), per-user daily rate limiting enforced in a
  Firestore transaction, and errors logged to `activityLogs`.
- The AI assistant is given **only** a static public-documentation string
  baked into the function — it has no Firestore client, so it is
  structurally incapable of leaking user data, not just prompted not to.

**Intentionally limited (and why):**
- **We never ask for a Firebase Admin SDK / service-account key.** That
  would grant this platform full control over a user's Firebase project —
  far too much trust to ask for. Connecting a project means storing its
  Project ID and public web config, which is what "connected" means
  throughout the UI.
- **Email templates are not pushed live into the user's Firebase project.**
  Firebase does not expose a public API for programmatically updating Auth
  email templates. The editor stores the template and shows a live preview;
  the UI is explicit that you copy the result into your own Firebase
  console.
- **Subdomain provisioning under `owenis.me` is admin-fulfilled, not
  automatic.** Approving a request in the admin panel updates its status;
  actually creating the DNS record on `owenis.me` requires access to that
  domain's DNS provider, which isn't wired to any API in this build. The
  README below documents where a Cloudflare/Route53 API integration would
  plug in if you want to automate that step.
- **SPF/DMARC records are not generated.** They don't prove domain
  ownership the way a TXT challenge does, and Firebase Auth has no built-in
  custom-SMTP concept to attach them to without an additional extension —
  adding them would have been a checkbox that doesn't verify anything.

## Project structure

```
src/
  components/
    ui/          Design-system primitives (Button, Card, Input, Modal, Tabs, …)
    layout/      Navbar, Sidebar, DashboardLayout, AdminLayout, PageTransition
    auth/        ProtectedRoute / AdminRoute
  context/       AuthContext (Firebase Auth + user doc + admin claim), ToastContext
  hooks/         Firestore listeners (useUserProject, useSubdomainRequests, useAdminData, …)
  lib/           firebase.ts (client SDK init), types.ts, validators.ts (Zod), helpContent.ts
  pages/
    public/      Home, Features, HowItWorks, PublicProjects, Docs, auth pages, /auth/action
    dashboard/   Dashboard, ConnectFirebase, EmailConfig (+ email/ tabs), SubdomainRequest,
                 AiEmailGenerator, AiAssistant, AccountSettings
    admin/       AdminOverview, AdminUsers, AdminSubdomainRequests, AdminProjects,
                 AdminAiSettings, AdminActivityLogs
functions/
  src/
    callable/    One onCall function per privileged operation (see below)
    triggers/    onUserCreate (Auth trigger — creates the Firestore user doc, grants admin
                 via allowlist)
    lib/         admin.ts (Admin SDK init), params.ts (ADMIN_EMAILS, GROQ_API_KEY secret),
                 groq.ts, helpContent.ts (server copy used for the AI assistant)
    utils/       validators.ts (Zod, mirrored from src/lib), rateLimit.ts, dns.ts, activityLog.ts
firestore.rules            Security rules (see below)
firestore.indexes.json     Composite indexes for the queries the app actually runs
```

## Database structure

All collections live at the top level except where noted.

| Collection | Doc ID | Purpose |
|---|---|---|
| `users/{uid}` | Firebase Auth uid | Profile mirror: email, displayName, `isAdmin` (display only — real authorization is the custom claim), `disabled`, `aiCallsToday` / `aiCallsResetAt` (rate-limit state) |
| `users/{uid}/aiEmailDrafts/{id}` | auto | Saved AI-generated email drafts, private to the owner |
| `projects/{uid}` | **owner's uid** | One connected Firebase project per user. Holds `firebaseProjectId`, public `webApiKey`/`authDomain`, `status`, `actionUrls`, `dnsRecords[]`, `publicListing`/`publicDescription` |
| `projects/{uid}/emailTemplates/{type}` | `verify_email` \| `password_reset` \| `email_address_change` \| `sms_verification` | Per-template subject/sender/reply-to/body |
| `subdomainRequests/{id}` | auto | `userId`, `requestedSubdomain`, `status` (`pending`/`approved`/`denied`/`needs_changes`), `adminMessage`, timestamps |
| `activityLogs/{id}` | auto | Server-written audit trail for every privileged action; admin-only read |
| `aiSettings/config` | fixed | Groq model IDs, system prompts, token/rate limits, `enabled` toggle — admin-managed |
| `publicProjects/{uid}` | owner's uid | Curated, admin-approved public mirror: `displayName`, `subdomain`, `description`, `joinedAt` — nothing private |

Using the owner's `uid` as the document ID for `projects` (and `publicProjects`)
is what makes "one project per user" and ownership rules cheap to enforce —
no query needed, just a doc-ID equality check.

## Security model

1. **Firebase Authentication** is the identity provider. Custom claims
   (`{ admin: true }`) are the *only* source of truth for admin access, and
   they can only be set by Cloud Functions running with the Admin SDK — the
   client never sets or reads anything else to determine admin status.
2. **`firestore.rules`** denies direct client writes to every collection
   except: a user updating their own `displayName` field. Every other
   mutation (connecting a project, saving a template, requesting a
   subdomain, reviewing a request, changing AI settings, disabling a user,
   deleting an account) goes through a Cloud Function callable that
   re-validates input with Zod and re-checks authorization from
   `request.auth`, independent of whatever the client claims.
3. Reads are scoped by owner or by the `admin` claim — e.g. a user can
   `get`/`list` their own `subdomainRequests`, and the rule is written so
   an unfiltered query (which could leak other users' requests) is rejected
   outright rather than silently returning nothing.
4. `activityLogs` and `aiSettings` are admin-read-only and never
   client-writable.
5. `publicProjects` is the **only** world-readable collection, and it only
   ever contains the subset of fields an admin explicitly chose to publish.

See `firestore.rules` for the full, commented ruleset.

## Cloud Functions (privileged backend)

All in `functions/src/callable/`, exported from `functions/src/index.ts`:

- **Auth/admin**: `bootstrapAdmin` (idempotent, allowlist-gated), `setAdminRole`
- **Projects**: `connectProject`, `disconnectProject`
- **Email config**: `updateActionUrls`, `saveEmailTemplate`,
  `requestDomainVerification`, `verifyDns` (real DNS lookup)
- **Subdomains**: `requestSubdomain`, `reviewSubdomainRequest` (admin)
- **Admin management**: `setUserDisabled`, `setProjectPublicListing`
- **AI**: `generateEmailWithAi`, `saveAiEmailDraft`, `aiAssistant`
  (all Groq-backed, rate-limited, secret-gated)
- **AI settings**: `updateAiSettings` (admin)
- **Account**: `deleteMyAccount`

Plus one Auth trigger, `onUserCreate` (`functions/src/triggers/onUserCreate.ts`),
which creates the `users/{uid}` doc and grants the admin claim if the new
user's email is on the `ADMIN_EMAILS` allowlist.

## Setup

### 1. Prerequisites

- Node 20+, npm
- A Firebase project ([console.firebase.google.com](https://console.firebase.google.com)) with **Authentication → Email/Password** and **Firestore** enabled
- The [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`, then `firebase login`
- A [Groq API key](https://console.groq.com/keys) (only needed to use the AI features)

### 2. Install dependencies

```bash
npm install
cd functions && npm install && cd ..
```

### 3. Point the CLI at your Firebase project

```bash
firebase use --add
```

(This updates `.firebaserc`. For local emulator testing, `--project demo-owenis`
works too — see [Local development](#local-development-against-the-emulators).)

### 4. Configure environment variables

```bash
cp .env.example .env
```

Fill in the `VITE_FIREBASE_*` values from **Firebase console → Project
settings → General → Your apps → Web app**. These are all public/client-safe
values — none of them are secrets.

### 5. Configure the admin allowlist and Groq secret

- `ADMIN_EMAILS` (a plain, non-secret param — see `functions/src/lib/params.ts`)
  defaults to `imcrabfr@gmail.com`. To add more admins, set it via a
  `functions/.env` file, which the Functions deploy picks up automatically:
  ```bash
  echo "ADMIN_EMAILS=you@example.com,teammate@example.com" > functions/.env
  ```
- The Groq key is a **secret**, deployed separately from regular config:
  ```bash
  firebase functions:secrets:set GROQ_API_KEY
  ```
  For local emulator testing, put a real (or placeholder) key in
  `functions/.secret.local` (already gitignored):
  `GROQ_API_KEY=your-real-or-placeholder-key`

### 6. Deploy security rules, indexes, and functions

```bash
firebase deploy --only firestore:rules,firestore:indexes,functions
```

### 7. Deploy the frontend (Firebase Hosting)

```bash
npm run build
firebase deploy --only hosting
```

Set up `owenis.me` as a custom domain under **Hosting → Add custom domain**
in the Firebase console, and point its DNS at Firebase per the instructions
it gives you.

### 8. First admin login

Sign up through the app with the email in `ADMIN_EMAILS`
(`imcrabfr@gmail.com` by default). The `onUserCreate` trigger grants the
admin claim automatically; `/admin` becomes accessible immediately after
sign-up (the client force-refreshes its ID token once the claim is granted).

## Local development against the emulators

```bash
firebase emulators:start --only auth,firestore,functions
```

In a second terminal, with `VITE_USE_EMULATORS=true` in `.env`:

```bash
npm run dev
```

The Emulator UI is at `http://127.0.0.1:4000`. `functions/.secret.local`
supplies `GROQ_API_KEY` locally (the Groq calls will actually hit the real
Groq API if you put a real key there — emulating Functions doesn't mock
third-party HTTP calls).

## Extending: automating subdomain DNS

To fully automate `*.owenis.me` provisioning on request approval, add a
Cloudflare (or other DNS provider) API token as a Cloud Functions secret and
call their API from inside `reviewSubdomainRequest`
(`functions/src/callable/subdomains.ts`) when `status === "approved"`. That
integration is intentionally not included here — it requires DNS provider
credentials for the platform's own domain that only the site owner has.
