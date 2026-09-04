# owenis.me — Firebase Email Management Platform

A dashboard for connecting a Firebase project, configuring its Auth email
templates and action URLs, verifying a custom sending domain, requesting a
free `*.owenis.me` subdomain, and — for real — pushing authorized-domain
changes straight into your live Firebase project. Plus a Groq-powered AI
email generator and documentation-grounded AI assistant, and a full admin
back office.

**This runs entirely on free infrastructure: Firebase's Spark (free) plan,
GitHub Pages, and a Cloudflare Worker (free tier).** No Cloud Functions, no
Firebase Hosting, no paid plan of any kind. That constraint shaped the whole
architecture — see [Why no backend / how privileged operations
work](#why-no-backend--how-privileged-operations-work) below.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 19 + TypeScript + Vite, `HashRouter` | Static export, deployable as plain files — `HashRouter` means GitHub Pages needs zero server-side rewrite config |
| Styling | Tailwind CSS v4 | Design tokens as CSS variables (`src/index.css`), utility classes everywhere else |
| Hosting | **GitHub Pages** (via GitHub Actions, `.github/workflows/deploy.yml`) | Free, and the repo already had a `CNAME` for `owenis.me` from before |
| Auth + DB | Firebase Authentication + **Firestore**, Spark plan | Free tier, generous quota, client SDK only — no Admin SDK anywhere |
| Privileged compute | **One Cloudflare Worker** (`worker/`) | The only place that holds the Groq API key — everything else runs from the browser |
| Real Firebase project writes | Google Identity Toolkit Admin API, called directly from the browser with the user's own OAuth token | See below — this is genuinely live, not simulated |
| AI | Groq API (`groq-sdk`), called only from the Worker | Key never touches the browser |

## Why no backend / how privileged operations work

Firebase Cloud Functions require the **Blaze** (pay-as-you-go) plan, even
though Functions themselves have a free quota — Blaze just requires a
billing account attached. This project stays on Spark, so there is no
Firebase backend at all: no Admin SDK, no server-side validation, no custom
claims. Every operation is either a **direct Firestore write from the
browser** (governed entirely by `firestore.rules`) or a call to the **one
Cloudflare Worker** for the one thing that genuinely needs a secret (Groq).

Here's how each formerly-server-side piece actually works now:

| Feature | How it works without a backend |
|---|---|
| Admin authorization | `firestore.rules` checks `request.auth.token.email` (and `email_verified`) directly — Firestore's own servers evaluate this, so it can't be forged from the client. No custom claims needed. |
| Connect/update/disconnect project, save templates, action URLs, subdomain requests, admin reviews | Direct Firestore reads/writes from the browser, validated by `firestore.rules` (see below) |
| Custom-domain DNS ownership verification | A real DNS TXT lookup via Google's public DNS-over-HTTPS JSON API (`dns.google/resolve`, CORS-enabled), called straight from the browser. It is never faked. |
| AI email generator + AI assistant | Browser → Cloudflare Worker → Groq. The Worker verifies the caller's Firebase ID token (against Google's real public JWKS) before doing anything, and rate-limits per user via Cloudflare KV, so it can't be used as an open proxy. |
| **Authorized domains** on the user's real Firebase project | Genuinely live. The user clicks "Connect Google," grants an OAuth scope (`identitytoolkit`) for *their own* Google account, and the browser calls Google's **Identity Toolkit Admin API v2** directly with that token to read/update `authorizedDomains` on their real project. No backend involved — it's the user's own delegated credential, same as running `gcloud` locally. |
| Email template *content* | **Cannot** be pushed anywhere — Firebase has no public API for Auth email template content, full stop, regardless of plan or backend. The editor stores your draft and shows a live preview; you copy it into your Firebase console. This isn't a limitation of this build, it's a real gap in Firebase's product surface. |
| Admin "disable user" | App-level only: sets `users/{uid}.disabled = true` in Firestore. `firestore.rules` then blocks that user's writes everywhere, and the client force-signs them out when it sees the flag. This is **not** a real Firebase Auth account suspension (that needs the Admin SDK) — it's the closest honest equivalent without one. |
| Activity log | Self-reported: each client writes its own `activityLogs` entry right after a successful action, and `firestore.rules` only lets you write an entry with your *own* `userId`/`email`. It's a visibility aid for the admin, not a tamper-proof audit trail — without a server, nothing else is possible. |
| Account deletion | Fully self-service: `deleteUser(auth.currentUser)` (Firebase client SDK supports deleting your *own* account), preceded by a password reauth prompt since Firebase requires a recent sign-in for this. |

### Why Firestore over Realtime Database

Firestore was chosen because the data is naturally document/collection
shaped, its **security rules** can express per-field and per-owner
constraints precisely (this matters even more now that rules are the *only*
backend), and compound queries (`where("userId","==",uid).orderBy(...)`)
used throughout are first-class. RTDB's low-latency-sync advantage isn't
needed here — everything changes at human speed.

## Project structure

