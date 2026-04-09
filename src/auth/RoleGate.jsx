import { useAuthorization } from './useAuthorization';
import AccessDenied from '../pages/AccessDenied';

/**
 * Renders children only when the authenticated user passes CMG validation
 * and (optionally) holds a specific role.
 *
 * @param {string}    [requiredRole] - e.g. "member" or "bab:member"
 * @param {ReactNode} children
 */
export default function RoleGate({ requiredRole, children }) {
  const { hasRole, isMember, isValidating, validationError } = useAuthorization();

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Checking your access...</p>
        </div>
      </div>
    );
  }

  if (validationError || !isMember) {
    return <AccessDenied reason={validationError || 'You are not a member of this site.'} />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <AccessDenied reason={`You need the "${requiredRole}" role to access this area.`} />;
  }

  return children;
}
