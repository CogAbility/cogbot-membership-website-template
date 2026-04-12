# cogbot-membership-website-template

A membership-gated website template powered by CogBot chat and IBM App ID authentication. Fork this template to create a branded membership site for your organization — customize it by editing one config file.

## How It Works

```
Browser (React SPA)
  │
  ├─ App ID login ──► IBM App ID ──► idToken
  │
  └─ POST /auth/validate ──► CMG (CogBot Membership Gateway)
                               │
                               ├─ 1. Verify JWT (App ID JWKS)
                               ├─ 2. Geofence check (if configured)
                               └─ 3. Cloudant whitelist lookup
                                       │
                                       ├─ isMember: true, autoProvisioned: true
                                       │     └─ /onboarding wizard (new members)
                                       │           └─ Collects name + baby/child info
                                       │                └─ Authenticated message → CogBot server → be-pfc
                                       │                     └─ save_memory tool → Pinecone (Mem0)
                                       │                          └─ get_memory injects profile into
                                       │                               system prompt on every chat
                                       │
                                       ├─ isMember: true, returning member
                                       │     └─ localStorage onboarded_{uid} flag → /members + CogBot chat
                                       │
                                       └─ isMember: false → Access Denied
```

The UI is a **static SPA** with zero backend code. All membership logic lives in CMG. Long-term memory is managed by **be-pfc** (Prefrontal Cortex backend) using Mem0 and Pinecone.

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
| CogBot Host URL | Your CogBot widget server |
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
| `hero` | Tagline, subtitle, stats, chat label |
| `features` | Section heading and feature cards |
| `testimonials` | Section heading and testimonial cards |
| `about` | Section heading, paragraphs, checklist, CTAs |
| `members` | Member page headings, quick tips, bot description |
| `onboarding` | Wizard headings, step labels, gender/month options, skip label |
| `profile` | Profile page headings, save label, change password label |
| `footer` | Brand name, nav links, copyright, powered-by |

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

## Member Onboarding

When a new member signs in for the first time, CMG returns `autoProvisioned: true`. The app redirects them to a three-step onboarding wizard (`/onboarding`) instead of the members page:

1. **Your Info** — first name (pre-filled from App ID profile), last name (optional)
2. **Baby Info** — child's name, gender, birthday; supports multiple children via "Add another child"
3. **All Set** — summary confirmation, then navigates to `/members`

On completion the wizard fires an authenticated message to the CogBot server with the collected profile. The be-pfc agent's `save_memory` tool saves it to Pinecone. On every subsequent chat, `get_memory` retrieves the profile and injects it into the system prompt so Buddy can give personalized responses.

A `localStorage` flag (`onboarded_{uid}`) is set when onboarding is completed or skipped. The members page checks this flag on mount and redirects to `/onboarding` if it is absent, ensuring that users who were removed and re-admitted also go through onboarding.

### Profile management

Members can update their name and child info at any time via the **Edit Profile** option in the user account dropdown (top-right of every page). Saving sends a new authenticated message to be-pfc, which overwrites the existing Pinecone memory entry.

Password management via the profile page is supported for Cloud Directory (email/password) users only. Google and other social login users manage their credentials through their identity provider.

---

## Long-Term Memory (Pinecone)