```
src/
  components/ui/      Design-system primitives (Button, Card, Input, Modal, Tabs, …)
  components/layout/  Navbar, Sidebar, DashboardLayout, AdminLayout, PageTransition
  components/AuthActionBridge.tsx   Bridges Firebase's ?mode=&oobCode= query params into
                                    the HashRouter route (see "Routing" below)
  context/             AuthContext (Firebase Auth + Firestore user doc, email-based isAdmin),
                        ToastContext
  hooks/                Firestore listeners (useUserProject, useSubdomainRequests, useAdminData, …)
  lib/
    firebase.ts         Client SDK init (Auth + Firestore only — no Functions)
    worker.ts            Calls the Cloudflare Worker for AI features
    dns.ts                Client-side DNS-over-HTTPS verification
    googleAuth.ts         Google Identity Services token client (Identity Toolkit scope)
    identityToolkit.ts    Calls to the real Identity Toolkit Admin API v2
    activityLog.ts        Self-reported activity log writes
    validators.ts, types.ts, constants.ts, helpContent.ts
  pages/
    public/    Home, Features, HowItWorks, PublicProjects, Docs, auth pages, /auth/action
    dashboard/ Dashboard, ConnectFirebase, EmailConfig (+ email/ tabs incl. AuthorizedDomainsCard),
               SubdomainRequest, AiEmailGenerator, AiAssistant, AccountSettings
    admin/     AdminOverview, AdminUsers, AdminSubdomainRequests, AdminProjects,
               AdminAiSettings, AdminActivityLogs
worker/                 Cloudflare Worker — the only privileged backend piece
  src/index.ts           Routes: POST /generate-email, POST /assistant
  src/firebaseAuth.ts     Verifies Firebase ID tokens against Google's public JWKS
  src/rateLimit.ts        Per-user daily limit via Cloudflare KV
  src/aiSettings.ts       Reads admin-configured model/prompt settings from Firestore's
                          public REST API (no service account needed for a plain read)
  wrangler.toml
.github/workflows/deploy.yml   Builds and deploys to GitHub Pages on push to main
firestore.rules                 The actual security boundary — read this file
firestore.indexes.json
```

## Routing and Firebase Auth email links

The app uses `HashRouter` (`/#/dashboard`, etc.) because GitHub Pages can't
run server-side rewrites for a "real" client-side router — every unknown
path would 404. `HashRouter` means the browser never even asks the server
about anything after the `#`.

This creates one wrinkle: Firebase builds auth action links (verify email,
reset password) as `https://owenis.me/?mode=...&oobCode=...` — real query
params, placed *before* any `#`. Under a plain `HashRouter` those would never
reach `useSearchParams()`. `src/components/AuthActionBridge.tsx` fixes this:
on load, it checks the real (non-hash) query string for Firebase's params
and forwards them into the hash route, so `/auth/action`
(`src/pages/public/AuthAction.tsx`) works exactly as if it were a normal
route.

## Database structure

| Collection | Doc ID | Purpose |
|---|---|---|
| `users/{uid}` | Firebase Auth uid | Created directly by the client right after sign-up (no server trigger needed). `isAdmin` is a display mirror only — real authorization is always `firestore.rules` checking the live token. |
| `users/{uid}/aiEmailDrafts/{id}` | auto | Saved AI-generated email drafts, private to the owner |
| `projects/{uid}` | **owner's uid** | One connected Firebase project per user |
| `projects/{uid}/emailTemplates/{type}` | `verify_email` \| `password_reset` \| `email_address_change` \| `sms_verification` | Per-template subject/sender/reply-to/body |
| `subdomainRequests/{id}` | auto | `userId`, `requestedSubdomain`, `status`, `adminMessage`, timestamps |
| `activityLogs/{id}` | auto | Self-reported (see table above); admin-read-only |
| `aiSettings/config` | fixed | Groq model IDs, prompts, limits — **publicly readable** (the Worker reads it via plain REST, no credentials), admin-write-only |
| `publicProjects/{uid}` | owner's uid | Curated, admin-approved public mirror |

Using the owner's `uid` as the document ID for `projects` is what makes "one
project per user" and ownership checks cheap and rule-friendly.

## Security model — `firestore.rules` is the whole backend now

Read `firestore.rules` end to end; it's short and every line matters. The
short version:

1. **Admin** = signed in, `request.auth.token.email == "imcrabfr@gmail.com"`,
   and `email_verified == true`. Change the email in the rules file (and in
   `src/lib/constants.ts` for the UI convenience check) to change who's
   admin, then `firebase deploy --only firestore:rules`.
