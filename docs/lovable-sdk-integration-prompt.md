# CogBot SDK integration prompt for Lovable

> **Audience.** A non-technical Lovable customer who already has a working membership-style site at `https://<slug>.lovable.app/` and wants to add CogBot chat + IBM App ID sign-in.
>
> **What this is.** A single message you paste into Lovable's chat. Lovable's AI does all the file edits and dependency installs. Validated end-to-end on April 27, 2026 against a TanStack Start project.

## Before you paste

1. **Get six configuration values** from your CogAbility contact:
   - `APPID_OAUTH_SERVER_URL`
   - `APPID_CLIENT_ID`
   - `CAM_HOST`
   - `CMG_HOST`
   - `COGBOT_ID`
   - `SITE_NAMESPACE`
2. **Confirm CogAbility ops has run the per-customer onboarding** for your site URL (this allowlists your origin in CAM CORS, CMG, App ID, and the cogbot's host config). One command on their end — see [`tools/provision-lovable-customer.sh`](../tools/provision-lovable-customer.sh). Without this, you'll see a working chat input that responds with empty messages, and sign-in will fail with `redirect_uri_mismatch`.
3. **Replace the six placeholders** in the prompt below with your actual values before pasting.
4. **Open Lovable chat** at your project (`https://<slug>.lovable.app`) and paste the entire fenced block as a single message. Do not break it into multiple messages.

## What you should see after Lovable finishes

Lovable's AI will report back with a checklist of files created and modified. The expected list:

- **Created:** `src/lib/cogability.ts`, `src/routes/callback.tsx`, `src/routes/access-denied.tsx`, `src/components/SignInButton.tsx`, `src/components/MemberGate.tsx`, `src/components/CogBotChat.tsx`, `src/types/cogability-sdk.d.ts` (Lovable adds this on its own initiative — accept it).
- **Modified:** `src/routes/auth.tsx` (replaced with App ID redirect), `src/routes/members.tsx` (wrapped in `MemberGate`), `src/routes/index.tsx` (added chat below hero), `package.json` + `bun.lockb` (added `@cogability/sdk` and `oidc-client-ts`).

If anything other than that happens, see [Iteration troubleshooting](#iteration-troubleshooting) at the bottom.

After Lovable confirms, click **Publish** in the top-right. Once it says "up to date", run the smoke test below.

## The prompt to paste

````
INSTRUCTIONS FOR LOVABLE AI — read fully before doing anything.

I want to add CogAbility CogBot membership integration to this site. Do exactly what is below, no more and no less. After the changes, summarise what you did — do not ask me to confirm beforehand.

Hard rules (do not violate any of these):
- Do NOT install any npm packages other than the two listed in STEP 1.
- Do NOT add `@cogability/membership-kit` — that is a different package and is not used here.
- Do NOT move any SDK call into a server function, route loader, `beforeLoad`, or any server-side code path. All SDK code runs in the browser.
- Do NOT wrap SDK calls in TanStack Query, SWR, or any other data-fetching library. Keep the plain async/await calls shown below.
- Do NOT change my Tailwind config.
- Do NOT change my router from TanStack Router to anything else.
- Do NOT delete or rename any of my existing pages or components.
- Do NOT "improve" the snippets below. Use them verbatim.

STEP 1 — install dependencies.

Run:
  npm install @cogability/sdk oidc-client-ts

(If my project uses bun, use `bun add @cogability/sdk oidc-client-ts` instead. Same two packages, same versions.)

STEP 2 — create file `src/lib/cogability.ts` with EXACTLY this content. Substitute the six configuration values from above:

```ts
import { AuthClient, BrowserSessionStore, CamClient, CmgClient } from "@cogability/sdk";

const APPID_OAUTH_SERVER_URL = "https://us-south.appid.cloud.ibm.com/oauth/v4/REPLACE_TENANT";
const APPID_CLIENT_ID        = "REPLACE_CLIENT_ID";
const CAM_HOST               = "https://REPLACE_CAM_HOST";
const CMG_HOST               = "https://REPLACE_CMG_HOST";
const COGBOT_ID              = "REPLACE_COGBOT_ID";
const SITE_NAMESPACE         = "REPLACE_NAMESPACE";

export const cam = new CamClient({
  host: CAM_HOST,
  cogbotId: COGBOT_ID,
  sessionStore: new BrowserSessionStore(),
});

export const cmg = new CmgClient({
  host: CMG_HOST,
  namespace: SITE_NAMESPACE,
});

export const auth = new AuthClient({
  authorityUrl: APPID_OAUTH_SERVER_URL,
  clientId: APPID_CLIENT_ID,
  redirectUri: typeof window !== "undefined" ? `${window.location.origin}/callback` : "",
  // Routes the OIDC token exchange through the CMG proxy because App ID's token
  // endpoint does not allow CORS from browser origins. Do not change this line.
  tokenEndpointProxy: `${CMG_HOST}/auth/token`,
});

export { CamClient } from "@cogability/sdk";
```

STEP 3 — create file `src/routes/callback.tsx` with EXACTLY this content:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { auth, cmg } from "@/lib/cogability";

export const Route = createFileRoute("/callback")({
  component: CallbackPage,
});

function CallbackPage() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { idToken } = await auth.handleCallback();
        if (cancelled) return;
        const m = await cmg.validateMembership(idToken);
        if (cancelled) return;
        const fallback = m.isMember ? "/members" : "/access-denied";
        const next = sessionStorage.getItem("auth_return_to") || fallback;
        sessionStorage.removeItem("auth_return_to");
        // Full navigation so every component remounts and re-reads the new auth state.
        window.location.href = m.isMember ? next : "/access-denied";
      } catch (err) {
        console.error("OIDC callback failed", err);
        window.location.href = "/";
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ padding: 32, textAlign: "center" }}>
      Signing you in...
    </div>
  );
}
```

This component must run only in the browser. Do not convert it to a server route. Do not call `auth.handleCallback()` from anywhere except this component.

STEP 4 — create file `src/components/SignInButton.tsx` with EXACTLY this content:

```tsx
import { auth } from "@/lib/cogability";

