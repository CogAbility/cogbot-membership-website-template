# Build a Brain UI

Members-only website for Build a Brain Pensacola, powered by the Buddy CogBot. This is also a **reference implementation** for any team building a membership-gated UI that authenticates via IBM App ID and validates membership through [CMG (CogBot Membership Gateway)](../cmg/).

## How It Works

```
Browser (React SPA)
  │
  ├─ App ID popup login ──► IBM App ID ──► idToken
  │
  └─ POST /auth/validate ──► CMG
                               │
                               ├─ 1. Verify JWT (App ID JWKS)
                               ├─ 2. Geofence check (if configured)
                               │       └─ blocked → geofenced: true → "Not Available in Your Area"
                               └─ 3. Cloudant whitelist lookup
                                       │
                                       ├─ isMember: true  → /members page
                                       └─ isMember: false → Access Denied
```

The UI is a **static SPA** with zero backend code. All membership logic lives in CMG. The only runtime dependency beyond App ID is a single `fetch` call to CMG's `/auth/validate` endpoint.

## Setup

### 1. Configure environment

```bash
cp .env.example .env
```

| Variable | Description | Where to find it |
|---|---|---|
| `VITE_APPID_CLIENT_ID` | App ID application client ID | IBM Cloud → App ID → Applications |
| `VITE_APPID_DISCOVERY_ENDPOINT` | App ID OIDC discovery endpoint | IBM Cloud → App ID → Service Credentials |
| `VITE_CMG_API` | Base URL of your CMG instance | Your deployed CMG (e.g. `http://localhost:3001`) |
| `VITE_CMG_NAMESPACE` | Namespace for role filtering | Matches your Cloudant role definitions (e.g. `bab`) |

### 2. Ensure CMG is running

CMG must be up and configured with access to the same App ID tenant and Cloudant databases. See the [CMG README](../cmg/README.md).

### 3. CORS

- **CMG** must list your UI origin in its `CORS_ORIGINS` env var.
- **CogBot server** must whitelist your domain for the embedded widget to work.

### 4. Run locally

```bash
npm install
npm run dev
```

App will be at `http://localhost:5173`.

## Authentication & Membership Flow

1. User visits `/members`
2. `ProtectedRoute` checks `isAuthenticated` — if false, renders `LoginPage`
3. User clicks sign in — App ID popup opens
4. App ID returns `idToken` + `accessToken`, stored in `sessionStorage`
5. `useAuthorization` hook fires `POST ${VITE_CMG_API}/auth/validate` with `{ idToken, namespace }`
6. CMG verifies the JWT via JWKS
7. CMG runs geofence check (if configured for this namespace) — if blocked, returns `{ isMember: false, geofenced: true, geofenceMessage }`
8. CMG looks up the email in Cloudant, returns `{ isMember, email, roles }`
9. `RoleGate` checks `isMember` (and `geofenced`) and optionally a specific role name
10. Authorized → `MembersPage` with full CogBot widget
11. Geofenced → `AccessDenied` page with location icon and the configured `geofenceMessage`
12. Not authorized → `AccessDenied` page with generic membership message

## Geofencing

Access to the members area can be restricted by the user's geographic location (state and/or county). Geofencing is configured entirely in CMG — no UI code changes are needed to enable, adjust, or disable it.

When a user is blocked by geofencing, CMG returns:

```json
{
  "isMember": false,
  "geofenced": true,
  "geofenceMessage": "Build-a-Brain is currently only available in Texas, Louisiana, and Oklahoma."
}
```

`RoleGate` detects the `geofenced` flag and renders `AccessDenied` with a map-pin icon and the custom message from Cloudant, instead of the standard "Access Restricted" view.

