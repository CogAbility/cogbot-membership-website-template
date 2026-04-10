import { createContext, useContext, useState, useCallback, useRef } from 'react';
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
  const [geofenced, setGeofenced] = useState(false);
  const [geofenceMessage, setGeofenceMessage] = useState(null);
  const [membershipStatus, setMembershipStatus] = useState('none');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const loginInProgressRef = useRef(false);

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

  const login = useCallback(async () => {
    if (loginInProgressRef.current) return false;
    loginInProgressRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const oidcUser = await getUserManager().signinPopup();

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
      console.error('AuthProvider: login error', err);
      setError(err?.message || 'Login failed. Please try again.');
      return false;
    } finally {
      loginInProgressRef.current = false;
      setIsLoading(false);
    }
  }, [validateMembership]);

  const logout = useCallback(() => {
    sessionStorage.removeItem('cam_token');
    sessionStorage.removeItem('cam_access_token');
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