export function SignInButton({ returnTo = "/members", className, children }: { returnTo?: string; className?: string; children?: React.ReactNode }) {
  return (
    <button className={className} onClick={() => auth.login(returnTo)}>
      {children ?? "Sign in"}
    </button>
  );
}
```

This component is used by the `MemberGate` fallback in STEP 5. Do NOT add it to the header or any other place — the existing header sign-in link points at `/auth`, which is rewired in STEP 4b. Do not import `auth` from `@/lib/cogability` anywhere else for sign-in — always go through this component or the `/auth` route.

STEP 4b — override the existing `/auth` route. My project already has a `src/routes/auth.tsx` that Lovable scaffolded with a sign-in/sign-up form. Replace its entire contents with EXACTLY this:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { auth } from "@/lib/cogability";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  useEffect(() => {
    auth.login("/members");
  }, []);

  return (
    <div style={{ padding: 32, textAlign: "center" }}>
      Redirecting to sign in...
    </div>
  );
}
```

Why: anywhere on the site that currently links to `/auth` (the "Sign in" link in the header, the "Join the community" button on the landing page, etc.) will continue to work — the user lands on `/auth` and is immediately redirected to App ID. We do not want the email/password form Lovable originally generated.

STEP 5 — create file `src/components/MemberGate.tsx` with EXACTLY this content:

```tsx
import { useEffect, useState, type ReactNode } from "react";
import { auth, cmg } from "@/lib/cogability";
import { SignInButton } from "@/components/SignInButton";

type State =
  | { status: "loading" }
  | { status: "denied"; reason: "no_token" | "not_member" | "error" }
  | { status: "ok"; idToken: string };

export function MemberGate({ children }: { children: (idToken: string) => ReactNode }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const idToken = await auth.getIdToken();
      if (cancelled) return;
      if (!idToken) return setState({ status: "denied", reason: "no_token" });
      try {
        const m = await cmg.validateMembership(idToken);
        if (cancelled) return;
        if (!m.isMember) return setState({ status: "denied", reason: "not_member" });
        setState({ status: "ok", idToken });
      } catch {
        if (!cancelled) setState({ status: "denied", reason: "error" });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (state.status === "loading") return <div style={{ padding: 32 }}>Checking membership...</div>;
  if (state.status === "denied") {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <h2>Members only</h2>
        <p>You need to sign in as a member to view this page.</p>
        <SignInButton returnTo="/members">Sign in</SignInButton>
      </div>
    );
  }
  return <>{children(state.idToken)}</>;
}
```

