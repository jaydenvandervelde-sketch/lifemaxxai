// GET /api/whoop/callback — WHOOP redirects here with ?code & ?state.
// Verifies state, ensures the request is for the authenticated user, exchanges the
// code for tokens server-side, and stores only server-side token rows tied to auth.uid().
const L = require('./_lib');

module.exports = async (req, res) => {
  const origin = L.getOrigin(req);
  const url = new URL(req.url, origin);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauthErr = url.searchParams.get('error');
  const secure = L.isHttps(req);
  const back = (status) => { res.statusCode = 302; res.setHeader('Location', '/?whoop=' + status); res.end(); };

  if (oauthErr) return back('denied');
  let auth;
  try { auth = await L.requireAuth(req); }
  catch (e) {
    return back('error');
  }

  const cookieState = L.parseStateCookie(req, 'whoop_state');
  if (!code || !state || !cookieState || cookieState.userId !== auth.userId || cookieState.state !== state) return back('error');

  let id, secret;
  try { ({ id, secret } = L.creds()); }
  catch (e) { res.statusCode = 500; res.end('WHOOP not configured'); return; }

  try {
    const tok = await L.tokenRequest({
      grant_type: 'authorization_code',
      code,
      client_id: id,
      client_secret: secret,
      redirect_uri: L.redirectUri(req),
    });
    if (tok.refresh_token) {
      await L.upsertUserTokenRow(auth.userId, L.PROVIDER, tok);
    }
    res.setHeader('Set-Cookie', [L.clearCookie('whoop_state', secure)]);
    return back(tok.refresh_token ? 'connected' : 'error');
  } catch (e) {
    return back('error');
  }
};
