# Access code gate prompt for Lovable

> **⚠️ KIT-ONLY — do NOT use on custom apps like babybrain.ai.** This prompt is written exclusively for sites built on `@cogability/membership-kit` via the `cogbot-membership-website-template` (JavaScript, `src/main.jsx`, `overrides` prop, `useAuth()` from the kit). It assumes files like `src/main.jsx`, `MembersPage.jsx`, and `OnboardingPage.jsx` and env vars `VITE_CMG_URL` / `VITE_SITE_NAMESPACE`.
>
> **babybrain.ai is NOT a kit app** — it is a custom TypeScript/shadcn app that uses `@cogability/sdk` (`AuthClient`/`CmgClient` in `src/lib/cogability.ts`) with its own `src/pages/Callback.tsx`; as of 2026-08-01, the access-code gate could not be confirmed as shipped there — babybrain.ai's production bundle contains no `/redeem-code` route (though `/access-denied` is present). Pasting this prompt there will not compile and will create dead `.jsx` files. For custom (non-kit) apps, edit the app's existing callback/route logic directly instead of using this prompt.

> **Audience.** A Lovable site already running `@cogability/membership-kit` via the `cogbot-membership-website-template`. The backend — CMG configured with `requires_access_code: true` on the namespace role doc — is already live. This prompt wires up the frontend challenge UI.
>
> **What this is.** A single message you paste into Lovable's chat. Lovable's AI creates one new file and edits one existing file. No new dependencies. No router changes.

## Before you paste

1. **Confirm the backend is configured.** The CMG Cloudant role doc for your namespace must have:
   - `auto_provisioning.enabled: true`
   - `requires_access_code: true`
   
   Without this, the code-entry form never appears — CMG will continue to auto-provision users without asking for a code.

2. **Confirm your site uses path mode.** This prompt works when `VITE_ROUTER_MODE` is `path` (the default) or is not set. Path mode is correct for sites served on a custom domain. If your Lovable environment variable `VITE_ROUTER_MODE` is set to `hash`, do not use this prompt — contact your CogAbility developer first.

3. **Open Lovable chat** for your project and paste the entire fenced block below as a single message.

## What you should see after Lovable finishes

- **Created:** `src/CallbackPage.jsx`
- **Modified:** `src/main.jsx` (adds `CallbackPage` to the `overrides` prop)

