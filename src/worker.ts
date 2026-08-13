export interface Env {
  TURNSTILE_SITEKEY: string;
  TURNSTILE_SECRET: string;
  ASSETS: Fetcher;
}

// Explicit rendering with full error surfacing. The previous version silently
// showed a blank gate when Turnstile failed to render (e.g. sitekey not
// authorized for the hostname, or api.js blocked). This version surfaces the
// exact Turnstile error code so the root cause is visible on the page.
const GATE_HTML = (sitekey: string) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Verification Required</title>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback" async defer></script>
  <style>
    body { display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; }
    .gate { text-align: center; max-width: 420px; padding: 1.5rem; }
    .gate h1 { font-size: 1.5rem; margin-bottom: 1rem; }
    #turnstile { display: flex; justify-content: center; margin: 1rem auto; min-height: 65px; }
    .retry { margin-top: 1rem; }
    .retry button { padding: 0.5rem 1rem; background: #1e293b; color: #e2e8f0; border: 1px solid #334155; border-radius: 4px; cursor: pointer; }
    .retry button:hover { background: #334155; }
    .diag { margin-top: 1.5rem; font-size: 0.75rem; color: #94a3b8; text-align: left; background: #1e293b; border: 1px solid #334155; border-radius: 4px; padding: 0.75rem; white-space: pre-wrap; word-break: break-all; }
    .diag code { color: #fbbf24; }
    .status { font-size: 0.8rem; color: #94a3b8; margin-top: 0.5rem; }
  </style>
</head>
<body>
  <div class="gate">
    <h1>🔒 Please verify to continue</h1>
    <form id="verify-form" method="POST" action="/__turnstile_verify">
      <div id="turnstile"></div>
      <noscript>
        <p style="color:#f87171">JavaScript is required to verify.</p>
      </noscript>
    </form>
    <div class="retry" id="retry" hidden>
      <button type="button" onclick="location.reload()">Retry verification</button>
    </div>
    <div class="status" id="status">Loading verification widget…</div>
    <div class="diag" id="diag" hidden></div>
  </div>
  <script>
    var widgetId = null;
    var statusEl = document.getElementById('status');
    var diagEl = document.getElementById('diag');
    var retryEl = document.getElementById('retry');

    function showDiag(msg) {
      diagEl.hidden = false;
      diagEl.textContent = msg;
      statusEl.textContent = 'Verification widget could not load.';
      retryEl.hidden = false;
    }

    window.onloadTurnstileCallback = function () {
      statusEl.textContent = 'Rendering widget…';
      try {
        widgetId = turnstile.render('#turnstile', {
          sitekey: "${sitekey}",
          callback: function () {
            statusEl.textContent = 'Verified! Loading…';
            document.getElementById('verify-form').submit();
          },
          'error-callback': function (code) {
            showDiag(
              'Turnstile failed to render.\\n\\n' +
              'Error code: ' + code + '\\n\\n' +
              'Sitekey: ${sitekey}\\n' +
              'Hostname: ' + location.hostname + '\\n\\n' +
              'Most common cause: the sitekey above is not authorized for ' +
              'this hostname in your Cloudflare Turnstile widget settings.\\n' +
              'Fix: Cloudflare dashboard → Turnstile → your widget → ' +
              'Settings → Hostname Management → add: ' + location.hostname
            );
            return true;
          },
          'timeout-callback': function () {
            showDiag('Turnstile challenge timed out. Retry.');
          }
        });
        if (widgetId === null || widgetId === undefined) {
          showDiag('turnstile.render() returned no widget id (sitekey ' +
            'rejected). Check that the sitekey is valid and authorized.');
        }
      } catch (e) {
        showDiag('Turnstile render threw: ' + (e && e.message ? e.message : e));
      }
    };

    // If api.js fails to load at all (blocked, network error, etc.), surface it.
    setTimeout(function () {
      if (widgetId === null) {
        if (typeof turnstile === 'undefined') {
          showDiag(
            'Turnstile script (api.js) failed to load from ' +
            'challenges.cloudflare.com.\\n\\n' +
            'Possible causes:\\n' +
            '- A browser extension (ad/tracker blocker) is blocking it\\n' +
            '- Your network or region is blocking Cloudflare\\n' +
            '- The script tag was removed by a CSP rule\\n\\n' +
            'If this happens for ALL visitors, the cause is server-side: ' +
            'check the Turnstile widget hostname settings in the ' +
            'Cloudflare dashboard.'
          );
        } else {
          showDiag('Turnstile script loaded but no widget rendered. ' +
            'Sitekey may be rejected for this hostname.');
        }
      }
    }, 6000);
  </script>
</body>
</html>`;

const HTML_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    const cookies = request.headers.get("Cookie") || "";
    const verified = cookies.includes("turnstile-verified=true");

    if (verified) {
      return env.ASSETS.fetch(request);
    }

    if (url.pathname === "/__turnstile_verify" && request.method === "POST") {
      const formData = await request.formData();
      const token = formData.get("cf-turnstile-response") as string;

      const verifyResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET,
          response: token || "",
        }),
      });

      const result = await verifyResponse.json() as { success: boolean };

      if (result.success) {
        return new Response(null, {
          status: 302,
          headers: {
            "Location": "/",
            "Set-Cookie": "turnstile-verified=true; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400",
            "Cache-Control": "no-store",
          },
        });
      }

      return new Response(GATE_HTML(env.TURNSTILE_SITEKEY), {
        headers: HTML_HEADERS,
      });
    }

    return new Response(GATE_HTML(env.TURNSTILE_SITEKEY), {
      headers: HTML_HEADERS,
    });
  },
};
