import { createContext, useContext, useState, useCallback, useRef } from 'react';
import AppID from 'ibmcloud-appid-js';

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
 *   login()          - initiates App ID popup signin then validates membership
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
  const [membershipStatus, setMembershipStatus] = useState('none');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const appIdRef = useRef(null);

  const getAppId = useCallback(() => {
    if (!appIdRef.current) {
      appIdRef.current = new AppID();
    }
    return appIdRef.current;
  }, []);

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
      setMembershipStatus(data.isMember ? 'member' : 'not_member');
    } catch (err) {
      console.error('AuthProvider: membership validation error', err);
      setIsMember(false);
      setAutoProvisioned(false);
      setRoles([]);
      setMembershipStatus('error');
    }
  }, []);

  const login = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const appId = getAppId();
      await appId.init({
        clientId: import.meta.env.VITE_APPID_CLIENT_ID,
        discoveryEndpoint: import.meta.env.VITE_APPID_DISCOVERY_ENDPOINT,
      });
      const tokens = await appId.signin();

      if (tokens.idToken) {
        sessionStorage.setItem('cam_token', tokens.idToken);
        sessionStorage.setItem('cam_access_token', tokens.accessToken);
      }

      const payload = parseJwt(tokens.idToken);
      setUser({
        uid: payload.sub,
        email: payload.email || '',
        firstName: payload.given_name || payload.name?.split(' ')[0] || '',
        lastName: payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '',
        idToken: tokens.idToken,
        accessToken: tokens.accessToken,
        raw: payload,
      });

      // Validate membership against CMG immediately after login
      await validateMembership(tokens.idToken);
    } catch (err) {
      console.error('AuthProvider: login error', err);
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [getAppId, validateMembership]);

  const logout = useCallback(() => {
    sessionStorage.removeItem('cam_token');
    sessionStorage.removeItem('cam_access_token');
    setUser(null);
    setIsMember(false);
    setAutoProvisioned(false);
    setRoles([]);
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
      membershipStatus,
      isLoading,
      error,
      login,
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

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}
