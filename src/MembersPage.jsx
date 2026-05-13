import { useEffect, useState } from 'react';
import { useAuth, MembersPage as DefaultMembersPage } from '@cogability/membership-kit';

/**
 * Thin wrapper around DefaultMembersPage that gates <CogBotEmbed> (and the
 * entire members UI) until AuthProvider's async bootstrap has completed and
 * written cam_token to sessionStorage.
 *
 * Race: on a hard-reload to /members while signed in, useBuddyChat's
 * initialize() reads sessionStorage.cam_token synchronously on mount.
 * AuthProvider writes that key inside its async auth.getUser() bootstrap
 * useEffect. Without this gate, the hook can mount before the write, finds
 * cam_token === null, calls initAnonymous(), and the backend receives
 * anonymous: true — blocking profile injection in be-pfc.
 *
 * Fix: don't mount DefaultMembersPage (and therefore CogBotEmbed/useBuddyChat)
 * until user?.idToken is non-null, which only happens after AuthProvider has
 * both called setUser({…, idToken, …}) AND written cam_token to sessionStorage
 * (the two lines are synchronous and back-to-back in the bootstrap effect).
 *
 * Safety timeout: if auth bootstrap never resolves within 10 s (e.g. a
 * network hiccup prevents CMG validation), we fall through to DefaultMembersPage
 * anyway so the UI is never permanently stuck. ProtectedRoute + RoleGate
 * still guard the route, so an unauthenticated user will never reach here.
 */
export default function MembersPage() {
  const { user } = useAuth();
  const idToken = user?.idToken;
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (idToken) return;
    const t = setTimeout(() => setTimedOut(true), 10_000);
    return () => clearTimeout(t);
  }, [idToken]);

  if (!idToken && !timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  return <DefaultMembersPage />;
}
