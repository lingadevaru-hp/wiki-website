export interface Env {
  TURNSTILE_SITEKEY: string;
  TURNSTILE_SECRET: string;
  ASSETS: Fetcher;
}

const GATE_HTML = (sitekey: string) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verification Required</title>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  <style>
    body { display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; }
    .gate { text-align: center; }
    .gate h1 { font-size: 1.5rem; margin-bottom: 1rem; }
    #turnstile { margin: 1rem auto; }
  </style>
</head>
<body>
  <div class="gate">
    <h1>🔒 Please verify to continue</h1>
    <form id="verify-form" method="POST" action="/__turnstile_verify">
      <div id="turnstile" class="cf-turnstile" data-sitekey="${sitekey}" data-callback="onSuccess"></div>
    </form>
    <script>
      function onSuccess(token) {
        document.getElementById('verify-form').submit();
      }
    </script>
  </div>
</body>
</html>`;

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
          response: token,
        }),
      });

      const result = await verifyResponse.json() as { success: boolean };

      if (result.success) {
        return new Response(null, {
          status: 302,
          headers: {
            "Location": "/",
            "Set-Cookie": "turnstile-verified=true; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400",
          },
        });
      }

      return new Response(GATE_HTML(env.TURNSTILE_SITEKEY), {
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response(GATE_HTML(env.TURNSTILE_SITEKEY), {
      headers: { "Content-Type": "text/html" },
    });
  },
};