STEP 6 — create file `src/components/CogBotChat.tsx` with EXACTLY this content:

```tsx
import { useEffect, useRef, useState } from "react";
import { cam, CamClient } from "@/lib/cogability";

type Msg = { role: "user" | "bot"; text: string };

export function CogBotChat({ idToken }: { idToken?: string }) {
  const [ready, setReady] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    (async () => {
      if (idToken) await cam.initAuthenticated(idToken);
      else await cam.initAnonymous();
      await cam.initCogbot();
      // Greeting endpoint returns { output: Generic[] } — array is at .output directly,
      // NOT at .output.generic. Do not use parseResponseGeneric here.
      const greeting = await cam.fetchGreeting();
      const greetParts = ((greeting as any).output || [])
        .filter((g: any) => g.response_type === "text" && g.text);
      if (greetParts[0]) setMessages([{ role: "bot", text: greetParts[0].text }]);
      setReady(true);
    })();
  }, [idToken]);

  async function send() {
    if (!input.trim() || !ready) return;
    const text = input;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }, { role: "bot", text: "" }]);
    // Stream events: partial_object delivers progressive tokens, final_response
    // delivers the committed assistant message. We must handle both — the final
    // text can arrive only in final_response if streaming is fast or disabled.
    for await (const ev of cam.streamMessage(text, { anonymous: !idToken })) {
      if (ev.eventName === "partial_object" || ev.eventName === "final_response") {
        const parts = (CamClient.parseResponseGeneric(ev.data) as any[])
          .filter((g) => g.response_type === "text" && g.text);
        if (parts[0]) {
          setMessages((m) => [
            ...m.slice(0, -1),
            { role: "bot", text: parts[0].text },
          ]);
        }
      }
    }
  }

  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 12, maxWidth: 600 }}>
      <div style={{ minHeight: 200, marginBottom: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <strong>{m.role === "user" ? "You" : "Bot"}:</strong> {m.text}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={!ready}
          style={{ flex: 1, padding: 8 }}
          placeholder={ready ? "Type a message..." : "Loading..."}
        />
        <button onClick={send} disabled={!ready}>Send</button>
      </div>
    </div>
  );
}
```

STEP 7 — wire the components into my existing pages.

7a. In my landing page (e.g. `src/routes/index.tsx`), import `CogBotChat` from `@/components/CogBotChat` and place it somewhere visible (below the hero is fine). Do not pass an `idToken` prop — anonymous visitors should be able to chat.

7b. Existing buttons/links that point to `/auth` (e.g. the "Sign in" link in the header, the "Join the community" button on the landing page) — leave them alone. The `/auth` override from STEP 4b takes care of redirecting to App ID. Do NOT replace these links with `SignInButton` and do NOT delete the `/auth` route.

7c. Update `src/routes/members.tsx` so its existing content is wrapped in `MemberGate`. Inside the gate, render `<CogBotChat idToken={idToken} />` (the gate provides `idToken` to its children via render prop). Keep any existing members content I have.

Example shape for `src/routes/members.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { MemberGate } from "@/components/MemberGate";
import { CogBotChat } from "@/components/CogBotChat";

export const Route = createFileRoute("/members")({
  component: MembersPage,
});

function MembersPage() {
  return (
    <div style={{ padding: 32 }}>
      <h1>Members area</h1>
      <MemberGate>
        {(idToken) => <CogBotChat idToken={idToken} />}
      </MemberGate>
    </div>
  );
}
```

STEP 8 — create file `src/routes/access-denied.tsx` with EXACTLY this content:

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/access-denied")({
  component: AccessDeniedPage,
});

function AccessDeniedPage() {
  return (
    <div style={{ padding: 32 }}>
      <h1>Access denied</h1>
      <p>Your account is signed in but is not a member of this site.</p>
      <p>Contact the site owner to request membership.</p>
    </div>
  );
}
```

STEP 9 — when finished, give me back a checklist:
1. Files you created (with paths).
2. Files you modified (with paths).
3. Anything you intentionally skipped or deviated from (with the reason).

End of instructions.
````

## Smoke test (run after Publish)

Open `https://<slug>.lovable.app/` in a fresh incognito window. Then verify each step:

