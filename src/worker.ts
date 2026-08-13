export interface Env {
  TURNSTILE_SITEKEY: string;
  TURNSTILE_SECRET: string;
  ASSETS: Fetcher;
}

// Explicit rendering: api.js calls window.onloadTurnstileCallback once it is
// ready, and we render the widget into #turnstile. This is more reliable than
// implicit rendering (class="cf-turnstile"), which fails to re-render when the
// gate is served a second time (e.g. after a failed verification) because the
// browser dedupes the already-loaded api.js and never re-scans the DOM.
const GATE_HTML = (sitekey: string) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Verification Required</title>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback" async defer></script>
  <style>
    body { display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; }
    .gate { text-align: center; max-width: 360px; padding: 1.5rem; }
    .gate h1 { font-size: 1.5rem; margin-bottom: 1rem; }
    #turnstile { display: flex; justify-content: center; margin: 1rem auto; min-height: 65px; }
    .retry { margin-top: 1rem; }
    .retry button { padding: 0.5rem 1rem; background: #1e293b; color: #e2e8f0; border: 1px solid #334155; border-radius: 4px; cursor: pointer; }
    .retry button:hover { background: #334155; }
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
  </div>
  <script>
    var widgetId = null;
    window.onloadTurnstileCallback = function () {
      widgetId = turnstile.render('#turnstile', {
        sitekey: "${sitekey}",
        callback: function () {
          document.getElementById('verify-form').submit();
        },
        'error-callback': function () {
          document.getElementById('retry').hidden = false;
          return true;
        },
        'timeout-callback': function () {
          document.getElementById('retry').hidden = false;
        }
      });
    };
    // If api.js fails to load at all, show retry after a delay.
    setTimeout(function () {
      if (widgetId === null && typeof turnstile === 'undefined') {
        document.getElementById('retry').hidden = false;
      }
    }, 5000);
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
