/* 
* Cloud sync.js - A tiny, self-contained "Cloud sync" button.
* 
* Drop-in: Include AFTER supabase-js + db.js on any page:
* <script src="https://jsdelivr.net"></script>
* <script src="js/db.js"></script>
* <script src="js/cloud-sync.js"></script>
*/

// It appends its own floating button panel. It never touches the page's
// own DOM/renderer, so it can't break anything. The user pastes their Supabase
// Project URL + anon key once; we save them to the shared keys every page loads
// (po_supabase_url / po_supabase_key) and reload so sync turns on everywhere.

(function () {
  if (window._patroncloudUI) return;
  window._patroncloudUI = true;

  var URL_KEY = 'po_supabase_url', ANON_KEY = 'po_supabase_key';
  function getUrl() { return (localStorage.getItem(URL_KEY) || '').trim(); }
  function getKey() { return (localStorage.getItem(ANON_KEY) || '').trim(); }
  // Connected = either keys are pasted OR db.js has a working (baked-in) connection.
  function connected() { return (window.PatronDb && PatronDb.isCloud()) || ((getUrl() && getKey())); }

  var style = document.createElement('style');
  style.textContent = 
    '#csBtn{position:fixed;right:14px;top:14px;z-index:2147483647;border:none;background:var(--brand-line,#rgba(139,124,255,.4));color:#fff;padding:8px 14px;border-radius:4px;cursor:pointer;font-family:var(--font-serif,inherit);font-size:.85rem;font-weight:600;display:flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(0,0,0,.3);transition:transform .15s,opacity .15s}' +
    '#csBtn:hover{transform:translateY(-1px);opacity:.95}' +
    '#csBtn.connected{background:rgba(20,20,25,.8);color:var(--text-muted,#8a8a93);box-shadow:none;border:1px solid var(--border-strong,rgba(255,255,255,.15))}' +
    '#csOverlay{position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px);animation:csFadeIn .2s ease-out}' +
    '#csCard{width:min(440px,92%);background:var(--bg-elevated,#15151f);border:1px solid var(--border-strong,rgba(255,255,255,.15));border-radius:12px;padding:24px;box-shadow:0 12px 36px rgba(0,0,0,.5);font-family:var(--font-sans,inherit);color:#fff}' +
    '#csCard h2{font-family:var(--font-serif,inherit);font-size:1.4rem;margin:0 0 4px}' +
    '#csCard p{font-size:.85rem;line-height:1.5;color:var(--text-muted,#8a8a93);margin:0 0 16px}' +
    '#csCard label{display:block;font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted,#8a8a93);margin:0 0 4px;font-weight:700}' +
    '#csCard input{width:100%;box-sizing:border-box;border-radius:6px;padding:10px 12px;background:var(--card-elevated,#1e1e2f);border:1px solid var(--border-strong,rgba(255,255,255,.15));color:#fff;font-family:monospace;font-size:.8rem;margin:0 0 14px}' +
    '#csCard input:focus{border-color:var(--brand-line,rgba(139,124,255,.8));outline:none}' +
    '#csRow{display:flex;gap:10px;margin-top:6px}' +
    '.csBtnAction{flex:1;border:none;padding:10px;border-radius:6px;font-weight:600;font-size:.85rem;cursor:pointer;transition:opacity .15s}' +
    '.csBtnAction:hover{opacity:.9}' +
    '#csSave{background:var(--brand-line,#8b7cff);color:#fff}' +
    '#csDisconnect{background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.3)}' +
    '#csClose{background:transparent;color:var(--text-muted,#8a8a93);border:1px solid var(--border-strong,rgba(255,255,255,.15))}' +
    '@keyframes csFadeIn{from{opacity:0}to{opacity:1}}';
  document.head.appendChild(style);

  var btn = document.createElement('button');
  btn.id = 'csBtn';
  if (connected()) {
    btn.className = 'connected';
    btn.innerHTML = '☁️ Connected';
  } else {
    btn.innerHTML = '☁️ Connect Cloud';
  }
  document.body.appendChild(btn);

  btn.onclick = function () {
    if (document.getElementById('csOverlay')) return;

    var ov = document.createElement('div');
    ov.id = 'csOverlay';

    var isConn = connected();
    var html = '<div id="csCard">' +
      '<h2>Cloud Sync Settings</h2>' +
      '<p>Sync your biometric tokens directly with your Supabase schema ledger.</p>';

    if (isConn) {
      html += '<p style="color:#22c55e;font-weight:600">✓ Your application layer is securely linked.</p>' +
              '<div id="csRow">' +
                '<button id="csDisconnect" class="csBtnAction">Disconnect</button>' +
                '<button id="csClose" class="csBtnAction">Close</button>' +
              '</div>';
    } else {
      html += '<label>Supabase Project URL</label>' +
              '<input id="csInUrl" type="text" placeholder="https://supabase.co">' +
              '<label>Supabase Anon Key</label>' +
              '<input id="csInKey" type="text" placeholder="eyJhbGciOi...">' +
              '<div id="csRow">' +
                '<button id="csClose" class="csBtnAction">Cancel</button>' +
                '<button id="csSave" class="csBtnAction">Save & Connect</button>' +
              '</div>';
    }

    html += '</div>';
    ov.innerHTML = html;
    document.body.appendChild(ov);

    if (!isConn) {
      document.getElementById('csInUrl').value = getUrl();
      document.getElementById('csInKey').value = getKey();
      document.getElementById('csSave').onclick = function () {
        var u = document.getElementById('csInUrl').value.trim();
        var k = document.getElementById('csInKey').value.trim();
        if (!u || !k) return alert('Please fill in both credential configuration lines.');
        localStorage.setItem(URL_KEY, u);
        localStorage.setItem(ANON_KEY, k);
        location.reload();
      };
    } else {
      var dc = document.getElementById('csDisconnect');
      if (dc) dc.onclick = function () { 
        localStorage.removeItem(URL_KEY); 
        localStorage.removeItem(ANON_KEY); 
        location.reload(); 
      };
    }

    document.getElementById('csClose').onclick = function () { ov.remove(); };
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
  };

  // --- STRICT ONLINE PRODUCTION OAUTH LOGIC ---
  window.syncWhoop = function() {
    // 1. Paste your real WHOOP Client ID between the quotes below
    const clientId = "YOUR_REAL_WHOOP_CLIENT_ID_HERE";
    
    // Explicit production link routing bypasses platform resolution issues
    const redirectUrl = "https://vercel.app";
    const redirectUri = encodeURIComponent(redirectUrl);
    
    // OAuth permission targets
    const scopes = encodeURIComponent("offline read:recovery read:sleep read:workout");
    
    // Construct target WHOOP authorization endpoint
    const whoopAuthUrl = `https://whoop.com{clientId}&redirect_uri=${redirectUri}&scope=${scopes}`;
    
    // Route browser to credential entry point
    window.location.href = whoopAuthUrl;
  };

})();
