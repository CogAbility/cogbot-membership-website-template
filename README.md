# cogbot-membership-website-template

A membership-gated website template powered by CogBot chat and IBM App ID authentication. Fork this template to create a branded membership site for your organization — customize it by editing one config file.

## How It Works

```
Browser (React SPA)
  │
  ├─ App ID popup login ──► IBM App ID ──► idToken
  │
  └─ POST /auth/validate ──► CMG (CogBot Membership Gateway)
                               │
                               ├─ 1. Verify JWT (App ID JWKS)
                               ├─ 2. Geofence check (if configured)
                               └─ 3. Cloudant whitelist lookup
                                       │
                                       ├─ isMember: true  → /members page + CogBot chat
                                       └─ isMember: false → Access Denied
```

The UI is a **static SPA** with zero backend code. All membership logic lives in CMG.

---

## Getting Started

### 1. Create your repo from this template

Click **Use this template** on GitHub to create your own repo. Do not fork — the template creates a clean copy with no upstream link.

### 2. Customize the config

Edit `site.config.js` at the project root. This is the only file you need to change to rebrand the site:

```js
export default {
  siteName: 'Your Organization Name',
  botName: 'Your Bot Name',
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

Put your own images in `public/`:
- `public/buddy-icon.webp` — chat avatar shown in the hero and header
- `public/bab-full-logo.webp` — org logo shown in the hero "Presented by" section
- `public/favicon.svg` — browser tab icon

### 4. Set your credentials

```bash
cp .env.example .env
```

Edit `.env` and fill in your service credentials. See [Environment Variables](#environment-variables) below.

### 5. Deploy

Push to GitHub and connect to your hosting platform. See [Deploying](#deploying) below.

---

## Customizing

### Content and branding

Edit `site.config.js`. Every user-visible string lives here:

| Section | What it controls |
|---|---|
| `siteName`, `botName` | Core identity used throughout the site |
| `images` | Paths to logo and icon files in `public/` |
| `header` | Project badge, sign-in button label, member badge |
| `hero` | Tagline, subtitle, stats, chat label |
| `features` | Section heading and feature cards |
| `testimonials` | Section heading and testimonial cards |
| `about` | Section heading, paragraphs, checklist, CTAs |
| `members` | Member page headings, quick tips, bot description |
| `footer` | Brand name, nav links, copyright, powered-by |

### Colors and theme

Edit the CSS custom properties in `src/index.css` under `:root`:

```css
:root {
  --primary: 197 78% 53%;   /* main brand color (HSL) */
  --secondary: 2 76% 58%;   /* accent */
  --accent: 45 95% 62%;     /* highlight */
}
```

All colors use HSL format. You can ask an AI tool: "Change the primary color to royal blue."

### Images

Replace files in `public/`. Then update the `images:` section in `site.config.js` if you use different filenames.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

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

### Platform hosting (recommended)

The easiest option. Connect your GitHub repo to one of these platforms and they handle deployment automatically:

**Lovable** — import your repo and deploy with one click. Set environment variables in project settings.

**Vercel / Netlify** — connect your GitHub repo. Set `VITE_*` environment variables in the platform dashboard.
- Build command: `npm run build`
- Output directory: `dist`

**Replit** — import from GitHub and run `npm run build`. Set secrets via the Replit Secrets panel.

### Running locally

```bash
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

The dev server starts at `http://localhost:5173`. During development, `/cogbot-api` requests are proxied to `VITE_COGBOT_HOST`, so no CORS configuration is needed locally.

---

## Pulling Template Updates

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
  site.config.js          ← Edit this to customize branding and content
  .env                    ← Your service credentials (gitignored)
  .env.example            ← Env var template (committed)
  public/
    buddy-icon.webp        ← Chat avatar icon
    bab-full-logo.webp     ← Org logo
    favicon.svg            ← Browser tab icon
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
      BuddyChat.jsx        Chat UI component
      CogBotEmbed.jsx      Wrapper for BuddyChat
    pages/
      LandingPage.jsx      Public page
      MembersPage.jsx      Member-only page with CogBot
      LoginPage.jsx        Shown when unauthenticated
      AccessDenied.jsx     Shown when not authorized
      CallbackPage.jsx     OIDC callback handler
    hooks/
      useBuddyChat.js      Chat session state
    services/
      buddyApi.js          CogBot HTTP API client
    App.jsx                Routes
    main.jsx               Entry point
    index.css              Design tokens and global styles
  vite.config.js           Build config and dev proxy
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
| **This UI** | Login UX, page layout, route gating |
| **App ID** | Authentication — issues JWTs |
| **CMG** | Membership validation — verifies JWTs, checks Cloudant, returns roles |
| **Cloudant** | Source of truth for whitelist entries and role definitions |
| **CogBot server** | AI chat responses |

### CORS

During local development, `/cogbot-api` requests are proxied through the Vite dev server to `VITE_COGBOT_HOST`, so no CORS configuration is needed locally.

For production (platform hosting), the CogBot server must allow your deployed domain in its CORS settings.

### Geofencing

CMG can restrict access by geographic location. When a user is geofenced, CMG returns:
```json
{ "isMember": false, "geofenced": true, "geofenceMessage": "..." }
```
`RoleGate` displays the `geofenceMessage` automatically — no UI code changes needed.
