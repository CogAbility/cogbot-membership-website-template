/**
 * getUserManager — backward-compatible export for code that accesses the
 * underlying oidc-client-ts UserManager directly.
 *
 * AuthProvider now manages OIDC via @cogability/sdk AuthClient, so this module
 * delegates to AuthClient and exposes its internal UserManager instance.
 * Prefer using useAuth() / AuthProvider in React code.
 */

import { createAuthClientFromEnv } from '@cogability/sdk';

const CMG_URL = import.meta.env.VITE_CMG_URL || 'http://localhost:3010';

let _authClient;

function getAuthClient() {
  if (!_authClient) _authClient = createAuthClientFromEnv(CMG_URL);
  return _authClient;
}

/**
 * Returns the oidc-client-ts UserManager configured for this site.
 * @returns {Promise<import('oidc-client-ts').UserManager>}
 */
export async function getUserManager() {
  return getAuthClient()._getManager();
}
