const COGBOT_ID = import.meta.env.VITE_COGBOT_ID || 'mc_0091:full';
const LANGUAGE = 'en-US';
const COUNTRY = 'US';

function getBaseUrl() {
  if (import.meta.env.DEV) return '/cogbot-api';
  return import.meta.env.VITE_COGBOT_HOST || '';
}

function getUserId() {
  let uid = sessionStorage.getItem('buddy_user_id');
  if (!uid) {
    uid = crypto.randomUUID();
    sessionStorage.setItem('buddy_user_id', uid);
  }
  return uid;
}

function getCogbotSid() {
  return sessionStorage.getItem('buddy_cogbot_sid') || '';
}

function setCogbotSid(sid) {
  if (sid) {
    sessionStorage.setItem('buddy_cogbot_sid', sid);
  }
}

function appendSidParam(url) {
  const sid = getCogbotSid();
  if (!sid) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}cogbot_sid=${encodeURIComponent(sid)}`;
}

function cacheBust(url) {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}rcode=${Math.floor(Math.random() * 100000)}`;
}

/**
 * Establish an anonymous session with the widget BFF.
 * Returns { uid, cogbot_sid? }.
 */
export async function setAnonymousTokens() {
  const base = getBaseUrl();
  let url = `${base}/api/settokens`;
  url = appendSidParam(url);
  url = cacheBust(url);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ tokens: { idToken: 'anonymous' } }),
    credentials: 'include',
  });

  if (!res.ok) throw new Error(`settokens failed: ${res.status}`);
  const data = await res.json();

  if (data.uid) sessionStorage.setItem('buddy_user_id', data.uid);
  if (data.cogbot_sid) setCogbotSid(data.cogbot_sid);

  return data;
}

/**
 * Fetch cogbot init config (greeting, theme, etc).
 */
export async function initCogbot() {
  const base = getBaseUrl();
  let url = `${base}/api/init/cogbots/${COGBOT_ID}?language=${LANGUAGE}`;
  url = appendSidParam(url);
  url = cacheBust(url);

  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`init failed: ${res.status}`);
  const data = await res.json();

  if (data.cogbot_sid) setCogbotSid(data.cogbot_sid);
  return data;
}

/**
 * Send a message and return the assistant response.
 * Mirrors the payload format from the widget's message.js.
 */
export async function sendMessage(text) {
  const base = getBaseUrl();
  const userId = getUserId();

  let url = `${base}/api/cogbots/${COGBOT_ID}/id/${userId}/message`;
  url = appendSidParam(url);
  url = cacheBust(url);

  const body = {
    input: [{ type: 'text', text }],
    context: { global: { system: { user_id: userId } } },
    metadata: {},
    user_id: userId,
    language: LANGUAGE,
    country: COUNTRY,
    host_url: window.location.href,
    training: false,
    channel: 'web',
    anonymous: true,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer anonymous',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
    credentials: 'include',
  });

  if (!res.ok) throw new Error(`message failed: ${res.status}`);
  return res.json();
}

/**
 * Extract displayable text from a CCA2/Watson-style response.
 * Returns an array of { type, text, ... } items.
 */
export function parseResponseGeneric(response) {
  const generic = response?.output?.generic;
  if (!Array.isArray(generic)) return [];
  return generic;
}