User profile data is persisted in Pinecone via **be-pfc** (the Prefrontal Cortex AI backend) using [Mem0](https://mem0.ai):

- **During onboarding / profile save** — the browser sends an authenticated chat message containing the user's name and child info. The be-pfc agent calls `save_memory`, which stores the profile as a JSON document in Pinecone indexed by user ID with scope `user_profile`.
- **During every chat** — `get_memory` retrieves the stored profile and prepends it to the system prompt as a `<memory>` block. Buddy uses this to personalize all responses.
- **During chat conversations** — the agent also calls `save_memory` whenever the user discloses additional personal information (preferences, locations, family details, etc.), keeping the profile up to date automatically.

`save_memory` only runs for authenticated (non-anonymous) users. Anonymous public chat sessions do not persist memory.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values from your CogAbility credentials sheet:

| Variable | Description |
|---|---|
| `VITE_APPID_CLIENT_ID` | App ID application client ID |
| `VITE_APPID_OAUTH_SERVER_URL` | App ID OAuth server URL (e.g. `https://us-south.appid.cloud.ibm.com/oauth/v4/TENANT_ID`) |
| `VITE_CMG_URL` | Base URL of your CMG instance |
| `VITE_SITE_NAMESPACE` | Namespace for role filtering (must match Cloudant role definitions) |
| `VITE_COGBOT_HOST` | CogBot widget server base URL (no trailing slash) |
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
   - `VITE_COGBOT_HOST`
   - `VITE_COGBOT_ID`
4. **Deploy** — Lovable automatically builds and deploys your site. The build command is `npm run build` and the output directory is `dist`.
5. **Copy your live URL** — once deployed, copy the URL that Lovable gives you (e.g. `https://your-project.lovable.app`).
6. **Send your URL to CogAbility** — your CogAbility contact needs to add your production URL to the CogBot server's CORS allowlist. Chat will not work until this is done.
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

**CORS setup is required.** After your site is live, send your production URL to your CogAbility contact so they can add it to the CogBot server's CORS allowlist. Without this, chat requests will fail with CORS errors.

---

## Running Locally

```bash
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

The dev server starts at `http://localhost:5174`. During development, `/cogbot-api` requests are proxied to `VITE_COGBOT_HOST`, so no CORS configuration is needed locally.

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| Chat shows a CORS error in the browser console | Your production domain isn't in the CogBot CORS allowlist | Send your live URL to your CogAbility contact |
| Blank page after deploying | One or more `VITE_*` environment variables are missing | Check that all 6 are set in your platform's settings and redeploy |
| Sign-in popup doesn't appear or is blocked | Browser popup blocker | Allow popups for your site's domain, or try a different browser |
| "Access Denied" after signing in | Your email isn't in the Cloudant member whitelist | Ask your CogAbility contact to add your email, or enable auto-provisioning for your namespace |
| Images are broken or show "Replace me" | Placeholder images haven't been replaced | Add your own images to `public/` and update `images:` paths in `site.config.js` |
| Browser tab still shows old title | Stale build cache | Clear the build cache in your hosting platform and redeploy |
| Login works but chat says "initializing" forever | `VITE_COGBOT_HOST` or `VITE_COGBOT_ID` is wrong | Double-check these values against your credentials sheet |

---

## Pulling Template Updates

> **Note:** This requires git command-line knowledge. If you're using Lovable or another AI tool and aren't comfortable with git, your CogAbility contact can help you pull updates when needed.

When this template is updated (bug fixes, new features), you can pull the changes into your client repo:

```bash
# One-time setup: add the template as a remote
git remote add template https://github.com/CogAbility/cogbot-membership-website-template.git

# Pull updates from the template
git fetch template
git merge template/main --allow-unrelated-histories
```

Since your customizations live only in `site.config.js`, `.env`, and `public/`, merges are typically clean with no conflicts.

---

## Project Structure

```
cogbot-membership-website-template/
  site.config.js          ← Edit this to customize branding, content, and SEO
  .env                    ← Your service credentials (gitignored)
  .env.example            ← Env var template (committed)
  index.html              ← Auto-generated from site.config.js (do not edit directly)
  public/
    bot-icon.svg            ← Chat avatar icon (replace with your own)
    org-logo.svg            ← Org logo (replace with your own)
    favicon.svg             ← Browser tab icon
  src/
    auth/
      AuthProvider.jsx     App ID login/logout and user state
      userManager.js       oidc-client-ts configuration
      ProtectedRoute.jsx   Requires authentication
      RoleGate.jsx         Requires CMG membership + optional role
      useAuthorization.js  Calls CMG /auth/validate
    components/
      Header.jsx
      Footer.jsx
      Hero.jsx
      Features.jsx
      Testimonials.jsx
      About.jsx
      BuddyChat.jsx                  Chat UI component
      CogBotEmbed.jsx                Wrapper for BuddyChat
      OnboardingProgressIndicator.jsx  Step progress indicator
      ProfileFormFields.jsx            Shared form fields (name, child info)
    pages/
      LandingPage.jsx      Public page
      MembersPage.jsx      Member-only page with CogBot
      OnboardingPage.jsx   New member 3-step onboarding wizard
      ProfilePage.jsx      Member profile management
      LoginPage.jsx        Shown when unauthenticated
      AccessDenied.jsx     Shown when not authorized
      CallbackPage.jsx     OIDC callback handler
    hooks/
      useBuddyChat.js      Chat session state
    services/
      buddyApi.js          CogBot HTTP API client (anonymous + authenticated)
    App.jsx                Routes
    main.jsx               Entry point
    index.css              Design tokens and global styles
  vite.config.js           Build config, dev proxy, and site meta plugin
```

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
| **App ID** | Authentication — issues JWTs, supports email/password and social login (Google, etc.) |
| **CMG** | Membership validation — verifies JWTs, checks Cloudant, returns roles and `autoProvisioned` flag |
| **Cloudant** | Source of truth for whitelist entries and role definitions |
| **CogBot server** | Widget BFF — session management, routes messages to be-pfc |
| **be-pfc** | AI cascade (LangGraph), long-term memory via Mem0 + Pinecone |

### CORS

During local development, `/cogbot-api` requests are proxied through the Vite dev server to `VITE_COGBOT_HOST`, so no CORS configuration is needed locally.

For production (platform hosting), the CogBot server must allow your deployed domain in its CORS settings. After deploying, send your production URL to your CogAbility contact and they will configure this for you.

### Geofencing

CMG can restrict access by geographic location. When a user is geofenced, CMG returns:
```json
{ "isMember": false, "geofenced": true, "geofenceMessage": "..." }
```
`RoleGate` displays the `geofenceMessage` automatically — no UI code changes needed. Once a user has joined as a member within the allowed region, geofencing no longer applies to them on future logins.
