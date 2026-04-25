# cogbot-membership-website-template

A membership-gated website template powered by CogBot chat and IBM App ID authentication. Use this template to create a branded membership site for your organization — customize it by editing one config file.

All reusable UI components, authentication, and CogBot integration live in the **`@cogability/membership-kit`** package — its source is at `packages/membership-kit/` in this repo and is published to npm as [`@cogability/membership-kit`](https://www.npmjs.com/package/@cogability/membership-kit). The kit is built on **`@cogability/sdk`** (`packages/sdk/`), a framework-agnostic client library that wraps the CAM and CMG HTTP APIs — the same SDK can be used independently in Vue apps, vanilla JS, or Node.js agents. The template shell is a thin wrapper on top of the kit: a config file, styles, static assets, and a `main.jsx` that boots the kit.

## How It Works

```
Browser (React SPA)
  │
  ├─ On page load — anonymous geofence probe
  │     └─ GET /auth/geofence/check → CMG
  │           ├─ Allowed → public chat widget shown
  │           └─ Blocked → "Not Available in Your Area" message shown
  │
  ├─ Public landing page (/) — anonymous chat (if not geofenced)
  │     └─ BuddyChat widget — no login required
  │           └─ Anonymous session → CAM → be-pfc (PFC2)
  │                 └─ Chat works immediately (SSE streaming, no memory persistence)
  │
  └─ User clicks Sign In
        └─ App ID popup (OIDC) → idToken
              └─ POST /auth/validate → CMG
                    │
                    ├─ 1. Verify JWT (App ID JWKS)
                    │
                    ├─ 2. Member geofence (if enabled)
                    │     └─ Blocked → geofence message shown (even existing members)
                    │
                    └─ 3. Cloudant whitelist lookup
                          │
                          ├─ Not in whitelist, auto-provisioning enabled
                          │     ├─ New-signup geofence check (if enabled)
                          │     │     └─ Blocked → geofence message shown
                          │     └─ Allowed → auto-create member
                          │           └─ /onboarding wizard (new members)
                          │                 └─ Collects name + child info
                          │                      └─ cmgClient.saveProfile → CMG
                          │                           └─ Cloudant users.profile
                          │                                └─ be-pfc reads on every chat
                          │                                     and injects <profile> block
                          │
                          ├─ In whitelist, active, has namespace roles
                          │     └─ /members page + authenticated CogBot chat
                          │           ├─ Structured profile (Cloudant, edited by SPA/CMM)
                          │           └─ Emergent long-term memory (Pinecone via Mem0,
                          │                 written by the agent's save_memory tool)
                          │
                          └─ Not a member → Access Denied
```

The UI is a **static SPA** with zero backend code. All membership logic lives in CMG. Chat API routing, sessions, and streaming are handled by **CAM** (CogBot Access Manager). The structured member profile is stored in Cloudant via CMG; **be-pfc** (Prefrontal Cortex backend) reads it and additionally maintains emergent long-term memory in Pinecone (via Mem0) for facts the user reveals during chat.

---

## What You'll Need

Before you start, gather these two things:

### From CogAbility (your credentials sheet)

Your CogAbility contact will provide a credentials sheet with these values:

| Value | What it is |
|---|---|
| App ID Client ID | Identifies your authentication app |
| App ID OAuth Server URL | IBM App ID endpoint for login |
| CMG URL | Your CogBot Membership Gateway instance |
| Site Namespace | Ties your site to the correct member roles |
| CAM URL | Your CogBot Access Manager (CAM) instance — handles chat sessions and streaming |
| CogBot ID | The specific CogBot for your site |

If you don't have these yet, reach out to your CogAbility contact before starting.

### From you

- Your organization's **name, branding, and content** (taglines, feature descriptions, testimonials, etc.)
- **Logo and icon images** (any format: SVG, WebP, PNG)
- A **GitHub account** (free — [github.com](https://github.com))
- A **hosting account** on one of: [Lovable](https://lovable.dev), [Bolt.new](https://bolt.new), [Replit](https://replit.com), [Vercel](https://vercel.com), or [Netlify](https://netlify.com)

---

## Getting Started

### 1. Create your repo from this template

Click **Use this template** on GitHub to create your own repo. Do not fork — the template creates a clean copy with no upstream link.

### 2. Customize the config

Edit `site.config.js` at the project root. This is the only file you need to change to rebrand the site — it controls every user-visible string, page title, meta description, and social sharing tags:

```js
export default {
  siteName: 'Your Organization Name',
  botName: 'Your Bot Name',
  meta: {
    title: 'Your Bot | Your Org',
    description: 'A short description for search engines and social sharing.',
  },
  hero: {
    tagline: 'Your hero tagline',
    // ...
  },
  // ...
}
```

You can edit this file manually, or open the project in **Lovable**, **Cursor**, **Replit**, or **Bolt** and ask the AI to make changes for you:
- "Change the site name to X"
- "Update the hero tagline to..."
- "Replace the testimonials with..."

### 3. Replace the images

Put your own images in `public/`, replacing the placeholders:
- `public/bot-icon.svg` — chat avatar shown in the hero and header
- `public/org-logo.svg` — org logo shown in the hero "Presented by" section
- `public/favicon.svg` — browser tab icon

Then update the `images:` section in `site.config.js` if you use different filenames or formats (e.g. `.webp` or `.png`).

### 4. Set your credentials

Copy the environment template and fill in the values from your credentials sheet:

```bash
cp .env.example .env
```

Edit `.env` with the values from your CogAbility credentials sheet. See [Environment Variables](#environment-variables) below for details on each one.

### 5. Deploy

Push to GitHub and connect to your hosting platform. See [Deploying](#deploying) below.

---

## Customization Checklist

Before going live, make sure you've updated everything. Use this as a quick reference:

- [ ] **`site.config.js`** — replace ALL sample content:
  - [ ] `siteName`, `botName`, `orgName`, `orgUrl`
  - [ ] `meta.title` and `meta.description` (page title, SEO, social sharing)
  - [ ] `header` — project badge, sign-in button label
  - [ ] `hero` — tagline, subtitle, stats
  - [ ] `features` — section heading and all feature cards
  - [ ] `testimonials` — section heading and all testimonial cards
  - [ ] `about` — heading, paragraphs, checklist items, CTA links
  - [ ] `members` — member page headings, quick tips, bot description
  - [ ] `onboarding` — welcome heading, step labels
  - [ ] `profile` — headings and labels
  - [ ] `footer` — brand name, copyright, nav links
  - [ ] `login` — login page heading and button label (optional — defaults are generic)
  - [ ] `accessDenied` — access-denied page headings and button labels (optional)
- [ ] **`public/`** — replace placeholder images with your own:
  - [ ] `bot-icon.svg` (or your own format) — chat avatar
  - [ ] `org-logo.svg` (or your own format) — org logo
  - [ ] `favicon.svg` — browser tab icon
- [ ] **`.env`** — all 6 credentials from your CogAbility sheet
- [ ] **`src/index.css`** — theme colors (optional — has sensible defaults)
- [ ] **CORS** — send your production URL to CogAbility (see [After Deploying](#after-deploying-all-platforms))

---

## Customizing

### Content and branding

Edit `site.config.js`. Every user-visible string lives here:

| Section | What it controls |
|---|---|
| `siteName`, `botName` | Core identity used throughout the site |
| `meta` | Page title, meta description, OG tags (SEO and social sharing) |
| `images` | Paths to logo and icon files in `public/` |
| `header` | Project badge, sign-in button label, member badge |
| `hero` | Tagline, subtitle, stats, chat label, geofence notice text |
| `features` | Section heading and feature cards |
| `testimonials` | Section heading and testimonial cards |
| `about` | Section heading, paragraphs, checklist, CTAs |
| `members` | Member page headings, quick tips, bot description |
| `onboarding` | Wizard headings, step labels, gender/month options, skip label |
| `profile` | Profile page headings, save label, change password label |
| `footer` | Brand name, nav links, copyright, powered-by |
| `login` | Login page heading, subheading, button label, footer text |
| `accessDenied` | Headings and actions shown on the access-denied screen |
| `callback` | Loading message shown during the OAuth redirect |
| `roleGate` | Messages shown while checking membership/roles |

### Page title and SEO

The page `<title>`, meta description, Open Graph, and Twitter Card tags are all generated automatically from `site.config.js` at build time. Edit the `meta` section:

```js
meta: {
  title: 'Your Bot Name | Your Org',
  description: 'A description for search engines and link previews.',
  ogImage: '/og-image.png',  // optional — social sharing image
}
```

If you omit the `meta` section, the title defaults to `botName | siteName` and the description defaults to `hero.subtitle`.

### Page overrides

For advanced customization beyond config strings, you can replace entire pages with your own React components. In `src/main.jsx`, pass an `overrides` prop to `App`:

```jsx
import { App } from '@cogability/membership-kit';
import config from '@/site.config';
import MyCustomMembersPage from './pages/MyMembersPage';

createRoot(document.getElementById('root')).render(
  <App
    config={config}
    overrides={{ MembersPage: MyCustomMembersPage }}
  />,
);
```

Overridable components: `Header`, `Footer`, `LandingPage`, `MembersPage`, `CallbackPage`, `OnboardingPage`, `ProfilePage`. Any component not overridden uses the default from the kit.

### Colors and theme

Edit the CSS custom properties in `src/index.css` under `:root`:

```css
:root {
  --primary: 197 78% 53%;   /* main brand color (HSL) */
  --secondary: 2 76% 58%;   /* accent */
  --accent: 45 95% 62%;     /* highlight */
}
```

All colors use HSL format. The hero gradient adapts automatically to your `--primary` color. You can ask an AI tool: "Change the primary color to royal blue."

### Images

Replace files in `public/`. Then update the `images:` section in `site.config.js` if you use different filenames.

---

## Streaming Chat

The chat widget supports **SSE streaming** — responses appear progressively, token by token, as the AI generates them. This provides a faster-feeling experience compared to waiting for the complete response.

Streaming is controlled by the **CAM** (CogBot Access Manager) service, not by Cloudant configuration. When CAM has `STREAM_MESSAGES=true` in its environment, it injects `config.streaming: true` into the cogbot init response. The membership kit reads this flag and automatically switches between:

- **Streaming mode** (`/message/stream`) — progressive token-by-token rendering via Server-Sent Events (SSE)
- **JSON mode** (`/message`) — complete response delivered at once

No code changes are needed in the SPA to enable or disable streaming — it is entirely controlled by the CAM deployment configuration. This also means different deployments (e.g. a production widget and a membership SPA) can independently control streaming for the same cogbot.

---

## Member Onboarding

When a new member signs in for the first time, CMG returns `autoProvisioned: true`. The app redirects them to a three-step onboarding wizard (`/onboarding`) instead of the members page:

1. **Your Info** — first name (pre-filled from App ID profile), last name (optional)
2. **Baby Info** — child's name, gender, birthday; supports multiple children via "Add another child"
3. **All Set** — summary confirmation, then navigates to `/members`

On completion the wizard calls `cmgClient.saveProfile(idToken, { parent, children })`, which `PUT`s the structured profile to CMG (`/auth/me/profile`). CMG persists it on the Cloudant `users` doc under the free-form `profile` field and stamps `updatedAt` / `updatedBy: "self"` server-side. CMG then fires a best-effort cache-invalidation hook to be-pfc so the next agent invocation reads the new value immediately. Onboarding no longer goes through CAM / `save_memory`.

A `localStorage` flag (`onboarded_{uid}`) is set when onboarding is completed or skipped. The members page checks this flag on mount and redirects to `/onboarding` if it is absent, ensuring that users who were removed and re-admitted also go through onboarding.

### Profile management

Members can update their name and child info at any time via the **Edit Profile** option in the user account dropdown (top-right of every page). Saving calls the same `cmgClient.saveProfile` path as onboarding, replacing the stored profile wholesale.

Admins can also view and edit a member's profile from the CogUniversity CMM plugin's member-detail page; admin-initiated saves are stamped `updatedBy: "admin:<email>"`. Both paths invalidate the agent's profile cache automatically so the change is visible on the next chat turn.

Password management via the profile page is supported for Cloud Directory (email/password) users only. Google and other social login users manage their credentials through their identity provider.

---

## Member Data: Profile vs Long-Term Memory

Member context for Buddy lives in two places, with a deliberate split of concerns:

**Structured profile (Cloudant `users.profile`)** — the authoritative onboarding snapshot (parent name, children, etc.).

- Written by the SPA (this app) and CMM, never by the agent.
- Editable from the SPA's Onboarding wizard, the SPA's Profile page, and the CMM plugin's member-detail page.
- Stored on the Cloudant `users` doc under `profile` via CMG (`PUT /auth/me/profile` for self, `PUT /admin/members/:email` for admins). Both endpoints stamp `updatedAt` / `updatedBy` server-side.
- be-pfc reads it on every agent invocation and renders it as a `<profile>` block in the system prompt.

**Long-term memory (Pinecone via Mem0)** — *emergent* facts the user reveals during chat (preferences, opinions, anecdotes, hobbies that aren't part of the structured profile).

- Written exclusively by the be-pfc agent's `save_memory` tool when it detects new self-disclosure in a message.
- Read on every chat as a `<memory>` block alongside `<profile>`.
- The agent is explicitly instructed not to mirror fields already present in `<profile>` (parent name, children, etc.) — onboarding data lives in Cloudant, not LTM.

`save_memory` only runs for authenticated (non-anonymous) users. Anonymous public chat sessions do not persist long-term memory.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values from your CogAbility credentials sheet:

| Variable | Description |
|---|---|
| `VITE_APPID_CLIENT_ID` | App ID application client ID |
| `VITE_APPID_OAUTH_SERVER_URL` | App ID OAuth server URL (e.g. `https://us-south.appid.cloud.ibm.com/oauth/v4/TENANT_ID`) |
| `VITE_CMG_URL` | Base URL of your CMG instance |
| `VITE_SITE_NAMESPACE` | Namespace for role filtering (must match Cloudant role definitions) |
| `VITE_COGBOT_HOST` | CAM (CogBot Access Manager) base URL (no trailing slash). In local dev, leave unset — the Vite proxy defaults to `http://localhost:8085`. In production, set to your deployed CAM URL (e.g. `https://cam.yourplatform.com`). |
| `VITE_COGBOT_ID` | CogBot ID for this site (e.g. `mc_0091:full`) |

Never commit `.env` to git — it is listed in `.gitignore`.

---

## Deploying

### Lovable (step-by-step example)

[Lovable](https://lovable.dev) is an AI-powered web app builder that can host your site and let you make changes using natural language. Here's how to deploy:

1. **Push your customized repo to GitHub** — make sure `site.config.js`, your images, and `.env.example` are committed (never commit `.env` itself).
2. **Create a Lovable project** — go to [lovable.dev](https://lovable.dev), create a new project, and choose **Import from GitHub**. Select your repo.
3. **Set environment variables** — in your Lovable project, go to **Settings** (gear icon) and find the **Environment Variables** or **Secrets** section. Add each `VITE_*` variable from your credentials sheet:
   - `VITE_APPID_CLIENT_ID`
   - `VITE_APPID_OAUTH_SERVER_URL`
   - `VITE_CMG_URL`
   - `VITE_SITE_NAMESPACE`
   - `VITE_COGBOT_HOST` — your deployed CAM URL
   - `VITE_COGBOT_ID`
4. **Deploy** — Lovable automatically builds and deploys your site. The build command is `npm run build` and the output directory is `dist`.
5. **Copy your live URL** — once deployed, copy the URL that Lovable gives you (e.g. `https://your-project.lovable.app`).
6. **Send your URL to CogAbility** — your CogAbility contact needs to add your production URL to the CAM CORS allowlist. Chat will not work until this is done.
7. **Make changes** — use Lovable's AI chat to make further branding or content changes. Ask things like "Change the hero tagline to..." or "Add a new testimonial."

### Bolt.new

Import your GitHub repo into [Bolt.new](https://bolt.new). Set the `VITE_*` environment variables in the project settings. Bolt handles the build and deployment automatically.

### Replit

Import your repo from GitHub into [Replit](https://replit.com). Set environment variables via the **Secrets** panel (lock icon in the sidebar). Run `npm run build` to build, or `npm run dev` for development.

### Vercel / Netlify

Connect your GitHub repo in the platform dashboard. Configure:
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variables:** add all `VITE_*` variables

### After deploying (all platforms)

**CORS setup is required.** After your site is live, send your production URL to your CogAbility contact so they can add it to the CAM CORS allowlist (managed in Cloudant). Without this, chat requests will fail with CORS errors.

---

## Running Locally

```bash
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

The dev server starts at `http://localhost:5174`.

### Prerequisites

The full local stack requires two backend services in addition to the SPA dev server:

1. Start **CMG** (`cmg-cogbot-membership-gateway`) — handles sign-in and membership validation. Defaults to port `3010`, which matches `VITE_CMG_URL` in `.env`:
   ```bash
   cd /path/to/cmg-cogbot-membership-gateway
   npm run dev
   ```
2. Start **CAM** (`cam-cogbot-access-manager`) — handles chat sessions and SSE streaming. Defaults to port `8085`:
   ```bash
   cd /path/to/cam-cogbot-access-manager
   npm run start-dev
   ```
3. Leave `VITE_COGBOT_HOST` **unset** (or commented out) in your `.env`. The Vite dev server proxies `/cogbot-api` requests to `http://localhost:8085` by default.
4. Start the membership template:
   ```bash
   npm run dev
   ```

The Vite proxy handles CORS automatically during local development — no CORS configuration is needed.

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| Chat shows a CORS error in the browser console | Your production domain isn't in the CAM CORS allowlist | Send your live URL to your CogAbility contact |
| Blank page after deploying | One or more `VITE_*` environment variables are missing | Check that all 6 are set in your platform's settings and redeploy |
| Sign-in popup doesn't appear or is blocked | Browser popup blocker | Allow popups for your site's domain, or try a different browser |
| "Access Denied" after signing in | Your email isn't in the Cloudant member whitelist | Ask your CogAbility contact to add your email, or enable auto-provisioning for your namespace |
| Images are broken or show "Replace me" | Placeholder images haven't been replaced | Add your own images to `public/` and update `images:` paths in `site.config.js` |
| Browser tab still shows old title | Stale build cache | Clear the build cache in your hosting platform and redeploy |
| Sign-in completes but user lands on Access Denied unexpectedly | CMG is not running | Start CMG (`npm run dev` in the `cmg-cogbot-membership-gateway` directory) |
| Chat says "initializing" forever (local dev) | CAM is not running, or `VITE_COGBOT_HOST` is set to a non-reachable URL | Start CAM (`npm run start-dev` in the CAM directory) and leave `VITE_COGBOT_HOST` unset in `.env` so the Vite proxy defaults to `localhost:8085` |
| Chat says "initializing" forever (production) | `VITE_COGBOT_HOST` or `VITE_COGBOT_ID` is wrong | Double-check these values against your credentials sheet |

---

## Project Structure

```
cogbot-membership-website-template/
  site.config.js          <- Edit this to customize branding, content, and SEO
  .env                    <- Your service credentials (gitignored)
  .env.example            <- Env var template (committed)
  index.html              <- HTML shell; Vite replaces placeholder tokens with values from site.config.js at build time
  public/
    bot-icon.svg            <- Chat avatar icon (replace with your own)
    org-logo.svg            <- Org logo (replace with your own)
    favicon.svg             <- Browser tab icon
  src/
    main.jsx               Entry point — boots @cogability/membership-kit with your config
    index.css              Design tokens and global styles
  packages/
    membership-kit/        <- Kit source (npm workspace — symlinked into node_modules)
      package.json         <- Kit version and dependency manifest
      src/                 <- All components, auth, hooks, services, and pages
    sdk/                   <- @cogability/sdk — framework-agnostic CAM/CMG client
      package.json
      src/
        cam-client.js      <- CamClient (chat sessions, streaming)
        cmg-client.js      <- CmgClient (membership, geofencing)
        auth-client.js     <- AuthClient (OIDC / App ID)
        sse-parser.js      <- SSE stream parser
        session-store.js   <- BrowserSessionStore / MemorySessionStore
  vite.config.js           Build config, dev proxy (CAM)
  tailwind.config.js       Tailwind config
```

All reusable code (auth, chat, pages, components, hooks, streaming) lives in `packages/membership-kit/src/`. The kit depends on `packages/sdk/` (`@cogability/sdk`) for all HTTP communication with CAM and CMG — the SDK has no React dependency and can be used independently in any JavaScript environment. Both packages are wired into the build as npm workspaces — each is symlinked into `node_modules/`. See [`packages/sdk/README.md`](packages/sdk/README.md) for SDK usage examples (Vue, vanilla JS, Node.js agents).

---

## Tech Stack

- **React 19 + Vite** — framework and build
- **Tailwind CSS v3** — styling
- **React Router v7** — client-side routing
- **oidc-client-ts** — IBM App ID OIDC browser SDK

---

## Architecture Notes

### No backend in this repo

This is a pure static SPA. All server-side logic lives in external services:

| Layer | Responsibility |
|---|---|
| **This UI** | Login UX, onboarding wizard, profile management, page layout, route gating |
| **`@cogability/sdk`** | Framework-agnostic HTTP client layer — `CamClient` (chat/sessions), `CmgClient` (membership/geofencing), `AuthClient` (OIDC). Used by the kit internally; also importable directly in Vue, vanilla JS, or Node.js agents. See [`packages/sdk/README.md`](packages/sdk/README.md). |
| **App ID** | Authentication — issues JWTs, supports email/password and social login (Google, etc.) |
| **CMG** | Membership validation — verifies JWTs, checks Cloudant, returns roles and `autoProvisioned` flag |
| **Cloudant** | Source of truth for whitelist entries and role definitions |
| **CAM** | CogBot Access Manager — session management, auth header injection, SSE streaming relay, routes messages to be-pfc. Each CAM instance independently controls streaming via `STREAM_MESSAGES`. |
| **be-pfc** | AI cascade (LangGraph), long-term memory via Mem0 + Pinecone |

### CORS

During local development, `/cogbot-api` requests are proxied through the Vite dev server to CAM (defaulting to `http://localhost:8085`), so no CORS configuration is needed locally.

For production (platform hosting), CAM must allow your deployed domain in its CORS allowlist. After deploying, send your production URL to your CogAbility contact and they will add it to the Cloudant CORS allowlist document used by CAM.

### Geofencing

CMG can restrict access by geographic location using two independently configurable flags:

- **`enabled_for_anonymous_users`** — gates the public chat widget on the landing page and blocks new auto-provisioned signups from outside the allowed region.
- **`enabled_for_members`** — blocks existing members from accessing the members area when logging in from outside the allowed region.

When a user is geofenced, CMG returns:
```json
{ "isMember": false, "geofenced": true, "geofenceMessage": "..." }
```

On the public landing page, the Hero component shows a "Not Available in Your Area" notice instead of the chat widget. On the members page, `RoleGate` displays the geofence message automatically. No UI code changes are needed — geofencing is configured entirely in the Cloudant cogbot documents for your namespace.