No other files should change. If Lovable modifies anything else, see [Iteration troubleshooting](#iteration-troubleshooting).

After Lovable confirms, click **Publish**. Then run the smoke test below.

## The prompt to paste

````
INSTRUCTIONS FOR LOVABLE AI — read fully before doing anything.

I want to add an access code membership gate to this site. When a user signs in and CMG requires an access code before granting membership, the site should show a code-entry form instead of an "Access Denied" screen. Do exactly what is below — no more, no less. After the changes, summarise what you did — do not ask me to confirm beforehand.

Hard rules (do not violate any of these):
- Do NOT install any npm packages.
- Do NOT change the router mode or router type.
- Do NOT delete, rename, or modify any existing page or component other than src/main.jsx.
- Do NOT modify MembersPage.jsx, OnboardingPage.jsx, or site.config.js.
- Do NOT change src/index.css or tailwind.config.js.
- Do NOT "improve" the snippets below. Use them verbatim.

STEP 1 — create the file `src/CallbackPage.jsx` with EXACTLY this content:

```jsx
import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@cogability/membership-kit';

const CMG_URL = import.meta.env.VITE_CMG_URL;
const NAMESPACE = import.meta.env.VITE_SITE_NAMESPACE;

/**
 * Custom callback page that extends the kit default with an access-code
 * challenge. When CMG returns codeRequired: true the user is shown an
 * inline code-entry form instead of being bounced to Access Denied.
 *
 * Flow:
 *   1. handleCallback() completes the OIDC exchange and writes cam_token
 *      to sessionStorage (normal kit behaviour).
 *   2. We make a second POST /auth/validate to read the raw codeRequired
 *      flag — the kit's SDK strips this field before returning to callers.
 *   3a. codeRequired: true  → render inline code-entry form.
 *   3b. codeRequired: false → follow normal redirect logic (same as kit default).
 *   4. On successful POST /auth/redeem-code, CMG provisions the member.
 *      window.location.href triggers a full-page reload so AuthProvider
 *      re-bootstraps and reads isMember: true on the next visit to /members.
 */
export default function CallbackPage() {
  const { handleCallback } = useAuth();
  const calledRef = useRef(false);

  // phase: 'loading' | 'enter-code' | 'redirecting'
  const [phase, setPhase] = useState('loading');
  const [redirectTo, setRedirectTo] = useState(null);
  const [idToken, setIdToken] = useState(null);

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [codeError, setCodeError] = useState(null);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    (async () => {
      try {
        // Complete the OIDC callback — writes cam_token to sessionStorage.
        const result = await handleCallback();
        if (!result.success) {
          setRedirectTo('/');
          return;
        }

        const token = sessionStorage.getItem('cam_token');
        if (!token) {
          setRedirectTo('/');
          return;
        }

        // Second validate call to read codeRequired — not exposed by the kit SDK.
        const res = await fetch(`${CMG_URL}/auth/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: token, namespace: NAMESPACE }),
        });
        const data = await res.json();

        if (data.codeRequired === true) {
          setIdToken(token);
          setPhase('enter-code');
          return;
        }

        // Normal flow — identical to kit's default CallbackPage logic.
        const returnTo = sessionStorage.getItem('auth_return_to') || '/members';
        sessionStorage.removeItem('auth_return_to');
        setPhase('redirecting');
        setRedirectTo(
          result.autoProvisioned && !result.hasProfile ? '/onboarding' : returnTo
        );
      } catch (err) {
        console.error('CallbackPage error', err);
        setRedirectTo('/');
      }
    })();
  }, [handleCallback]);

  async function submitCode(e) {
    e?.preventDefault();
    if (!code.trim() || submitting) return;
    setSubmitting(true);
    setCodeError(null);
    try {
      const res = await fetch(`${CMG_URL}/auth/redeem-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, code: code.trim(), namespace: NAMESPACE }),
      });
      const data = await res.json();

      if (!res.ok || !data.isMember) {
        setCodeError(
          'Invalid or expired access code. Please check your code and try again.'
        );
        setSubmitting(false);
        return;
      }

      // Full navigation so AuthProvider re-bootstraps and reads isMember: true.
      window.location.href = data.autoProvisioned && !data.hasProfile
        ? '/onboarding'
        : '/members';
    } catch {
      setCodeError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  if (redirectTo) return <Navigate to={redirectTo} replace />;

  if (phase === 'enter-code') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="bg-card rounded-2xl shadow-xl border border-border p-8 sm:p-10 w-full max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-7 h-7 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-foreground mb-2">
            Enter your access code
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mb-8">
            This membership requires an access code. Enter the code you received
            to complete sign-up.
          </p>

          {codeError && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-left">
              {codeError}
            </div>
          )}

          <form onSubmit={submitCode} className="space-y-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX-XXXX"
              disabled={submitting}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="submit"
              disabled={submitting || !code.trim()}
              className="btn-primary w-full py-3.5 text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Verifying…
                </>
              ) : (
                'Activate Membership'
              )}
            </button>
          </form>

          <p className="text-xs text-muted-foreground mt-6 leading-relaxed">
            Don&apos;t have a code? Contact us to request access.
          </p>
        </div>
      </div>
    );
  }

  // Default: loading spinner shown while OIDC callback and validate calls run.
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Completing sign-in…</p>
      </div>
    </div>
  );
}
```

STEP 2 — update `src/main.jsx`. Add an import for the new component and add it to the overrides prop. The file currently looks like this:

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from '@cogability/membership-kit';
import config from '@/site.config';
import MembersPage from './MembersPage';
import OnboardingPage from './OnboardingPage';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App config={config} overrides={{ MembersPage, OnboardingPage }} />
  </StrictMode>,
);
```

Change it to EXACTLY this (add the CallbackPage import and add it to overrides — change nothing else):

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from '@cogability/membership-kit';
import config from '@/site.config';
import MembersPage from './MembersPage';
import OnboardingPage from './OnboardingPage';
import CallbackPage from './CallbackPage';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App config={config} overrides={{ MembersPage, OnboardingPage, CallbackPage }} />
  </StrictMode>,
);
```

STEP 3 — when finished, give me back a checklist:
1. Files you created (with paths).
2. Files you modified (with paths).
3. Anything you intentionally skipped or deviated from (with the reason).

End of instructions.
````

## Smoke test (run after Publish)

Open `https://babybrain.ai/` in a fresh incognito window. Use a test account that has **not** previously signed in.

| # | Action | Expected |
|---|---|---|
| 1 | Click "Become a Member" / "Sign in" | App ID login page opens |
| 2 | Sign in with a test account that has no whitelist entry | Browser navigates to `/callback`, spinner shows briefly |
| 3 | Code entry form appears | Heading "Enter your access code", monospace input, "Activate Membership" button |
| 4 | Enter an **invalid** code and click Activate | Red error: "Invalid or expired access code. Please check your code and try again." |
| 5 | Enter a **valid** minted code and click Activate | Spinner → redirects to `/onboarding` (new member) or `/members` (returning member with a code) |
| 6 | Sign in with an account that already redeemed a code | Goes straight to `/members` — no code challenge (user already has a whitelist entry) |
| 7 | Hard-refresh `/members` while signed in as a valid member | Stays on `/members` — session persists |

---

## How it works

### Why `CallbackPage` is overridden, not `AccessDenied`

The access code challenge must fire **before** the user is admitted or rejected — i.e., during the sign-in callback, not after. The kit's built-in `AccessDenied` screen is shown after membership is resolved to `false`; it has no way to know whether the rejection was due to `codeRequired` vs. a genuine non-member.

Overriding `CallbackPage` lets us intercept the flow at exactly the right point: after the OIDC tokens are exchanged but before the user is sent to `/members`.

### The double `/auth/validate` call

`handleCallback()` inside `AuthProvider` already calls `POST /auth/validate` internally. Our `CallbackPage` makes a second call to the same endpoint to read the raw `codeRequired` field — the kit's `CmgClient.validateMembership()` normalises the response and drops any fields it doesn't know about, so `codeRequired` is invisible to callers at the moment.

Two calls to `/auth/validate` on sign-in is the trade-off for zero changes to the kit package.

### Why `window.location.href` instead of `<Navigate>`

After the user redeems a code, CMG has just written the Cloudant whitelist entry. The `AuthProvider`'s in-memory state still shows `isMember: false` from the first validate call. A React Router `<Navigate>` would send the user to `/members` without resetting that state, so `RoleGate` would still show `AccessDenied`.

Using `window.location.href` triggers a full page reload. `AuthProvider`'s bootstrap `useEffect` runs from scratch, calls `auth.getUser()`, finds the idToken still in the OIDC session, and calls `validateMembership` again — this time getting `isMember: true` because the whitelist entry now exists.

---

## Iteration troubleshooting

### Code-entry form never appears (user gets "Access Denied" instead)

Two possible causes:

1. **Backend not configured.** The Cloudant role doc for the namespace does not have `requires_access_code: true`. Verify with: `node scripts/rollout-access-code-gate.js --namespace bab` in the CMG repo.
2. **Site is in hash mode.** If `VITE_ROUTER_MODE=hash` is set, the OAuth callback lands on the root URL (`/`), not `/callback`, and the kit's internal `RootOAuthLanding` handles it — the `CallbackPage` override never runs. Check the Lovable project's environment variables.

### "Invalid or expired access code" for a code you just minted

| Check | How |
|---|---|
| Code is for the right namespace | The `product_id` on the code must be `membership:bab`. Check via CU3 CMM → Access Codes → Codes tab. |
| Batch is not disabled | Batches tab → Status column must show `active`. |
| Batch quota not exhausted | Batches tab → Remaining column must be > 0 or ∞. |
| Code not already used | Codes tab → Redeemed/Max column: if `1/1` the code is spent. |
| User is on the right site | A code minted for `bab` will fail on any other namespace. |

### Lovable modified files other than `src/main.jsx`

**Recovery prompt:**

```
You modified files I did not ask you to change. Revert all changes except to src/main.jsx and src/CallbackPage.jsx. Do not touch any other file.
```

### `window is not defined` error in build

Lovable may have moved the component into a server render path. **Recovery prompt:**

```
src/CallbackPage.jsx must be a pure client component. Remove any `loader`, `beforeLoad`, `createServerFn`, or server-route wrapper you may have added. The file should export a single default React function component with no server-side code.
```

### Spinner never goes away / callback hangs

Open DevTools → Network. Look for the two `POST /auth/validate` calls to CMG.

- If the **first** call (from `handleCallback`) times out: CMG is unreachable — check `VITE_CMG_URL`.
- If the **second** call (our raw fetch) errors: likely a CORS issue — your deployed domain isn't in CMG's `ALLOWED_ORIGINS`. Contact your CogAbility developer.
