import { UserManager } from 'oidc-client-ts';

const CMG_URL = import.meta.env.VITE_CMG_URL || 'http://localhost:3010';

let manager;

export function getUserManager() {
  if (!manager) {
    const authority = import.meta.env.VITE_APPID_OAUTH_SERVER_URL;

    manager = new UserManager({
      authority,
      client_id: import.meta.env.VITE_APPID_CLIENT_ID,
      redirect_uri: `${window.location.origin}/callback`,
      response_type: 'code',
      scope: 'openid profile email',
      // App ID's token endpoint doesn't support CORS from browser origins,
      // so we proxy the token exchange through CMG (server-to-server).
      metadata: {
        issuer: authority,
        authorization_endpoint: `${authority}/authorization`,
        token_endpoint: `${CMG_URL}/auth/token`,
        userinfo_endpoint: `${authority}/userinfo`,
        jwks_uri: `${authority}/publickeys`,
      },
    });
  }
  return manager;
}