To configure geofencing for a namespace, see the [CMG README](../cmg-cogbot-membership-manager/README.md#geofencing).

## Project Structure

```
build-a-brain-ui/
  public/
    buddy-chat.html           CogBot widget host (iframe target)
  src/
    auth/
      AuthProvider.jsx         App ID context — login(), logout(), user state
      ProtectedRoute.jsx       Renders LoginPage when unauthenticated
      RoleGate.jsx             Renders AccessDenied when not a member / missing role
      useAuthorization.js      Calls CMG /auth/validate, returns isMember + roles
    components/
      Header.jsx
      Footer.jsx
      Hero.jsx
      Features.jsx
      Testimonials.jsx
      About.jsx
      CogBotEmbed.jsx          iframe wrapper for buddy-chat.html
    pages/
      LandingPage.jsx          Public page
      MembersPage.jsx          Protected member-only page
      LoginPage.jsx            Shown when unauthenticated
      AccessDenied.jsx         Shown when unauthorized
    App.jsx                    Router — wires public and protected routes
    main.jsx                   Entry point
```

## Tech Stack

- **React 19 + Vite** — framework and build
- **Tailwind CSS v3** — styling
- **React Router v7** — client-side routing
- **ibmcloud-appid-js** — IBM App ID browser SDK

---

## Building Your Own Membership UI

This project is intentionally simple so it can serve as a template. To create a new membership-gated site (e.g. a provider portal, a training platform), follow the steps below.

### 1. Scaffold a new Vite + React project

```bash
npm create vite@latest my-member-site -- --template react
cd my-member-site
npm install ibmcloud-appid-js react-router-dom
```

### 2. Copy the auth modules

Copy these four files from this repo into your new project's `src/auth/` directory:

| File | What it does |
|---|---|
| `AuthProvider.jsx` | Manages App ID login/logout and user state via React context |
| `useAuthorization.js` | Calls CMG to validate membership. **No changes needed** — it reads `VITE_CMG_API` and `VITE_CMG_NAMESPACE` from env |
| `ProtectedRoute.jsx` | Redirects unauthenticated users to a login page |
| `RoleGate.jsx` | Blocks users who aren't members or lack a required role |

These files contain **no app-specific logic**. They work with any namespace and any role names.

### 3. Configure your `.env`

```bash
VITE_APPID_CLIENT_ID=your-client-id
VITE_APPID_DISCOVERY_ENDPOINT=https://us-south.appid.cloud.ibm.com/oauth/v4/TENANT_ID/.well-known/openid-configuration
VITE_CMG_API=https://your-cmg-instance.example.com
VITE_CMG_NAMESPACE=my-namespace
```

The `namespace` is a short string (e.g. `bab`, `provider`, `training`) that CMG uses to filter which roles apply to your site. Choose one and make sure matching role definitions exist in the Cloudant `roles` database.

### 4. Wire routes in App.jsx

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import ProtectedRoute from './auth/ProtectedRoute';
import RoleGate from './auth/RoleGate';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RoleGate requiredRole="member">
                  <Dashboard />
                </RoleGate>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

- `ProtectedRoute` ensures the user is logged in via App ID.
- `RoleGate` ensures they are a member (via CMG) and optionally hold a specific role.
- `requiredRole` matches against the `name` field of roles in Cloudant (e.g. `"member"`, `"admin"`). You can also use the fully-qualified form `"namespace:name"` (e.g. `"bab:member"`).

### 5. Add members to CMG

Use the CMG admin API (or create Cloudant docs directly) to whitelist users:

```bash
curl -X POST https://your-cmg/admin/whitelist \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "active": true,
    "roles": [{ "namespace": "my-namespace", "name": "member" }]
  }'
```

A single user can have roles across multiple namespaces, so one whitelist entry can grant access to several membership sites.

### 6. Deploy

The result is a static site. Deploy it anywhere:

- **IBM Code Engine** — `ibmcloud ce app create --name my-site --build-source .`
- **Cloud Object Storage + CDN** — `npm run build` and upload `dist/`
- **Any static host** — Netlify, Vercel, GitHub Pages, etc.

The only runtime requirement is network access to CMG and App ID.

### Summary of responsibilities

| Layer | Responsibility |
|---|---|
| **Your UI** | Login UX, page layout, route gating |
| **App ID** | Authentication — issues JWTs |
| **CMG** | Membership validation — verifies JWTs, checks Cloudant, returns roles |
| **Cloudant** | Source of truth for whitelist entries and role definitions |

Your UI never touches Cloudant or verifies JWTs. It sends the App ID token to CMG and acts on the boolean response.
