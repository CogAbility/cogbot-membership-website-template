import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthProvider';

const CMG_API = import.meta.env.VITE_CMG_API || '';
const NAMESPACE = import.meta.env.VITE_CMG_NAMESPACE || 'bab';

/**
 * Validates the current user against the CMG (CogBot Membership Gateway)
 * and returns their membership status and roles.
 *
 * Returns:
 *   isValidating    - true while the CMG call is in flight
 *   validationError - string | null
 *   isMember        - boolean
 *   roles           - { namespace, name, display_name }[]
 *   hasRole(r)      - boolean helper
 */
export function useAuthorization() {
  const { user, isAuthenticated } = useAuth();
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [roles, setRoles] = useState([]);
  const [geofenced, setGeofenced] = useState(false);
  const [geofenceMessage, setGeofenceMessage] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setRoles([]);
      setIsMember(false);
      setGeofenced(false);
      setGeofenceMessage(null);
      setValidationError(null);
      return;
    }

    let cancelled = false;

    const validate = async () => {
      setIsValidating(true);
      setValidationError(null);

      try {
        const idToken = sessionStorage.getItem('cam_token') || '';

        const res = await fetch(`${CMG_API}/auth/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken, namespace: NAMESPACE }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Membership check failed (${res.status})`);
        }

        const data = await res.json();

        if (!cancelled) {
          setIsMember(data.isMember);
          setRoles(data.roles || []);
          setGeofenced(data.geofenced === true);
          setGeofenceMessage(data.geofenceMessage || null);

          if (!data.isMember) {
            setValidationError(
              data.geofenced
                ? (data.geofenceMessage || 'This service is not available in your area.')
                : 'Your account is not authorized for this site. Please contact an administrator.'
            );
          }
        }
      } catch (err) {
        console.error('useAuthorization: error', err);
        if (!cancelled) {
          setValidationError(err.message || 'Authorization check failed.');
        }
      } finally {
        if (!cancelled) setIsValidating(false);
      }
    };

    validate();
    return () => { cancelled = true; };
  }, [isAuthenticated, user]);

  const hasRole = useCallback(
    (role) => roles.some((r) => r.name === role || `${r.namespace}:${r.name}` === role),
    [roles]
  );

  return { isValidating, validationError, isMember, roles, hasRole, geofenced, geofenceMessage };
}
