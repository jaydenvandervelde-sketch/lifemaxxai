// Shared helpers for the WHOOP OAuth serverless functions (Vercel, Node runtime).
// Tokens are stored server-side in public.user_oauth_tokens, never sent to the browser.
const crypto = require('crypto');

const AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth';
const TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';
const API_BASE = 'https://api.prod.whoop.com/developer';
const SCOPE = 'read:recovery read:sleep read:cycles read:profile offline';
const PROVIDER = 'whoop';

function getOrigin(req) {
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return proto + '://' + host;
}
function redirectUri(req) {
  if (process.env.VERCEL_ENV === 'production') return 'https://lifemaxxai.vercel.app/api/whoop/callback';
  return getOrigin(req) + '/api/whoop/callback';
}
function isHttps(req) { return getOrigin(req).startsWith('https'); }

function parseCookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function cookie(name, val, opts) {
  opts = opts || {};
  let s = name + '=' + encodeURIComponent(val) + '; Path=/; HttpOnly; SameSite=Lax';
  if (opts.secure !== false) s += '; Secure';
  if (opts.maxAge != null) s += '; Max-Age=' + opts.maxAge;
  return s;
}
function clearCookie(name, secure) {
  return name + '=; Path=/; HttpOnly; SameSite=Lax' + (secure !== false ? '; Secure' : '') + '; Max-Age=0';
}

function creds() {
  const id = process.env.WHOOP_CLIENT_ID, secret = process.env.WHOOP_CLIENT_SECRET;
  if (!id || !secret) { const e = new Error('WHOOP_NOT_CONFIGURED'); e.code = 'WHOOP_NOT_CONFIGURED'; throw e; }
  return { id, secret };
}
async function tokenRequest(params) {
  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error('token ' + r.status + ' ' + (j.error_description || j.error || '')); e.status = r.status; throw e; }
  return j;
}

function supabaseConfig() {
  const url = (process.env.SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  return url && key ? { url, key } : null;
}
function getSupabaseAnonKey() {
  return (process.env.SUPABASE_ANON_KEY || '').trim();
}
function getBearerToken(req) {
  const auth = req.headers.authorization || req.headers.Authorization || '';
  if (typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  const cookies = parseCookies(req);
  for (const key of Object.keys(cookies)) {
    if (key === 'supabase-auth-token' || key === 'sb-access-token' || key === 'sb-portal-auth-token' || key.indexOf('sb-') === 0 && key.indexOf('-auth-token') > 0) {
      const v = cookies[key];
      if (v && v.indexOf('.') > 0) return v;
    }
  }
  return '';
}
async function getAuthenticatedUser(req) {
  const token = getBearerToken(req);
  if (!token) return null;
  const url = (process.env.SUPABASE_URL || '').trim();
  if (!url) return null;
  const anon = getSupabaseAnonKey();
  const r = await fetch(url + '/auth/v1/user', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + token,
      apikey: anon || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      Accept: 'application/json',
    },
  });
  if (!r.ok) return null;
  const body = await r.json().catch(() => null);
  if (!body || !body.id) return null;
  return { userId: body.id, accessToken: token };
}
async function requireAuth(req) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    const err = new Error('AUTH_REQUIRED');
    err.status = 401;
    throw err;
  }
  return user;
}
async function authUserTokenRow(userId, provider) {
  const cfg = supabaseConfig();
  if (!cfg) return null;
  const url = cfg.url + '/rest/v1/user_oauth_tokens?user_id=eq.' + encodeURIComponent(userId) + '&provider=eq.' + encodeURIComponent(provider) + '&select=*';
  const r = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: cfg.key,
      Authorization: 'Bearer ' + cfg.key,
      Accept: 'application/json',
    },
  });
  if (!r.ok) return null;
  const rows = await r.json().catch(() => []);
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}
async function upsertUserTokenRow(userId, provider, tokens) {
  const cfg = supabaseConfig();
  if (!cfg) return null;
  const expiresAt = tokens.expires_in ? new Date(Date.now() + Number(tokens.expires_in) * 1000).toISOString() : null;
  const payload = {
    user_id: userId,
    provider,
    access_token: tokens.access_token || null,
    refresh_token: tokens.refresh_token || null,
    token_type: tokens.token_type || null,
    scope: tokens.scope || null,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  };
  const qs = new URLSearchParams({ on_conflict: 'user_id,provider' }).toString();
  const r = await fetch(cfg.url + '/rest/v1/user_oauth_tokens?' + qs, {
    method: 'POST',
    headers: {
      apikey: cfg.key,
      Authorization: 'Bearer ' + cfg.key,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error('upsert user oauth token failed');
  return payload;
}
async function deleteUserTokenRow(userId, provider) {
  const cfg = supabaseConfig();
  if (!cfg) return null;
  const url = cfg.url + '/rest/v1/user_oauth_tokens?user_id=eq.' + encodeURIComponent(userId) + '&provider=eq.' + encodeURIComponent(provider);
  const r = await fetch(url, {
    method: 'DELETE',
    headers: {
      apikey: cfg.key,
      Authorization: 'Bearer ' + cfg.key,
      Accept: 'application/json',
    },
  });
  return r.ok;
}
function stateCookieValue(userId, rawState) {
  return userId + ':' + rawState;
}
function parseStateCookie(req, cookieName) {
  const cookies = parseCookies(req);
  const raw = cookies[cookieName];
  if (!raw) return null;
  const i = raw.indexOf(':');
  if (i <= 0) return null;
  return { userId: raw.slice(0, i), state: raw.slice(i + 1) };
}

module.exports = {
  crypto, AUTH_URL, TOKEN_URL, API_BASE, SCOPE, PROVIDER, getOrigin, redirectUri, isHttps,
  parseCookies, cookie, clearCookie, creds, tokenRequest,
  getBearerToken, getAuthenticatedUser, requireAuth,
  supabaseConfig, authUserTokenRow, upsertUserTokenRow, deleteUserTokenRow,
  stateCookieValue, parseStateCookie,
};
