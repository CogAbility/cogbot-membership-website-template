import { createContext, useContext, useState, useCallback } from 'react';
import { getUserManager } from './userManager';

/**
 * AuthContext provides:
 *   user             - App ID user info (null when not logged in)
 *   isAuthenticated  - boolean
 *   isMember         - boolean, true only when CMG confirmed namespace membership
 *   roles            - array of { namespace, name, display_name }
 *   autoProvisioned  - boolean, true when CMG auto-created the membership on this login
 *   membershipStatus - "none" | "checking" | "member" | "not_member" | "error"
 *   isLoading        - boolean (true during login/logout)
 *   error            - string | null
 *   login(returnTo)  - redirects to App ID for authentication
 *   handleCallback() - processes the redirect callback, returns true on success
 *   logout()         - clears session
 */
const AuthContext = createContext(null);

const CMG_URL = import.meta.env.VITE_CMG_URL || 'http://localhost:3010';
const SITE_NAMESPACE = import.meta.env.VITE_SITE_NAMESPACE || 'bab';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [autoProvisioned, setAutoProvisioned] = useState(false);
  const [roles, setRoles] = useState([]);
  const [geofenced, setGeofenced] = useState(false);
  const [geofenceMessage, setGeofenceMessage] = useState(null);
  const [membershipStatus, setMembershipStatus] = useState('none');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateMembership = useCallback(async (idToken) => {
    setMembershipStatus('checking');
    try {
      const res = await fetch(`${CMG_URL}/auth/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, namespace: SITE_NAMESPACE }),
      });
      if (!res.ok) throw new Error(`CMG responded ${res.status}`);
      const data = await res.json();
      setIsMember(data.isMember === true);
      setAutoProvisioned(data.autoProvisioned === true);
      setRoles(data.roles || []);
      setGeofenced(data.geofenced === true);
      setGeofenceMessage(data.geofenceMessage || null);
      setMembershipStatus(data.isMember ? 'member' : 'not_member');
    } catch (err) {
      console.error('AuthProvider: membership validation error', err);
      setIsMember(false);
      setAutoProvisioned(false);
      setRoles([]);
      setGeofenced(false);
      setGeofenceMessage(null);
      setMembershipStatus('error');
    }
  }, []);

  const login = useCallback(async (returnTo = '/members') => {
    sessionStorage.setItem('auth_return_to', returnTo);
    await getUserManager().signinRedirect();
  }, []);

  const handleCallback = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('handleCallback: starting signinRedirectCallback');
      const oidcUser = await getUserManager().signinRedirectCallback();
      console.log('handleCallback: got user', oidcUser?.profile?.email);

      sessionStorage.setItem('cam_token', oidcUser.id_token);
      sessionStorage.setItem('cam_access_token', oidcUser.access_token);

      const p = oidcUser.profile;
      setUser({
        uid: p.sub,
        email: p.email || '',
        firstName: p.given_name || p.name?.split(' ')[0] || '',
        lastName: p.family_name || p.name?.split(' ').slice(1).join(' ') || '',
        idToken: oidcUser.id_token,
        accessToken: oidcUser.access_token,
        raw: p,
      });

      await validateMembership(oidcUser.id_token);
      return true;
    } catch (err) {
      console.error('AuthProvider: callback error', err);
      setError(err?.message || 'Login failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [validateMembership]);

  const logout = useCallback(() => {
    sessionStorage.removeItem('cam_token');
    sessionStorage.removeItem('cam_access_token');
    sessionStorage.removeItem('auth_return_to');
    setUser(null);
    setIsMember(false);
    setAutoProvisioned(false);
    setRoles([]);
    setGeofenced(false);
    setGeofenceMessage(null);
    setMembershipStatus('none');
    setError(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isMember,
      autoProvisioned,
      roles,
      geofenced,
      geofenceMessage,
      membershipStatus,
      isLoading,
      error,
      login,
      handleCallback,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