2. Every collection restricts *who* can write *which fields* — e.g. a
   project owner can edit their own config but not `publicListing`
   (admin-only, so users can't self-approve their public listing); a user
   can rename themselves but not un-disable their own account.
3. `aiSettings/config` is the one publicly-*readable* doc (the Worker needs
   it), and `publicProjects` is the one publicly-readable *collection*.
4. There is **no server-side uniqueness check** for subdomain requests — the
   client checks for an existing active request before submitting, but a
   race between two users is theoretically possible without a backend. The
   admin resolves any duplicate on review.
5. `isActiveUser(uid)` is checked on the owner-write paths as a rules-level
   backstop for the disabled-account flag, on top of the client force-signing
   disabled users out.

## Setup

### 1. Prerequisites

- Node 20+, npm
- A Firebase project (Spark/free plan is enough) with **Authentication →
  Email/Password** and **Firestore** enabled
- The [Firebase CLI](https://firebase.google.com/docs/cli) (only needed to
  deploy `firestore.rules` — no Hosting, no Functions):
  `npm install -g firebase-tools`, then `firebase login`
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up) and the
  [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (installed
  as a dev dependency in `worker/`)
- A [Groq API key](https://console.groq.com/keys)
- A GitHub repository with **Pages** enabled, source set to **GitHub
  Actions** (Settings → Pages → Build and deployment → Source)

### 2. Install dependencies

```bash
npm install
cd worker && npm install && cd ..
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in `VITE_FIREBASE_*` from **Firebase console → Project settings →
General → Your apps → Web app** (all public/client-safe values). Leave
`VITE_GOOGLE_OAUTH_CLIENT_ID` blank until step 6 if you want the authorized-
domains feature.

### 4. Point the CLI at your Firebase project and deploy rules

```bash
firebase use --add
firebase deploy --only firestore:rules,firestore:indexes
```

### 5. Set up the Cloudflare Worker

```bash
cd worker
npx wrangler kv namespace create RATE_LIMIT
# paste the returned id into wrangler.toml's [[kv_namespaces]] block
npx wrangler secret put GROQ_API_KEY
npx wrangler deploy
```

Note the deployed Worker URL (`https://owenis-me-ai.<your-subdomain>.workers.dev`
by default) — you'll need it for `VITE_WORKER_URL`.

Also edit `ALLOWED_ORIGINS` in `worker/src/index.ts` if your domain differs
from `owenis.me`.

### 6. (Optional) Set up Google OAuth for the authorized-domains feature

This is the one feature that pushes a real change into a user's live
Firebase project. It needs a one-time OAuth Client ID from **you**, the site
operator — end users never touch Google Cloud Console themselves, they just
click "Connect Google" and consent.

1. Go to [Google Cloud Console → APIs & Services →
   Credentials](https://console.cloud.google.com/apis/credentials), for the
   Google Cloud project backing your Firebase project (or any project you
   control).
2. Enable the **Identity Toolkit API** (APIs & Services → Library → search
   "Identity Toolkit API" → Enable).
3. Configure the **OAuth consent screen** if you haven't already (External
   or Internal; add the `identitytoolkit` scope isn't required to be listed
   as "sensitive" here, but you may need to add test users while your app is
   unverified).
4. Create an **OAuth 2.0 Client ID** of type **Web application**.
   - Authorized JavaScript origins: `https://owenis.me` and
     `http://localhost:5173` (for local dev).
   - No redirect URI needed — this uses Google Identity Services' token-client
     (implicit) flow, popup-based.
5. Copy the Client ID into `VITE_GOOGLE_OAUTH_CLIENT_ID` (and the GitHub
   Actions secret of the same name).

Without this, the "Authorized domains" card on the Action URLs tab simply
doesn't render — everything else works fine.

### 7. GitHub Actions secrets

Add these under **Settings → Secrets and variables → Actions**:

`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
`VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`,
`VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`,
`VITE_WORKER_URL`, `VITE_GOOGLE_OAUTH_CLIENT_ID` (optional).

### 8. Deploy

```bash
git push origin main
```

The `deploy.yml` workflow builds and publishes `dist/` to GitHub Pages
automatically. The `CNAME` file (`public/CNAME`, containing `owenis.me`) is
copied into every build so GitHub Pages keeps the custom domain configured.

### 9. First admin login

Sign up through the app with `imcrabfr@gmail.com` (or whatever you changed
the admin email to in `firestore.rules` + `src/lib/constants.ts`). Admin
access requires the account's email to be **verified** — check your inbox
and click the link before `/admin` will load data (Firestore rules will
otherwise deny the reads).

## Local development

Three things run locally, in three terminals:

```bash
# 1. Firebase emulators (Auth + Firestore — no Functions emulator needed)
firebase emulators:start --only auth,firestore

# 2. The Cloudflare Worker
cd worker && npm run dev

# 3. The frontend
npm run dev
```

With `VITE_USE_EMULATORS=true` in `.env`, the frontend talks to the local
emulators. `worker/.dev.vars` (gitignored) supplies `GROQ_API_KEY` locally —
the Worker will make *real* Groq API calls even in dev, since Groq itself
isn't emulated.

`worker/.dev.vars` also sets `FIREBASE_AUTH_EMULATOR=true`, which is
**dev-only** and never set in production: the Firebase Auth emulator signs
tokens with a fake key that can never verify against Google's real public
keys, so the Worker falls back to decoding (not cryptographically verifying)
the token when this flag is set. Standard claims (issuer/audience/expiry)
are still checked. This flag must never be set on the deployed Worker
(`wrangler.toml` doesn't set it, and it isn't a secret you'd `wrangler secret
put`) — production always does full signature verification.

The Firestore Emulator UI is at `http://127.0.0.1:4000`.
