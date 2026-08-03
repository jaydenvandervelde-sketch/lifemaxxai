// Shared helpers for the WHOOP OAuth serverless functions (Vercel, Node runtime).
// The client secret lives only here (server-side, from env). Tokens are kept in
// httpOnly cookies — never exposed to the browser. No database required.
const crypto = require('crypto');

const AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth';
const TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';
const API_BASE = 'https://api.prod.whoop.com/developer';
const SCOPE = 'read:recovery read:sleep read:cycles read:profile offline';

function getOrigin(req) {
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return proto + '://' + host;
}
function redirectUri(req) {
  // Production is pinned to the canonical domain: building this from req.headers.host
  // instead would send whatever host the request arrived on to WHOOP, and that has to
  // match a redirect URI registered in the WHOOP developer app exactly or their
  // Hydra-backed OAuth server rejects it with invalid_request.
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

// Optional server-side persistence for WHOOP tokens in Supabase, so they survive
// across devices and serverless cold starts instead of living only in a cookie.
// This app is single-tenant per deployment (see supabase-schema.sql — "your
// project's keys are your identity"), so this is a singleton row, not a per-user
// table. Uses the SERVICE ROLE key (server-only env var) so the table can stay
// locked down to anon/authenticated clients via RLS — unlike the browser-writable
// app_state table, WHOOP refresh tokens must never be reachable with the public
// anon key. Falls back to the httpOnly cookie when Supabase isn't configured, so
// forks without it keep working exactly as before.
const WHOOP_TOKENS_ROW_ID = 'default';
function supabaseConfig() {
  const url = (process.env.SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  return url && key ? { url, key } : null;
}
async function supabaseRest(path, opts) {
  const cfg = supabaseConfig();
  if (!cfg) return null;
  const r = await fetch(cfg.url + '/rest/v1' + path, Object.assign({
    headers: Object.assign({
      apikey: cfg.key,
      Authorization: 'Bearer ' + cfg.key,
      'content-type': 'application/json',
    }, (opts && opts.headers) || {}),
  }, opts));
  if (!r.ok) { const t = await r.text().catch(() => ''); const e = new Error('supabase ' + r.status + ' ' + t); e.status = r.status; throw e; }
  return r.status === 204 ? null : r.json().catch(() => null);
}
function whoopTokensConfigured() { return !!supabaseConfig(); }
async function getWhoopTokens() {
  const rows = await supabaseRest('/user_whoop_tokens?id=eq.' + WHOOP_TOKENS_ROW_ID + '&select=refresh_token,access_token,expires_at', { method: 'GET' });
  return rows && rows[0] ? rows[0] : null;
}
async function upsertWhoopTokens(tok) {
  const expiresAt = tok.expires_in ? new Date(Date.now() + tok.expires_in * 1000).toISOString() : null;
  await supabaseRest('/user_whoop_tokens', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      id: WHOOP_TOKENS_ROW_ID,
      access_token: tok.access_token || null,
      refresh_token: tok.refresh_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }),
  });
}
async function deleteWhoopTokens() {
  await supabaseRest('/user_whoop_tokens?id=eq.' + WHOOP_TOKENS_ROW_ID, { method: 'DELETE' });
}

module.exports = {
  crypto, AUTH_URL, TOKEN_URL, API_BASE, SCOPE, getOrigin, redirectUri, isHttps,
  parseCookies, cookie, clearCookie, creds, tokenRequest,
  whoopTokensConfigured, getWhoopTokens, upsertWhoopTokens, deleteWhoopTokens,
};
