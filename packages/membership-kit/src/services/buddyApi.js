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
 * Fetch cogbot init config (widget theme, auth settings, etc).
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
 * Fetch the welcome/greeting message from the dedicated greeting API.
 * Must be called after setAnonymousTokens() so the session cookie is set.
 * Returns { user_identifier, request_id, output: [{ response_type, text, ... }] }.
 */
export async function fetchGreeting() {
  const base = getBaseUrl();
  const userId = getUserId();

  const params = new URLSearchParams({
    host_url: window.location.href,
    language: LANGUAGE,
    rcode: Math.floor(Math.random() * 100000).toString(),
  });
  if (userId) params.set('uid', userId);
  const sid = getCogbotSid();
  if (sid) params.set('cogbot_sid', sid);

  const url = `${base}/api/v1/init/greeting/${COGBOT_ID}?${params}`;

  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`greeting failed: ${res.status}`);
  return res.json();
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

function buildMessageBody(text, userId, { anonymous = true } = {}) {
  return {
    input: [{ type: 'text', text }],
    context: { global: { system: { user_id: userId } } },
    metadata: {},
    user_id: userId,
    language: LANGUAGE,
    country: COUNTRY,
    host_url: window.location.href,
    training: false,
    channel: 'web',
    anonymous,
  };
}

function parseSseBlock(block, onEvent) {
  let eventName = 'message';
  const dataLines = [];
  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).replace(/^\s/, ''));
    }
  }
  if (dataLines.length === 0) return;
  try {
    const data = JSON.parse(dataLines.join('\n'));
    onEvent({ eventName, data });
  } catch (e) {
    console.error('BuddyChat: SSE JSON parse error', e);
  }
}

/**
 * Send a message via SSE streaming. Calls onEvent for each SSE event:
 *   - partial_object: progressive response as LLM generates tokens
 *   - object_ready: complete output from a finished cascade layer
 *   - final_response: complete MessageResponse with full context
 *
 * @param {string} text
 * @param {{ onEvent: (evt: { eventName: string, data: object }) => void, signal?: AbortSignal, anonymous?: boolean }} options
 */
export async function sendMessageStream(text, { onEvent, signal, anonymous = true } = {}) {
  const base = getBaseUrl();
  const userId = getUserId();

  let url = `${base}/api/cogbots/${COGBOT_ID}/id/${userId}/message/stream`;
  url = appendSidParam(url);
  url = cacheBust(url);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer anonymous',
      'Content-Type': 'application/json',
      Accept: 'text/event-stream, application/json;q=0.9',
    },
    body: JSON.stringify(buildMessageBody(text, userId, { anonymous })),
    credentials: 'include',
    signal,
  });

  if (!res.ok) throw new Error(`message stream failed: ${res.status}`);
  if (!res.body || typeof res.body.getReader !== 'function') {
    throw new Error('Streaming not supported in this browser');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split(/\r?\n\r?\n/);
      buffer = parts.pop() || '';
      for (const part of parts) {
        if (part.trim() && onEvent) {
          parseSseBlock(part, onEvent);
        }
      }
    }
    if (buffer.trim() && onEvent) {
      parseSseBlock(buffer, onEvent);
    }
  } catch (err) {
    if (err.name === 'AbortError') return;
    throw err;
  }
}

/**
 * Send a streaming message as an authenticated member.
 * Establishes an authenticated session first, then streams.
 */
export async function sendAuthenticatedMessageStream(text, { idToken, onEvent, signal }) {
  await setAuthenticatedTokens(idToken);
  return sendMessageStream(text, { onEvent, signal, anonymous: false });
}

/**
 * Establish an authenticated session with the widget BFF using the user's
 * real idToken. Must be called before sendAuthenticatedMessage.
 * Returns { uid, cogbot_sid? }.
 */
export async function setAuthenticatedTokens(idToken) {
  const base = getBaseUrl();
  let url = `${base}/api/settokens`;
  url = appendSidParam(url);
  url = cacheBust(url);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ tokens: { idToken } }),
    credentials: 'include',
  });

  if (!res.ok) throw new Error(`settokens failed: ${res.status}`);
  const data = await res.json();

  if (data.uid) sessionStorage.setItem('buddy_user_id', data.uid);
  if (data.cogbot_sid) setCogbotSid(data.cogbot_sid);

  return data;
}

/**
 * Send a message as an authenticated member. Used during onboarding to
 * persist user/baby profile to Pinecone via the agent's save_memory tool.
 * Calls settokens first to establish an authenticated widget BFF session.
 */
export async function sendAuthenticatedMessage(text, { idToken }) {
  await setAuthenticatedTokens(idToken);

  const base = getBaseUrl();
  const uid = getUserId();

  let url = `${base}/api/cogbots/${COGBOT_ID}/id/${uid}/message`;
  url = appendSidParam(url);
  url = cacheBust(url);

  const body = {
    input: [{ type: 'text', text }],
    context: { global: { system: { user_id: uid } } },
    metadata: {},
    user_id: uid,
    language: LANGUAGE,
    country: COUNTRY,
    host_url: window.location.href,
    training: false,
    channel: 'web',
    anonymous: false,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
    credentials: 'include',
  });

  if (!res.ok) throw new Error(`authenticated message failed: ${res.status}`);
  return res.json();
}

/**
 * Compose a natural-language onboarding message from collected profile data.
 * The be-pfc agent's save_memory tool will parse this and store it in Pinecone.
 *
 * @param {{ firstName: string, lastName: string }} parentInfo
 * @param {Array<{ name: string, gender: string, birthMonth: string, birthDay: string, birthYear: string }>} children
 */
export function buildOnboardingMessage(parentInfo, children) {
  const nameParts = [parentInfo.firstName, parentInfo.lastName].filter(Boolean);
  const fullName = nameParts.join(' ');

  const childDescriptions = children.map((child) => {
    const parts = [`a child named ${child.name}`];
    if (child.gender) parts.push(`(${child.gender})`);
    const hasBirthday = child.birthMonth && child.birthDay && child.birthYear;
    if (hasBirthday) {
      parts.push(`born ${child.birthMonth} ${child.birthDay} ${child.birthYear}`);
    }
    return parts.join(' ');
  });

  const lines = [];
  if (fullName) lines.push(`My name is ${fullName}.`);
  if (childDescriptions.length === 1) {
    lines.push(`I have ${childDescriptions[0]}.`);
  } else if (childDescriptions.length > 1) {
    lines.push(`I have ${childDescriptions.length} children: ${childDescriptions.join(', ')}.`);
  }
  lines.push('Please save this to my profile.');
  return lines.join(' ');
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
