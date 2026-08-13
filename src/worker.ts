const GATE_HTML = (sitekey: string, returnTo: string) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>lingadevaru.in — Verifying</title>
  <link rel="preconnect" href="https://challenges.cloudflare.com" />
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; background: #0a0f1e; color: #e2e8f0; }
    .gate { text-align: center; max-width: 400px; padding: 2.5rem 2rem; border: 1px solid #1e293b; border-radius: 12px; background: #0f172a; }
    .domain { font-size: 0.75rem; letter-spacing: 3px; text-transform: uppercase; color: #475569; margin-bottom: 1.5rem; }
    h1 { font-size: 1.25rem; font-weight: 600; color: #f1f5f9; margin-bottom: 0.4rem; }
    .sub { font-size: 0.8rem; color: #64748b; margin-bottom: 1.75rem; }
    .cf-turnstile { display: flex; justify-content: center; margin: 0 auto; min-height: 65px; }
    .footer { font-size: 0.72rem; color: #334155; margin-top: 1.5rem; }
    #err { color: #f87171; font-size: 0.8rem; margin-top: 0.75rem; display: none; }
  </style>
</head>
<body>
  <div class="gate">
    <p class="domain">lingadevaru.in</p>
    <h1>🔐 Verifying your access</h1>
    <p class="sub">Running a quick security check before you proceed.</p>
    <form id="verify-form" method="POST" action="/__turnstile_verify">
      <div class="cf-turnstile" data-sitekey="${sitekey}" data-theme="dark" data-callback="onVerify" data-error-callback="onError" data-appearance="always"></div>
      <input type="hidden" name="return_to" value="${returnTo}">
    </form>
    <p id="err"></p>
    <p class="footer">Protected by Cloudflare Turnstile</p>
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
      err.textContent = "Verification error (" + code + "). Refresh to try again.";
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
            "Set-Cookie": "turnstile-verified=true; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=30",
            "Cache-Control": "no-store",
          },
        });
      }
      return new Response(GATE_HTML(env.TURNSTILE_SITEKEY, returnTo), { headers: HTML_HEADERS });
    }

    return new Response(GATE_HTML(env.TURNSTILE_SITEKEY, url.pathname), { headers: HTML_HEADERS });
  },
};
