import { createContext, useContext, useState, useCallback, useRef } from 'react';
import AppID from 'ibmcloud-appid-js';

/**
 * AuthContext provides:
 *   user         - App ID user info (null when not logged in)
 *   isAuthenticated - boolean
 *   isLoading    - boolean (true during login/logout)
 *   error        - string | null
 *   login()      - initiates App ID popup signin
 *   logout()     - clears session
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const appIdRef = useRef(null);

  const getAppId = useCallback(() => {
    if (!appIdRef.current) {
      appIdRef.current = new AppID();
    }
    return appIdRef.current;
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

      // Store the identity token for API calls
      if (tokens.idToken) {
        sessionStorage.setItem('cam_token', tokens.idToken);
        sessionStorage.setItem('cam_access_token', tokens.accessToken);
      }

      // Decode the ID token payload to get basic user info
      const payload = parseJwt(tokens.idToken);
      setUser({
        uid: payload.sub,
        email: payload.email || payload['email'],
        firstName: payload.given_name || payload.name?.split(' ')[0] || '',
        lastName: payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '',
        idToken: tokens.idToken,
        accessToken: tokens.accessToken,
        raw: payload,
      });
    } catch (err) {
      console.error('AuthProvider: login error', err);
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [getAppId]);

  const logout = useCallback(() => {
    sessionStorage.removeItem('cam_token');
    sessionStorage.removeItem('cam_access_token');
    setUser(null);
    setError(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, error, login, logout }}>
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
