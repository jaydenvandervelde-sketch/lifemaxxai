// GET /api/whoop/login — kicks off the WHOOP OAuth flow (302 → whoop.com login).
const L = require('./_lib');

module.exports = (req, res) => {
  let id;
  try { id = L.creds().id; }
  catch (e) {
    res.statusCode = 500;
    res.setHeader("content-type", "text/html; charset=utf-8");
    const uri = String(L.redirectUri(req))
      .replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    res.end(
      "<!doctype html><html lang=\"en\"><head>" +
      "<meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
      "<title>Connect WHOOP — LifeMaxx AI</title>" +
      "<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">" +
      "<link href=\"https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Hanken+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap\" rel=\"stylesheet\">" +
      "<style>" +
      ":root{color-scheme:dark;--bg:#0C0C12;--bg-el:#15151F;--sur:rgba(255,255,255,0.028);--fg:#F3F2F8;--mu:rgba(243,242,248,0.50);--ms:rgba(243,242,248,0.74);--bd:rgba(255,255,255,0.08);--bds:rgba(255,255,255,0.17);--br:#8B7CFF;--br2:#C7BBFF;--bri:#130E2E;--brs:rgba(139,124,255,0.12);--brl:rgba(139,124,255,0.28);--brg:rgba(139,124,255,0.42);--g1:rgba(139,124,255,0.12);--g2:rgba(70,224,168,0.05);--ep:cubic-bezier(0.16,1,0.3,1);}" +
      "*{box-sizing:border-box;margin:0;padding:0;}" +
      "html,body{height:100%;}" +
      "body{background:var(--bg);color:var(--fg);font-family:'Hanken Grotesk',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased;display:grid;place-items:center;min-height:100dvh;padding:1.5rem;}" +
      "body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(58% 42% at 80% 8%,var(--g1),transparent 70%),radial-gradient(48% 38% at 14% 90%,var(--g2),transparent 72%);}" +
      ".w{position:relative;z-index:1;width:min(440px,100%);}" +
      ".logo{display:flex;align-items:center;gap:10px;margin-bottom:2rem;justify-content:center;}" +
      ".lm{width:36px;height:36px;border-radius:10px;background:var(--br);display:grid;place-items:center;box-shadow:0 0 20px var(--brg);}" +
      ".lm svg{width:20px;height:20px;fill:var(--bri);}" +
      ".lt{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:1.125rem;letter-spacing:-0.02em;}" +
      ".lt span{color:var(--br);}" +
      ".card{background:var(--bg-el);border:1px solid var(--bds);border-radius:18px;padding:2rem;box-shadow:0 1px 0 rgba(255,255,255,0.04) inset,0 28px 70px -16px rgba(0,0,0,0.75);}" +
      ".ey{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;letter-spacing:0.24em;text-transform:uppercase;color:var(--br);margin-bottom:0.5rem;}" +
      "h1{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:1.75rem;letter-spacing:-0.03em;line-height:1.1;margin-bottom:0.5rem;}" +
      ".desc{font-size:0.875rem;color:var(--mu);line-height:1.6;margin-bottom:1.5rem;}" +
      ".fl{display:flex;flex-direction:column;gap:6px;margin-bottom:1rem;}" +
      ".fl label{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:var(--mu);}" +
      ".fl input{width:100%;background:var(--sur);border:1px solid var(--bd);border-radius:11px;padding:10px 12px;color:var(--ms);font-family:'JetBrains Mono',monospace;font-size:13px;outline:none;transition:border-color 200ms var(--ep),box-shadow 200ms var(--ep);cursor:text;}" +
      ".fl input:focus{border-color:var(--brl);box-shadow:0 0 0 3px var(--brs);}" +
      ".note{margin:1.25rem 0;padding:0.75rem 1rem;border-left:2px solid var(--brl);background:var(--brs);border-radius:0 8px 8px 0;font-size:12px;line-height:1.65;color:var(--ms);}" +
      ".note strong{display:block;margin-bottom:0.4rem;font-weight:600;}" +
      ".note ol{margin:0 0 0 1.1rem;padding:0;}" +
      ".note li{margin:0.25rem 0;}" +
      ".note code,.note a{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--br2);background:rgba(139,124,255,0.15);padding:1px 5px;border-radius:4px;text-decoration:none;}" +
      ".note a:hover{background:rgba(139,124,255,0.28);}" +
      "hr{border:none;border-top:1px solid var(--bd);margin:1.25rem 0;}" +
      ".btn{display:flex;align-items:center;justify-content:center;padding:0.7rem 1.25rem;border-radius:11px;font-size:0.875rem;font-family:'Hanken Grotesk',sans-serif;font-weight:600;cursor:pointer;border:1px solid var(--bd);text-decoration:none;color:var(--ms);background:transparent;transition:all 200ms var(--ep);}" +
      ".btn:hover{border-color:var(--bds);background:var(--sur);color:var(--fg);}" +
      "</style></head>" +
      "<body><div class=\"w\">" +
      "<div class=\"logo\">" +
      "<div class=\"lm\"><svg viewBox=\"0 0 24 24\"><path d=\"M13 2L3 14h9l-1 8 10-12h-9l1-8z\"/></svg></div>" +
      "<span class=\"lt\">LifeMaxx <span>AI</span></span>" +
      "</div>" +
      "<div class=\"card\">" +
      "<div class=\"ey\">Integration Setup</div>" +
      "<h1>Connect WHOOP</h1>" +
      "<p class=\"desc\">Your WHOOP integration isn&#39;t configured yet. Set the two environment variables in Vercel and register the redirect URL below in your WHOOP developer app.</p>" +
      "<div class=\"fl\">" +
      "<label>Redirect URL — paste this into your WHOOP app</label>" +
      "<input type=\"text\" value=\"" + uri + "\" readonly onclick=\"this.select()\">" +
      "</div>" +
      "<div class=\"note\">" +
      "<strong>Setup steps</strong>" +
      "<ol>" +
      "<li>Open your app at the <a href=\"https://developer.whoop.com\" target=\"_blank\">WHOOP developer portal</a>.</li>" +
      "<li>Add the redirect URL above to your app&#39;s allowed redirect URLs.</li>" +
      "<li>Copy your Client ID and Client Secret.</li>" +
      "<li>In Vercel → Settings → Environment Variables, add <code>WHOOP_CLIENT_ID</code> and <code>WHOOP_CLIENT_SECRET</code>.</li>" +
      "<li>Redeploy, then return here to connect.</li>" +
      "</ol>" +
      "</div>" +
      "<hr>" +
      "<a href=\"/\" class=\"btn\">← Back to dashboard</a>" +
      "</div></div></body></html>"
    );
    return;
  }
  const state = L.crypto.randomBytes(12).toString("hex");
  res.setHeader("Set-Cookie", L.cookie("whoop_state", state, { maxAge: 600, secure: L.isHttps(req) }));
  const params = new URLSearchParams({
    response_type: "code",
    client_id: id,
    redirect_uri: L.redirectUri(req),
    scope: L.SCOPE,
    state,
  });
  res.statusCode = 302;
  res.setHeader("Location", L.AUTH_URL + "?" + params.toString());
  res.end();
};
