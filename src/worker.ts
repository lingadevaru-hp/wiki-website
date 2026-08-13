const GATE_HTML = (sitekey: string, returnTo: string) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Verification Required</title>
  <link rel="preconnect" href="https://challenges.cloudflare.com" />
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  <style>
    body { display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; }
    .gate { text-align: center; max-width: 420px; padding: 1.5rem; }
    .gate h1 { font-size: 1.5rem; margin-bottom: 1.5rem; }
    .cf-turnstile { display: flex; justify-content: center; margin: 1rem auto; min-height: 65px; }
    .hint { font-size: 0.8rem; color: #94a3b8; margin-top: 1rem; }
    #err { color: #f87171; font-size: 0.85rem; margin-top: 0.5rem; display: none; }
  </style>
</head>
<body>
  <div class="gate">
    <h1>🔒 Please verify to continue</h1>
    <form id="verify-form" method="POST" action="/__turnstile_verify">
      <div class="cf-turnstile" data-sitekey="${sitekey}" data-theme="dark" data-callback="onVerify" data-error-callback="onError" data-appearance="always"></div>
      <input type="hidden" name="return_to" value="${returnTo}">
    </form>
    <p id="err"></p>
    <p class="hint">If the widget doesn't appear, disable ad blockers for this site.</p>
  </div>
  <script>
    function onVerify(token) {
      var form = document.getElementById("verify-form");
      var input = document.createElement("input");
      input.type = "hidden";
      input.name = "cf-turnstile-response";
      input.value = token;
      form.appendChild(input);
      form.submit();
    }
    function onError(code) {
      var err = document.getElementById("err");
      err.style.display = "block";
      err.textContent = "Verification error (" + code + "). Refresh the page to try again.";
    }
  </script>
</body>
</html>`;

const HTML_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store, no-cache, must-revalidate"
};

function getCookie(cookies: string, name: string): string | null {
  const match = cookies.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? match[1] : null;
}

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    const cookies = request.headers.get("Cookie") || "";
    const verified = getCookie(cookies, "turnstile-verified") === "true";

    if (verified) {
      return env.ASSETS.fetch(request);
    }

    // Let static assets through without the gate (favicon, images, css, js)
    const accept = request.headers.get("Accept") || "";
    if (!accept.includes("text/html")) {
      return env.ASSETS.fetch(request);
    }

    if (url.pathname === "/__turnstile_verify" && request.method === "POST") {
      const formData = await request.formData();
      const token = formData.get("cf-turnstile-response");
      const returnTo = (formData.get("return_to") as string) || "/";

      const verifyResponse = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            secret: env.TURNSTILE_SECRET,
            response: token || "",
          }),
        }
      );
      const result: any = await verifyResponse.json();

      if (result.success) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: returnTo,
            "Set-Cookie":
              "turnstile-verified=true; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400",
            "Cache-Control": "no-store",
          },
        });
      }
      return new Response(GATE_HTML(env.TURNSTILE_SITEKEY, returnTo), {
        headers: HTML_HEADERS,
      });
    }

    return new Response(GATE_HTML(env.TURNSTILE_SITEKEY, url.pathname), {
      headers: HTML_HEADERS,
    });
  },
};