| # | Action | Expected |
|---|---|---|
| 1 | Page loads | Header, hero, and chat widget render. (A "React error #419" hydration warning in DevTools is benign — TanStack Start re-hydrates client-side.) |
| 2 | Type a message in the chat below the hero, click Send | Bot responds within ~3s. (Greeting may be empty — that's a separate cogbot config setting; chat itself works.) |
| 3 | Click "Sign in" in the header | Browser navigates to App ID login page (CogUniversity branding) |
| 4 | Sign in with Google | Land back at `/members` after a brief `/callback` flash, with an authenticated chat |
| 5 | Hard refresh `/members` | Stay on `/members` — session persists |
| 6 | Open `/members` directly in a different incognito window | "Members only" panel with a Sign in button |
| 7 | Open `/access-denied` directly | Renders the access-denied copy |

If any step fails, see [Iteration troubleshooting](#iteration-troubleshooting).

## Iteration troubleshooting

### Lovable installed extra packages

You'll see additions in `package.json` other than `@cogability/sdk` and `oidc-client-ts`. **Recovery prompt:**

```
You added packages I did not ask for. Uninstall everything except @cogability/sdk and oidc-client-ts. Do not change any other file.
```

### Lovable moved an SDK call into a server function or loader

Symptoms: `window is not defined` in the browser console, or callback never finalises. **Recovery prompt:**

```
You moved SDK calls into a server-side path. Move them all back into client components. Specifically: src/routes/callback.tsx, src/routes/auth.tsx, src/components/MemberGate.tsx, and src/components/CogBotChat.tsx must each be plain client components with no `loader`, no `beforeLoad`, no `createServerFn`, no server route.
```

### Lovable replaced the `/auth` route's redirect with the original email/password form

Symptoms: Header "Sign in" link shows an email/password form instead of redirecting to App ID. **Recovery prompt:**

```
You restored the email/password form at src/routes/auth.tsx. Replace its entire contents with the redirect override I gave you in STEP 4b of the original prompt — exactly as written, no merging with the form.
```

### Bot replies are empty even though messages send

Symptoms: "You: ..." appears, "Bot:" stays empty. The CAM network calls return 200. **Cause: cogbot major config doesn't recognize your origin yet.** This is on the CogAbility ops side — they need to add your `https://<slug>.lovable.app` origin to the cogbot's host config. Contact your CogAbility contact and reference [`tools/provision-lovable-customer.sh`](../tools/provision-lovable-customer.sh).

### Sign-in lands on App ID's `redirect_uri_mismatch` error

**Cause: App ID's web redirect URLs allowlist doesn't include your origin yet.** Same fix as above — CogAbility ops needs to add `https://<slug>.lovable.app/callback` to the App ID app's redirect URLs.

### TypeScript build fails with "Could not find a declaration file for '@cogability/sdk'"

Lovable should add `src/types/cogability-sdk.d.ts` automatically. If it didn't, **recovery prompt:**

```
Create file src/types/cogability-sdk.d.ts with EXACTLY this content:

  declare module "@cogability/sdk";

This is a type-only shim. Do not install any package.
```

### Lovable installed Supabase or any other auth library

Symptoms: `@supabase/*` or `next-auth` or similar in `package.json`. **Recovery prompt:**

```
You added an auth library I did not ask for. Uninstall it. The only auth in this project is via @cogability/sdk's AuthClient — that is the App ID OIDC flow. Do not replace it with anything else.
```

## What this prompt does NOT do

It deliberately leaves out features you may want later, to keep the integration small and reviewable:

- **No onboarding flow.** New members go straight to `/members` with no profile-collection step. Add later via Lovable chat: "When a new member first lands on /members, redirect them to /onboarding which collects their name and email and saves to the cogbot via cam.streamMessage(CamClient.buildOnboardingMessage(...))."
- **No geofencing.** The landing page renders unconditionally. To add geofencing: "Add a geofence check on the landing page using `cmg.checkGeofence()`. If `geofenced: true`, replace the page contents with a polite block message."
- **No streaming animation.** The chat updates the bot message in chunks but doesn't show a live cursor. Add later: "Add a typing indicator (three animated dots) to the bot's last message while it's empty."
- **No styled chat widget.** The chat uses inline styles — match it to your site's Tailwind theme later.
- **No member profile page.** Add via Lovable chat once you know what fields you want.

These are intentionally manual follow-ups so customers can layer their preferences on top of a known-working baseline.
