// GET /api/fitbit/logout — disconnects the authenticated user's Fitbit token.
const L = require('./_lib');

module.exports = async (req, res) => {
  const secure = L.isHttps(req);
  let auth;
  try { auth = await L.requireAuth(req); }
  catch (e) {
    res.statusCode = 401;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ connected: false, error: 'auth_required' }));
    return;
  }
  await L.deleteUserTokenRow(auth.userId, L.PROVIDER).catch(() => {});
  res.setHeader('Set-Cookie', [L.clearCookie('fitbit_state', secure)]);
  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ connected: false }));
};
