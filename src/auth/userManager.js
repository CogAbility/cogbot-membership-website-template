import { UserManager } from 'oidc-client-ts';

let manager;

export function getUserManager() {
  if (!manager) {
    manager = new UserManager({
      authority: import.meta.env.VITE_APPID_OAUTH_SERVER_URL,
      client_id: import.meta.env.VITE_APPID_CLIENT_ID,
      redirect_uri: `${window.location.origin}/callback`,
      popup_redirect_uri: `${window.location.origin}/callback`,
      response_type: 'code',
      scope: 'openid profile email',
    });
  }
  return manager;
}
